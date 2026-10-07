// Blind-Buy Risk Score — 0-100 safety score for buying without smelling.
// All factors derive from real catalog data: dupe graph, prices, ratings,
// accord popularity. Nothing invented.
import { getSupabaseServer } from '@/lib/supabase';

export interface BlindBuyFactor {
  key: string;
  label: string;
  points: number; // contribution to score (0-100 scale)
  detail: string;
}

export interface BlindBuyScore {
  score: number;
  verdict: string;
  factors: BlindBuyFactor[];
}

/** Popular (safe/familiar) accords — mass-appeal families that rarely offend. */
const FAMILIAR_ACCORDS = new Set([
  'citrus', 'fruity', 'floral', 'aquatic', 'fresh', 'musky',
  'woody', 'aromatic', 'sweet', 'vanilla', 'powdery', 'green',
]);

export function blindBuyVerdict(score: number): string {
  if (score >= 80) return 'Safe blind buy';
  if (score >= 60) return 'Likely safe — sample if picky';
  if (score >= 40) return 'Sample first';
  return 'Risky blind buy';
}

interface BlindBuyInputs {
  lowest_price_inr: number | null;
  rating_avg: number | null;
  rating_count: number | null;
  accords: Array<{ name: string; strength: number | null }> | null;
}

/** Pure scoring from already-fetched data — no DB access. */
export function buildBlindBuyScore(p: BlindBuyInputs, dupeCount: number, dupeFloor: number | null): BlindBuyScore {
  const factors: BlindBuyFactor[] = [];

  // 1. Dupe availability (0-25): a cheap dupe = low financial risk
  const dupePts = dupeCount === 0 ? 5 : dupeFloor !== null && dupeFloor < 1000 ? 25 : dupeCount >= 3 ? 20 : 14;
  factors.push({
    key: 'dupes', label: 'Cheaper dupes available', points: dupePts,
    detail: dupeCount === 0
      ? 'No known Indian dupes — full price risk'
      : `${dupeCount} dupe${dupeCount === 1 ? '' : 's'} found${dupeFloor !== null ? `, cheapest ${dupeFloor.toLocaleString('en-IN')} INR` : ''} — low financial risk`,
  });

  // 2. Price tier (0-25): lower price = lower risk
  const price = p.lowest_price_inr;
  const pricePts = price === null ? 10 : price < 1000 ? 25 : price < 2500 ? 18 : price < 6000 ? 10 : 4;
  factors.push({
    key: 'price', label: 'Price risk', points: pricePts,
    detail: price === null
      ? 'No price data yet'
      : price < 1000 ? `Only ${price.toLocaleString('en-IN')} INR at stake` : `Stakes: ${price.toLocaleString('en-IN')} INR`,
  });

  // 3. Community consensus (0-25): more ratings = more signal
  const rc = p.rating_count ?? 0;
  const ra = p.rating_avg ?? 0;
  let consensusPts: number, consensusDetail: string;
  if (rc >= 100) { consensusPts = 25; consensusDetail = `${rc} ratings, avg ${ra.toFixed(1)} — strong consensus`; }
  else if (rc >= 30) { consensusPts = 18; consensusDetail = `${rc} ratings — decent signal`; }
  else if (rc >= 5) { consensusPts = 10; consensusDetail = `Only ${rc} ratings — thin signal`; }
  else { consensusPts = 4; consensusDetail = 'Almost no community ratings'; }
  // Penalize polarizing (very low avg with some ratings)
  if (rc >= 10 && ra < 3.5) { consensusPts = Math.max(0, consensusPts - 8); consensusDetail += ' · below-average rating'; }
  factors.push({ key: 'consensus', label: 'Community consensus', points: consensusPts, detail: consensusDetail });

  // 4. Accord familiarity (0-25): familiar families = safer
  const accords = p.accords ?? [];
  let famWeight = 0, totalWeight = 0;
  for (const a of accords) {
    const s = a.strength || 50;
    totalWeight += s;
    const nl = a.name.toLowerCase();
    const familiar = [...FAMILIAR_ACCORDS].some((f) => nl.includes(f));
    if (familiar) famWeight += s;
  }
  const famRatio = totalWeight > 0 ? famWeight / totalWeight : 0.5;
  const famPts = Math.round(famRatio * 25);
  const topAccord = accords.length ? [...accords].sort((a, b) => (b.strength || 0) - (a.strength || 0))[0].name : null;
  factors.push({
    key: 'familiarity', label: 'Scent familiarity', points: famPts,
    detail: topAccord
      ? `Main accord: ${topAccord} — ${famRatio >= 0.6 ? 'crowd-pleasing family' : famRatio >= 0.35 ? 'somewhat niche' : 'niche/challenging profile'}`
      : 'No accord data',
  });

  const score = Math.max(0, Math.min(100, factors.reduce((s, f) => s + f.points, 0)));
  return { score, verdict: blindBuyVerdict(score), factors };
}

export async function computeBlindBuyScore(perfumeId: string): Promise<BlindBuyScore | null> {
  const c = getSupabaseServer();
  if (!c) return null;

  const { data: p } = await c.from('perfumes')
    .select('id, name, lowest_price_inr, rating_avg, rating_count, accords')
    .eq('id', perfumeId)
    .single();
  if (!p) return null;

  const { data: dupes } = await c.from('dupe_relationships')
    .select('dupe_id')
    .eq('original_id', perfumeId)
    .limit(20);
  const dupeCount = dupes?.length ?? 0;
  let dupeFloor: number | null = null;
  if (dupeCount > 0) {
    const ids = dupes!.map((d) => d.dupe_id);
    const { data: dp } = await c.from('perfumes').select('lowest_price_inr').in('id', ids);
    const prices = (dp ?? []).map((d) => d.lowest_price_inr).filter((x): x is number => typeof x === 'number' && x > 0);
    if (prices.length) dupeFloor = Math.min(...prices);
  }
  return buildBlindBuyScore(
    {
      lowest_price_inr: p.lowest_price_inr as number | null,
      rating_avg: p.rating_avg as number | null,
      rating_count: p.rating_count as number | null,
      accords: (p.accords as Array<{ name: string; strength: number | null }> | null) ?? null,
    },
    dupeCount,
    dupeFloor,
  );
}

/**
 * Batch version: scores many perfumes with 3 bulk queries instead of 3N.
 * Used by the /blindbuy leaderboard page.
 */
export async function computeBlindBuyScores(
  perfumes: Array<{ id: string; lowest_price_inr: number | null; rating_avg: number | null; rating_count: number | null; accords: unknown }>,
): Promise<Map<string, BlindBuyScore>> {
  const c = getSupabaseServer();
  const out = new Map<string, BlindBuyScore>();
  if (!c || perfumes.length === 0) return out;
  const ids = perfumes.map((p) => p.id);

  const { data: rels } = await c.from('dupe_relationships').select('original_id, dupe_id').in('original_id', ids);
  const dupeIdsByOriginal = new Map<string, string[]>();
  const allDupeIds = new Set<string>();
  for (const r of (rels ?? []) as Array<{ original_id: string; dupe_id: string }>) {
    const list = dupeIdsByOriginal.get(r.original_id) ?? [];
    if (list.length < 20) { list.push(r.dupe_id); allDupeIds.add(r.dupe_id); }
    dupeIdsByOriginal.set(r.original_id, list);
  }
  const dupePrice = new Map<string, number>();
  if (allDupeIds.size > 0) {
    const { data: dp } = await c.from('perfumes').select('id, lowest_price_inr').in('id', [...allDupeIds]);
    for (const d of (dp ?? []) as Array<{ id: string; lowest_price_inr: number | null }>) {
      if (typeof d.lowest_price_inr === 'number' && d.lowest_price_inr > 0) dupePrice.set(d.id, d.lowest_price_inr);
    }
  }

  for (const p of perfumes) {
    const dupeIds = dupeIdsByOriginal.get(p.id) ?? [];
    const floors = dupeIds.map((id) => dupePrice.get(id)).filter((x): x is number => x !== undefined);
    const dupeFloor = floors.length ? Math.min(...floors) : null;
    out.set(p.id, buildBlindBuyScore(
      {
        lowest_price_inr: p.lowest_price_inr,
        rating_avg: p.rating_avg,
        rating_count: p.rating_count,
        accords: Array.isArray(p.accords)
          ? (p.accords as Array<{ name: string; strength: number | null }>)
          : null,
      },
      dupeIds.length,
      dupeFloor,
    ));
  }
  return out;
}
