import { NextResponse } from 'next/server';
import { getAuthedServerClient } from '@/lib/supabase-server';
import {
  scorePerfumes, pickWildcard, detectTensions,
  type FinderAnswers, type PerfumeRow,
} from '@/lib/finder-scoring';

export const maxDuration = 60;

function sanitizeAnswers(body: any): FinderAnswers {
  const strArr = (v: any): string[] =>
    Array.isArray(v) ? v.map((x) => String(x).toLowerCase().trim()).filter(Boolean).slice(0, 30) : [];
  const num = (v: any, dflt: number, min: number, max: number) => {
    const n = Number(v);
    return Number.isFinite(n) ? Math.min(max, Math.max(min, Math.round(n))) : dflt;
  };
  return {
    lovedNotes: strArr(body.lovedNotes).slice(0, 10),
    hatedNotes: strArr(body.hatedNotes).slice(0, 10),
    houses: strArr(body.houses).slice(0, 20),
    longevity: num(body.longevity, 3, 1, 5),
    sillage: num(body.sillage, 3, 1, 5),
    occasions: strArr(body.occasions).slice(0, 9),
    budget: Math.min(200000, Math.max(300, Number(body.budget) || 5000)),
    gender: ['men', 'women', 'unisex'].includes(String(body.gender)) ? body.gender : 'any',
    clonePref: ['originals', 'clones'].includes(String(body.clonePref)) ? body.clonePref : 'any',
    concentration: strArr(body.concentration).slice(0, 5),
  };
}

export async function POST(req: Request) {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }
  const a = sanitizeAnswers(body);
  if (a.lovedNotes.length === 0) {
    return NextResponse.json({ error: 'Pick at least 3 notes you love.' }, { status: 400 });
  }

  const sb = await getAuthedServerClient();
  if (!sb) return NextResponse.json({ error: 'Database not configured' }, { status: 500 });

  // Fetch the FULL catalog (paginated) — the finder must score every scent, not just the first N.
  const PAGE = 2000;
  const all: any[] = [];
  for (let from = 0; ; from += PAGE) {
    const { data: page, error: pageErr } = await sb
      .from('perfumes')
      .select('id, slug, name, house_id, gender, concentration, description, bottle_image_url, top_notes, heart_notes, base_notes, accords, lowest_price_inr, rating_avg, rating_count, houses(slug, name)')
      .range(from, from + PAGE - 1);
    if (pageErr) {
      return NextResponse.json({ error: 'Failed to load catalog' }, { status: 500 });
    }
    if (!page || page.length === 0) break;
    all.push(...page);
    if (page.length < PAGE) break;
  }
  const data = all;
  if (data.length === 0) {
    return NextResponse.json({ error: 'Catalog is empty' }, { status: 500 });
  }

  const rows: PerfumeRow[] = data.map((p: any) => ({
    id: p.id, slug: p.slug, name: p.name,
    houseSlug: p.houses?.slug ?? '', house: p.houses?.name ?? '',
    gender: p.gender ?? '', concentration: p.concentration ?? '',
    description: p.description ?? '', bottleImage: p.bottle_image_url ?? null,
    topNotes: p.top_notes ?? [], heartNotes: p.heart_notes ?? [], baseNotes: p.base_notes ?? [],
    accords: p.accords ?? [],
    lowestPriceInr: p.lowest_price_inr ?? null,
    ratingAvg: Number(p.rating_avg ?? 0), ratingCount: Number(p.rating_count ?? 0),
  }));

  // Pass 1: strict scoring
  let scored = await scorePerfumes(rows, a);
  let relaxedNote: string | undefined;

  // Pass 2: graceful relaxation if nothing good found
  if (scored.length === 0 || scored[0].score < 35) {
    const relaxed = await scorePerfumes(rows, a, { relaxBudget: true, relaxConcentration: true });
    if (relaxed.length > 0 && (scored.length === 0 || relaxed[0].score > scored[0].score)) {
      relaxedNote = 'Your filters were very tight, so we relaxed budget & concentration to find worthy matches — marked as stretch picks.';
      scored = relaxed.slice(0, 20).map((s) => ({ ...s, relaxed: relaxedNote }));
    }
  }

  const top = scored.slice(0, 15);
  const wildcard = await pickWildcard(scored, a);
  const tensions = detectTensions(a);

  return NextResponse.json({
    answers: a,
    totalScored: scored.length,
    relaxed: relaxedNote ?? null,
    tensions,
    results: top,
    wildcard,
  });
}
