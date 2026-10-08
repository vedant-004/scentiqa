// lib/seo.ts — data helpers for programmatic SEO landing pages (/dupes, /vs, /best-perfumes).
// Everything comes from the live catalog; nothing is invented.
import { getSupabaseServer } from './supabase';
import type { Accord } from './types';

const sb = () => getSupabaseServer();

export interface SeoPerfume {
  slug: string; name: string; house: string; houseSlug: string;
  ratingAvg: number; ratingCount: number; lowestPriceInr: number | null;
  accords: Accord[]; concentration: string; bottleImage: string | null;
  heatLongevity?: number | null; summerRating?: number | null; monsoonRating?: number | null;
}

function normalizeAccords(raw: unknown): Accord[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((a) => {
    if (typeof a === 'string') return { name: a, strength: null };
    if (a && typeof a === 'object') {
      const r = a as Record<string, unknown>;
      if (typeof r.name !== 'string' || !r.name.trim()) return null;
      const s = r.strength;
      return { name: r.name, strength: typeof s === 'number' && Number.isFinite(s) ? s : null };
    }
    return null;
  }).filter((a): a is Accord => a !== null);
}

type RawRow = Record<string, unknown> & {
  slug: string; name: string; rating_avg?: number; rating_count?: number;
  lowest_price_inr?: number; accords?: unknown; concentration?: string; bottle_image_url?: string;
  houses?: { name?: string; slug?: string } | null;
};

function mapSeoPerfume(r: RawRow): SeoPerfume {
  return {
    slug: r.slug, name: r.name,
    house: r.houses?.name ?? '', houseSlug: r.houses?.slug ?? '',
    ratingAvg: Number(r.rating_avg ?? 0), ratingCount: Number(r.rating_count ?? 0),
    lowestPriceInr: (r.lowest_price_inr as number) ?? null,
    accords: normalizeAccords(r.accords),
    concentration: (r.concentration as string) ?? '', bottleImage: (r.bottle_image_url as string) ?? null,
  };
}

const PERFUME_COLS = 'slug, name, houses(name,slug), rating_avg, rating_count, lowest_price_inr, accords, concentration, bottle_image_url';

/* ---------- Dupe guides ---------- */

export interface DupeGuideInfo { slug: string; name: string; house: string; dupeCount: number; }

/** Originals with at least 2 verified dupes, most-duped first. */
export async function getDupeGuideOriginals(): Promise<DupeGuideInfo[]> {
  const c = sb(); if (!c) return [];
  const { data: rels } = await c.from('dupe_relationships').select('original_perfume_id');
  const counts = new Map<string, number>();
  for (const r of (rels ?? []) as Array<{ original_perfume_id: string }>) {
    const id = r.original_perfume_id;
    counts.set(id, (counts.get(id) ?? 0) + 1);
  }
  const ids = [...counts.entries()].filter(([, n]) => n >= 2).map(([id]) => id);
  if (ids.length === 0) return [];
  const { data: perfs } = await c.from('perfumes').select(`id, ${PERFUME_COLS}`).in('id', ids);
  type PerfRow = RawRow & { id: string };
  return ((perfs ?? []) as PerfRow[])
    .map((p) => ({
      slug: p.slug, name: p.name, house: p.houses?.name ?? '',
      dupeCount: counts.get(p.id) ?? 0,
    }))
    .sort((a, b) => b.dupeCount - a.dupeCount || a.name.localeCompare(b.name));
}

/* ---------- Best-perfumes hub lists ---------- */

export type SeoListKind = 'monsoon' | 'budget' | 'office' | 'heat';

/**
 * Data-driven "best of" lists:
 * - monsoon: top monsoon_rating from community climate tests
 * - budget: lowest_price_inr under ₹1,000, most-reviewed first
 * - office: top summer_rating (work-appropriate in Indian heat)
 * - heat: top heat_longevity (longest lasting in Indian heat)
 */
export async function getSeoPerfumeList(kind: SeoListKind, limit = 8): Promise<SeoPerfume[]> {
  const c = sb(); if (!c) return [];
  if (kind === 'budget') {
    const { data } = await c.from('perfumes').select(PERFUME_COLS)
      .gt('lowest_price_inr', 0).lt('lowest_price_inr', 1000)
      .order('rating_count', { ascending: false }).limit(limit);
    return ((data ?? []) as RawRow[]).map(mapSeoPerfume);
  }
  const col = kind === 'monsoon' ? 'monsoon_rating' : kind === 'office' ? 'summer_rating' : 'heat_longevity';
  const key = kind === 'monsoon' ? 'monsoonRating' : kind === 'office' ? 'summerRating' : 'heatLongevity';
  const { data } = await c.from('climate_scores')
    .select(`${col}, perfumes(${PERFUME_COLS})`)
    .order(col, { ascending: false }).limit(limit);
  const out: SeoPerfume[] = [];
  for (const row of (data ?? []) as Array<Record<string, unknown>>) {
    const p = row.perfumes as RawRow | null;
    if (!p?.slug) continue;
    out.push({ ...mapSeoPerfume(p), [key]: row[col] as number });
  }
  return out;
}
