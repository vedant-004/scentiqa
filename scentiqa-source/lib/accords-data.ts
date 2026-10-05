// Accords encyclopedia data: maps each accord to the perfumes built around it.
import { cache } from 'react';
import { getSupabaseServer } from './supabase';

export interface AccordPerfumeRef {
  id: string; slug: string; name: string; house: string;
  bottleImage: string | null; ratingAvg: number; strength: number | null;
}

export interface AccordIndexData {
  /** normalized accord name -> perfumes sorted by strength desc */
  index: Map<string, AccordPerfumeRef[]>;
  /** perfume id -> set of normalized accord names */
  perfumeAccords: Map<string, Set<string>>;
  /** normalized accord name -> display name (first-seen casing) */
  displayNames: Map<string, string>;
  /** normalized accord name -> average strength */
  avgStrength: Map<string, number>;
}

const norm = (s: string) => s.toLowerCase().trim();
export const accordSlug = (name: string) => norm(name).replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

/** Parse accord strength: numeric as-is; legacy label strings mapped to numbers.
 *  Returns null when no strength data exists — we never invent a value. */
function parseStrength(v: unknown): number | null {
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  const s = String(v ?? '').toLowerCase().trim();
  if (!s) return null;
  const map: Record<string, number> = {
    'very high': 90, 'high': 75, 'moderate': 55, 'medium': 55,
    'low': 35, 'very low': 20, 'trace': 10,
  };
  if (s in map) return map[s];
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

export const getAccordIndex = cache(async (): Promise<AccordIndexData> => {
  const data: AccordIndexData = { index: new Map(), perfumeAccords: new Map(), displayNames: new Map(), avgStrength: new Map() };
  const c = getSupabaseServer();
  if (!c) return data;
  const strengthSum = new Map<string, number>();
  const strengthN = new Map<string, number>();
  let offset = 0;
  for (;;) {
    const { data: rows } = await c.from('perfumes')
      .select('id,slug,name,bottle_image_url,rating_avg,accords,houses(name)')
      .range(offset, offset + 999);
    if (!rows?.length) break;
    for (const p of rows as Record<string, unknown>[]) {
      const seen = new Set<string>();
      for (const a of (p.accords as Array<{ name?: string; strength?: number | null }>) ?? []) {
        const raw = String(a?.name ?? '').trim();
        const k = norm(raw);
        if (!k) continue;
        const strength = parseStrength(a?.strength);
        if (!data.displayNames.has(k)) data.displayNames.set(k, raw);
        const ref: AccordPerfumeRef = {
          id: p.id as string, slug: p.slug as string, name: p.name as string,
          house: ((p.houses as Record<string, string> | null)?.name) ?? '',
          bottleImage: (p.bottle_image_url as string) ?? null,
          ratingAvg: Number(p.rating_avg ?? 0), strength,
        };
        const arr = data.index.get(k) ?? [];
        arr.push(ref);
        data.index.set(k, arr);
        seen.add(k);
        // Average only over perfumes that actually have strength data.
        if (strength !== null) {
          strengthSum.set(k, (strengthSum.get(k) ?? 0) + strength);
          strengthN.set(k, (strengthN.get(k) ?? 0) + 1);
        }
      }
      data.perfumeAccords.set(p.id as string, seen);
    }
    offset += 1000;
    if (rows.length < 1000) break;
  }
  for (const [k, arr] of data.index) {
    // Known strengths first (desc), then rating as tiebreak; unknown strengths last.
    arr.sort((a, b) => (b.strength ?? -1) - (a.strength ?? -1) || b.ratingAvg - a.ratingAvg);
    const n = strengthN.get(k) ?? 0;
    if (n > 0) data.avgStrength.set(k, Math.round((strengthSum.get(k) ?? 0) / n));
  }
  return data;
});

export async function getAccordDescription(slug: string): Promise<string | null> {
  try {
    const { promises: fs } = await import('fs');
    const { default: path } = await import('path');
    const raw = await fs.readFile(path.join(process.cwd(), 'public', 'ml', 'accord-descriptions.json'), 'utf8');
    const map = JSON.parse(raw) as Record<string, string>;
    return map[slug] ?? null;
  } catch {
    return null;
  }
}
