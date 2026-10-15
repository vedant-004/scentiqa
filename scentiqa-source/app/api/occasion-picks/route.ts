import { NextResponse } from 'next/server';
import { rateLimit } from '@/lib/rate-limit';
import { OCCASIONS, scoreForProfile } from '@/lib/weather-occasions';
import { predictHeatScore } from '@/lib/climate';

export const maxDuration = 60;

interface Body { occasion?: string; maxBudget?: number; minLongevity?: number; gender?: string }

async function fetchCatalog(sb: any) {
  const PAGE = 1000;
  const [housesRes] = await Promise.all([sb.from('houses').select('id, slug, name')]);
  const houseMap = new Map<string, { slug: string; name: string }>();
  for (const h of housesRes.data ?? []) houseMap.set(h.id, { slug: h.slug, name: h.name });
  const all: any[] = [];
  const promises: Promise<any>[] = [];
  for (let from = 0; from < 20000; from += PAGE) {
    promises.push(
      sb.from('perfumes')
        .select('id, slug, name, house_id, gender, concentration, bottle_image_url, accords, lowest_price_inr, rating_avg')
        .order('id', { ascending: true })
        .range(from, from + PAGE - 1),
    );
  }
  for (const p of promises) {
    const { data, error } = await p;
    if (error) throw new Error('Failed to load catalog');
    if (!data || data.length === 0) break;
    all.push(...data);
    if (data.length < PAGE) break;
  }
  return { all, houseMap };
}

function accordList(v: unknown): Array<{ name: string; strength: number | null }> {
  if (!Array.isArray(v)) return [];
  const out: Array<{ name: string; strength: number | null }> = [];
  for (const x of v) {
    if (typeof x === 'string') { if (x.trim()) out.push({ name: x.trim(), strength: null }); continue; }
    if (x && typeof x === 'object') {
      const r = x as Record<string, unknown>;
      const name = String(r.name ?? '').trim();
      if (name) out.push({ name, strength: typeof r.strength === 'number' ? r.strength : null });
    }
  }
  return out;
}

// POST /api/occasion-picks — { occasion, maxBudget?, minLongevity?, gender? } → top 24 picks.
export async function POST(req: Request) {
  try {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    if (!rateLimit(`occasion:${ip}`, 20, 60_000)) {
      return NextResponse.json({ error: 'Too many requests — please wait a moment.' }, { status: 429 });
    }
    let body: Body;
    try { body = await req.json(); } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }); }

    const profile = OCCASIONS.find((o) => o.id === body.occasion);
    if (!profile) return NextResponse.json({ error: 'Pick an occasion.' }, { status: 400 });
    const maxBudget = body.maxBudget && Number.isFinite(+body.maxBudget) && +body.maxBudget > 0
      ? Math.min(500000, Math.round(+body.maxBudget)) : null;
    const minLongevity = body.minLongevity && Number.isFinite(+body.minLongevity) && +body.minLongevity > 0
      ? Math.min(12, +body.minLongevity) : 0;
    const gender = ['men', 'women', 'unisex'].includes(String(body.gender)) ? String(body.gender) : 'any';

    const { createClient: createSb } = await import('@supabase/supabase-js');
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
    const sb = createSb(url, key);

    const { all, houseMap } = await fetchCatalog(sb);
    const picks: any[] = [];
    for (const p of all) {
      const accords = accordList(p.accords);
      if (accords.length === 0) continue;
      if (gender !== 'any' && String(p.gender ?? '').toLowerCase() !== gender) continue;
      const price = typeof p.lowest_price_inr === 'number' ? p.lowest_price_inr : null;
      if (maxBudget !== null && (price === null || price > maxBudget)) continue;
      const heat = predictHeatScore(accords);
      const scored = scoreForProfile(accords, profile, heat);
      if (scored.match < 40) continue;
      if (minLongevity > 0 && scored.longevityHrs < minLongevity) continue;
      const house = houseMap.get(p.house_id);
      picks.push({
        id: p.id, slug: p.slug, name: p.name,
        house: house?.name ?? '', houseSlug: house?.slug ?? '',
        gender: p.gender, concentration: p.concentration,
        image: p.bottle_image_url ?? null, price, rating: p.rating_avg ?? null,
        ...scored,
      });
    }
    picks.sort((a, b) => b.match - a.match || (b.rating ?? 0) - (a.rating ?? 0));
    return NextResponse.json({ picks: picks.slice(0, 24), total: picks.length, profile: { id: profile.id, label: profile.label } });
  } catch (e: any) {
    console.error('[occasion-picks] unhandled:', e?.message || e);
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 });
  }
}
