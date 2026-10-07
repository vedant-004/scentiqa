import { NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';

// GET /api/search/notes?inc=bergamot,oud&exc=rose&gender=any&limit=24
// Note include/exclude matching against LIVE note pyramids (full catalog).
// Score: share of requested notes found, weighted by pyramid tier
// (base > heart > top — deeper notes linger longer). Nothing invented.

function tieredNotes(r: { top_notes: unknown; heart_notes: unknown; base_notes: unknown }): Array<{ name: string; weight: number }> {
  const out: Array<{ name: string; weight: number }> = [];
  const push = (raw: unknown, weight: number) => {
    if (!Array.isArray(raw)) return;
    for (const n of raw) {
      if (typeof n === 'string' && n.trim()) out.push({ name: n.toLowerCase(), weight });
    }
  };
  push(r.top_notes, 1);
  push(r.heart_notes, 1.2);
  push(r.base_notes, 1.4);
  return out;
}

export async function GET(req: Request) {
  const sb = getSupabaseServer();
  if (!sb) return NextResponse.json({ error: 'Not configured' }, { status: 500 });
  const sp = new URL(req.url).searchParams;
  const inc = (sp.get('inc') ?? '').split(',').map((s) => s.trim().toLowerCase()).filter(Boolean).slice(0, 10);
  const exc = (sp.get('exc') ?? '').split(',').map((s) => s.trim().toLowerCase()).filter(Boolean).slice(0, 10);
  const gender = sp.get('gender') ?? 'any';
  const limit = Math.min(Math.max(Number(sp.get('limit') ?? '24') || 24, 1), 48);
  if (inc.length === 0 && exc.length === 0) return NextResponse.json({ results: [] });

  const { data: pool } = await sb.from('perfumes')
    .select('id, slug, name, gender, rating_avg, lowest_price_inr, rating_count, top_notes, heart_notes, base_notes, bottle_image_url, description, houses(name)')
    .order('rating_count', { ascending: false })
    .limit(1500);

  const out: Array<{ id: string; slug: string; name: string; house: string; match: number; matchedNotes: string[]; ratingAvg: number; lowestPriceInr: number | null; isDupe: boolean; bottleImage: string | null }> = [];

  for (const r of (pool ?? []) as Array<{ id: string; slug: string; name: string; gender: string; rating_avg: number | null; lowest_price_inr: number | null; rating_count: number | null; top_notes: unknown; heart_notes: unknown; base_notes: unknown; bottle_image_url: string | null; description: string | null; houses: { name: string } | Array<{ name: string }> | null }>) {
    if (gender !== 'any' && r.gender !== gender) continue;
    const notes = tieredNotes(r);
    if (notes.length === 0) continue;
    // Excludes disqualify.
    if (exc.some((e) => notes.some((n) => n.name.includes(e)))) continue;
    let hitWeight = 0;
    const matched: string[] = [];
    for (const want of inc) {
      const hit = notes.find((n) => n.name.includes(want));
      if (hit) { hitWeight += hit.weight; matched.push(want); }
    }
    if (inc.length > 0 && matched.length === 0) continue;
    const maxWeight = inc.length * 1.4;
    const match = inc.length === 0 ? 80 : Math.round(100 * (hitWeight / maxWeight));
    if (match <= 10) continue;
    const houseRel = r.houses;
    out.push({
      id: r.id, slug: r.slug, name: r.name,
      house: Array.isArray(houseRel) ? (houseRel[0]?.name ?? '') : (houseRel?.name ?? ''),
      match, matchedNotes: matched.slice(0, 4),
      ratingAvg: r.rating_avg ?? 0,
      lowestPriceInr: r.lowest_price_inr,
      isDupe: (r.description ?? '').startsWith('Dupe of'),
      bottleImage: r.bottle_image_url,
    });
  }
  out.sort((a, b) => b.match - a.match);
  return NextResponse.json({ results: out.slice(0, limit) });
}
