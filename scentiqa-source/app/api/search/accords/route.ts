import { NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';

// GET /api/search/accords?wanted=amber:70,woody:60&maxPrice=10000&gender=any&limit=24
// Accord-profile matching against LIVE accord data (covers the full catalog).
// Score: weighted coverage of the requested profile — how much of what you
// asked for each perfume's pyramid delivers. Nothing invented.

const ALIASES: Record<string, string> = { ambery: 'amber', leathery: 'leather' };

function normalizeAccords(raw: unknown): Array<{ name: string; strength: number | null }> {
  if (!Array.isArray(raw)) return [];
  const out: Array<{ name: string; strength: number | null }> = [];
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

/** Prominence 0-100: source strength when published, else rank-derived. */
function prominence(accords: Array<{ name: string; strength: number | null }>, wanted: string): number | null {
  const key = ALIASES[wanted.toLowerCase()] ?? wanted.toLowerCase();
  const idx = accords.findIndex((a) => {
    const nl = a.name.toLowerCase();
    return nl === key || nl.includes(key);
  });
  if (idx < 0) return null;
  const a = accords[idx];
  if (typeof a.strength === 'number') return Math.max(0, Math.min(100, a.strength));
  return Math.round(100 * (accords.length - idx) / accords.length);
}

export async function GET(req: Request) {
  const sb = getSupabaseServer();
  if (!sb) return NextResponse.json({ error: 'Not configured' }, { status: 500 });
  const sp = new URL(req.url).searchParams;
  const wanted = (sp.get('wanted') ?? '')
    .split(',').map((s) => s.trim()).filter(Boolean)
    .map((pair) => {
      const [name, v] = pair.split(':');
      return { name: name.trim(), min: Math.max(0, Math.min(100, Number(v) || 0)) };
    })
    .filter((w) => w.name && w.min > 0)
    .slice(0, 14);
  if (wanted.length === 0) return NextResponse.json({ results: [] });

  const maxPrice = Number(sp.get('maxPrice') ?? '10000') || 10000;
  const gender = sp.get('gender') ?? 'any';
  const limit = Math.min(Math.max(Number(sp.get('limit') ?? '24') || 24, 1), 48);

  const { data: pool } = await sb.from('perfumes')
    .select('id, slug, name, gender, lowest_price_inr, rating_avg, rating_count, accords, bottle_image_url, description, houses(name)')
    .order('rating_count', { ascending: false })
    .limit(1500);

  const totalWanted = wanted.reduce((s, w) => s + w.min / 100, 0);
  const out: Array<{ id: string; slug: string; name: string; house: string; match: number; explanation: string[]; ratingAvg: number; lowestPriceInr: number | null; isDupe: boolean; bottleImage: string | null }> = [];

  for (const r of (pool ?? []) as Array<{ id: string; slug: string; name: string; gender: string; lowest_price_inr: number | null; rating_avg: number | null; rating_count: number | null; accords: unknown; bottle_image_url: string | null; description: string | null; houses: { name: string } | Array<{ name: string }> | null }>) {
    if (gender !== 'any' && r.gender !== gender) continue;
    if ((r.lowest_price_inr ?? Infinity) > maxPrice) continue;
    const accords = normalizeAccords(r.accords);
    if (accords.length === 0) continue;
    let covered = 0;
    const explanation: string[] = [];
    for (const w of wanted) {
      const prom = prominence(accords, w.name);
      if (prom !== null && prom >= w.min) {
        covered += (w.min / 100) * (prom / 100);
        explanation.push(w.name);
      }
    }
    if (covered <= 0) continue;
    const match = Math.round(100 * (covered / totalWanted));
    if (match <= 5) continue;
    const houseRel = r.houses;
    out.push({
      id: r.id, slug: r.slug, name: r.name,
      house: Array.isArray(houseRel) ? (houseRel[0]?.name ?? '') : (houseRel?.name ?? ''),
      match, explanation: explanation.slice(0, 3),
      ratingAvg: r.rating_avg ?? 0,
      lowestPriceInr: r.lowest_price_inr,
      isDupe: (r.description ?? '').startsWith('Dupe of'),
      bottleImage: r.bottle_image_url,
    });
  }
  out.sort((a, b) => b.match - a.match);
  return NextResponse.json({ results: out.slice(0, limit) });
}
