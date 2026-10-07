import { NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';
import { normalizeAccords, scoreAccordProfile } from '@/lib/match';

// GET /api/search/accords?wanted=amber:70,woody:60&maxPrice=10000&gender=any&limit=24
// Accord-profile matching against LIVE accord data (covers the full catalog).
// Score: weighted coverage of the requested profile — how much of what you
// asked for each perfume's pyramid delivers. Nothing invented.

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

  const out: Array<{ id: string; slug: string; name: string; house: string; match: number; explanation: string[]; ratingAvg: number; lowestPriceInr: number | null; isDupe: boolean; bottleImage: string | null }> = [];

  for (const r of (pool ?? []) as Array<{ id: string; slug: string; name: string; gender: string; lowest_price_inr: number | null; rating_avg: number | null; rating_count: number | null; accords: unknown; bottle_image_url: string | null; description: string | null; houses: { name: string } | Array<{ name: string }> | null }>) {
    if (gender !== 'any' && r.gender !== gender) continue;
    if ((r.lowest_price_inr ?? Infinity) > maxPrice) continue;
    const { score, explanation } = scoreAccordProfile(normalizeAccords(r.accords), wanted);
    if (score <= 5) continue;
    const houseRel = r.houses;
    out.push({
      id: r.id, slug: r.slug, name: r.name,
      house: Array.isArray(houseRel) ? (houseRel[0]?.name ?? '') : (houseRel?.name ?? ''),
      match: score, explanation,
      ratingAvg: r.rating_avg ?? 0,
      lowestPriceInr: r.lowest_price_inr,
      isDupe: (r.description ?? '').startsWith('Dupe of'),
      bottleImage: r.bottle_image_url,
    });
  }
  out.sort((a, b) => b.match - a.match);
  return NextResponse.json({ results: out.slice(0, limit) });
}
