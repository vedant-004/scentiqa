import { NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';

// GET /api/collection/recommend?owned=id1,id2,...
// Real wardrobe-gap analysis: maps owned perfumes' accords to scent families,
// finds the least-covered families, and recommends highly-rated perfumes that
// are prominent in those families. No invented scores — the fit score derives
// from the candidate's accord prominence in the gap family.

interface Accord { name: string; strength: number | null }

function normalizeAccords(raw: unknown): Accord[] {
  if (!Array.isArray(raw)) return [];
  const out: Accord[] = [];
  for (const a of raw) {
    if (typeof a === 'string') { if (a.trim()) out.push({ name: a, strength: null }); continue; }
    if (a && typeof a === 'object') {
      const r = a as Record<string, unknown>;
      if (typeof r.name === 'string' && r.name.trim()) {
        out.push({ name: r.name, strength: typeof r.strength === 'number' ? r.strength : null });
      }
    }
  }
  return out;
}

/** Normalize note pyramid fields (top/heart/base) to plain name strings. */
function normalizeNoteNames(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  const out: string[] = [];
  for (const n of raw) {
    if (typeof n === 'string') { if (n.trim()) out.push(n.trim()); continue; }
    if (n && typeof n === 'object') {
      const r = n as Record<string, unknown>;
      if (typeof r.name === 'string' && r.name.trim()) out.push(r.name.trim());
    }
  }
  return out;
}

const FAMILIES: Array<{ name: string; keys: string[] }> = [
  { name: 'Citrus', keys: ['citrus', 'bergamot', 'lemon', 'lime', 'orange', 'grapefruit', 'yuzu', 'neroli', 'petitgrain'] },
  { name: 'Aquatic & fresh', keys: ['aquatic', 'marine', 'ozonic', 'calone'] },
  { name: 'Green & herbal', keys: ['green', 'herbal', 'aromatic', 'sage', 'basil', 'mint'] },
  { name: 'Floral', keys: ['floral', 'rose', 'jasmine', 'peony', 'lily', 'violet', 'iris', 'orange blossom', 'ylang'] },
  { name: 'Fruity', keys: ['fruity', 'apple', 'pear', 'berry', 'berries', 'pineapple', 'mango', 'coconut', 'plum', 'cherry'] },
  { name: 'Sweet gourmand', keys: ['gourmand', 'caramel', 'chocolate', 'coffee', 'honey', 'praline'] },
  { name: 'Vanilla & balsamic', keys: ['vanilla', 'balsamic', 'benzoin', 'tonka', 'myrrh'] },
  { name: 'Powdery musk', keys: ['powdery', 'musky', 'musk', 'ambrette'] },
  { name: 'Woody', keys: ['woody', 'cedar', 'sandalwood', 'vetiver', 'oud wood'] },
  { name: 'Amber', keys: ['amber', 'ambergris', 'amberwood'] },
  { name: 'Oud, smoke & leather', keys: ['oud', 'smoky', 'smoke', 'incense', 'leather', 'tobacco', 'birch'] },
  { name: 'Spicy', keys: ['spicy', 'pepper', 'cinnamon', 'cardamom', 'saffron', 'nutmeg', 'clove'] },
  { name: 'Earthy & mossy', keys: ['earthy', 'mossy', 'oakmoss', 'patchouli', 'soil'] },
];

function familyOf(accordName: string): string | null {
  const nl = accordName.toLowerCase();
  for (const f of FAMILIES) {
    if (f.keys.some((k) => nl.includes(k))) return f.name;
  }
  return null;
}

/** Rank-weighted family prominence of an accord list (rank 1 = most prominent). */
function familyProminence(accords: Accord[]): Map<string, number> {
  const m = new Map<string, number>();
  accords.forEach((a, i) => {
    const f = familyOf(a.name);
    if (!f) return;
    m.set(f, (m.get(f) ?? 0) + 1 / (i + 1));
  });
  return m;
}

export async function GET(req: Request) {
  const sb = getSupabaseServer();
  if (!sb) return NextResponse.json({ error: 'Not configured' }, { status: 500 });
  const owned = (new URL(req.url).searchParams.get('owned') ?? '').split(',').map((s) => s.trim()).filter(Boolean).slice(0, 300);
  if (owned.length === 0) return NextResponse.json({ gaps: [], recommendations: [] });

  // 0. Build the exclusion set: owned perfumes + their dupes/clones (both directions).
  // A dupe of something you own is not a "missing piece".
  const excludeIds = new Set<string>(owned);
  try {
    const { data: asOriginal } = await sb.from('dupe_relationships')
      .select('dupe_perfume_id').in('original_perfume_id', owned);
    for (const r of (asOriginal ?? []) as Array<{ dupe_perfume_id: string }>) {
      if (r.dupe_perfume_id) excludeIds.add(r.dupe_perfume_id);
    }
    const { data: asDupe } = await sb.from('dupe_relationships')
      .select('original_perfume_id').in('dupe_perfume_id', owned);
    for (const r of (asDupe ?? []) as Array<{ original_perfume_id: string }>) {
      if (r.original_perfume_id) excludeIds.add(r.original_perfume_id);
    }
  } catch { /* dupe table unavailable — fall back to owned-only exclusion */ }

  // 1. Coverage of each family across the owned wardrobe.
  // Uses BOTH accord data and the published note pyramid (top/heart/base notes),
  // so a wardrobe with bergamot in its notes correctly counts toward Citrus.
  const { data: ownedRows } = await sb.from('perfumes')
    .select('id, accords, top_notes, heart_notes, base_notes').in('id', owned);
  const coverage = new Map<string, number>();
  const addCoverage = (names: string[], weight: number) => {
    for (const n of names) {
      const f = familyOf(n);
      if (!f) continue;
      coverage.set(f, (coverage.get(f) ?? 0) + weight);
    }
  };
  for (const r of (ownedRows ?? []) as Array<{ accords: unknown; top_notes: unknown; heart_notes: unknown; base_notes: unknown }>) {
    for (const [f, w] of familyProminence(normalizeAccords(r.accords))) {
      coverage.set(f, (coverage.get(f) ?? 0) + w);
    }
    // Note pyramid contributes too (lighter weight than accords).
    addCoverage(normalizeNoteNames(r.top_notes), 0.5);
    addCoverage(normalizeNoteNames(r.heart_notes), 0.35);
    addCoverage(normalizeNoteNames(r.base_notes), 0.25);
  }
  const gaps = FAMILIES.map((f) => f.name)
    .sort((a, b) => (coverage.get(a) ?? 0) - (coverage.get(b) ?? 0))
    .slice(0, 4);
  const gapSet = new Set(gaps);

  // 2. Candidate pool: well-rated perfumes with accord data, excluding owned + their dupes.
  const { data: pool } = await sb.from('perfumes')
    .select('id, slug, name, accords, rating_avg, rating_count, houses(name)')
    .order('rating_count', { ascending: false })
    .limit(1000);

  const recs: Array<{ id: string; slug: string; name: string; house: string; score: number; reason: string; gap: string }> = [];
  for (const r of (pool ?? []) as Array<{ id: string; slug: string; name: string; accords: unknown; rating_avg: number | null; rating_count: number | null; houses: unknown }>) {
    if (excludeIds.has(r.id)) continue;
    const accords = normalizeAccords(r.accords);
    if (accords.length === 0) continue;
    const prom = familyProminence(accords);
    let bestGap: string | null = null;
    let bestW = 0;
    for (const g of gapSet) {
      const w = prom.get(g) ?? 0;
      if (w > bestW) { bestW = w; bestGap = g; }
    }
    if (!bestGap || bestW <= 0) continue;
    // Fit score from real signals — varies per candidate:
    //  - gap-family prominence (0..~2): how strongly the candidate fills the gap
    //  - community rating (0..5): how well-regarded it is
    //  - rating count (log scale): how much community signal backs it
    // Result is a 55–97 spread, never a flat 98 for everyone.
    const prominence01 = Math.min(1, bestW);
    const rating01 = Math.min(1, (r.rating_avg ?? 0) / 5);
    const countBoost = Math.min(1, Math.log10(1 + (r.rating_count ?? 0)) / 3);
    const score = Math.round(
      55 + 25 * prominence01 + 12 * rating01 + 5 * countBoost
    );
    const houseRel = r.houses as { name: string } | Array<{ name: string }> | null;
    recs.push({
      id: r.id, slug: r.slug, name: r.name,
      house: Array.isArray(houseRel) ? (houseRel[0]?.name ?? '') : (houseRel?.name ?? ''),
      score: Math.min(97, Math.max(55, score)),
      reason: `Strong ${bestGap.toLowerCase()} character — the lightest corner of your wardrobe`,
      gap: bestGap,
    });
  }
  recs.sort((a, b) => b.score - a.score);

  return NextResponse.json({ gaps, recommendations: recs.slice(0, 12) });
}
