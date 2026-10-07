import { NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';
import { normalizeAccords, scoreAccordProfile, tieredNotes, scoreNoteSet, scoreProjection } from '@/lib/match';

// POST /api/quiz/recommend — the 5-question AI Scent Quiz, scored server-side
// from LIVE accord + note data (full catalog, no client download, no stale ML vectors).
// Body: { vibe, occasion, projection, notes, budget }
// Combined: 50% accord profile, 30% loved notes, 20% projection preference.

const VIBE_ACCORDS: Record<string, Record<string, number>> = {
  fresh: { Citrus: 80, Fresh: 85, Aquatic: 60, Green: 40 },
  cozy: { Ambery: 75, Sweet: 70, 'Warm Spicy': 60, Woody: 50 },
  bold: { Woody: 80, Leathery: 70, Tobacco: 65, Smoky: 60, Ambery: 55 },
  floral: { Floral: 85, Sweet: 40, Musky: 50, Citrus: 30 },
};

const NOTE_QUIZ_MAP: Record<string, string[]> = {
  citrus: ['bergamot', 'lemon', 'mandarin orange', 'grapefruit'],
  woody: ['sandalwood', 'cedar', 'vetiver', 'oud'],
  sweet: ['vanilla', 'tonka bean', 'amber'],
  floral: ['rose', 'jasmine', 'lavender'],
  spicy: ['cardamom', 'pink pepper', 'cinnamon'],
  aquatic: ['sea notes', 'calone', 'bergamot'],
};

export async function POST(req: Request) {
  const sb = getSupabaseServer();
  if (!sb) return NextResponse.json({ error: 'Not configured' }, { status: 500 });
  let body: Record<string, string> = {};
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }); }

  const vibe = VIBE_ACCORDS[body.vibe] ?? {};
  const lovedNotes = NOTE_QUIZ_MAP[body.notes] ?? [];
  const maxPrice = body.budget === 'any' || !body.budget ? Infinity : Number(body.budget);
  const projection = (['intimate', 'moderate', 'strong'] as const).includes(body.projection as never)
    ? (body.projection as 'intimate' | 'moderate' | 'strong') : 'moderate';

  const occasionBoost: Record<string, number> = {};
  if (body.occasion === 'evening') { occasionBoost['Ambery'] = 20; occasionBoost['Woody'] = 15; }
  if (body.occasion === 'office') { occasionBoost['Fresh'] = 15; occasionBoost['Citrus'] = 10; }
  if (body.occasion === 'daily') { occasionBoost['Fresh'] = 10; occasionBoost['Citrus'] = 10; }

  const targetAccords = Object.entries({ ...vibe }).map(([name, v]) => ({
    name, min: Math.min(100, v + (occasionBoost[name] ?? 0)),
  })).filter((w) => w.min > 0);

  const { data: pool } = await sb.from('perfumes')
    .select('id, slug, name, gender, concentration, lowest_price_inr, rating_avg, rating_count, accords, top_notes, heart_notes, base_notes, bottle_image_url, description, houses(name)')
    .order('rating_count', { ascending: false })
    .limit(1500);

  const out: Array<{ id: string; slug: string; name: string; house: string; match: number; reason: string; ratingAvg: number; lowestPriceInr: number | null; isDupe: boolean; bottleImage: string | null }> = [];

  for (const r of (pool ?? []) as Array<{ id: string; slug: string; name: string; gender: string; concentration: string | null; lowest_price_inr: number | null; rating_avg: number | null; rating_count: number | null; accords: unknown; top_notes: unknown; heart_notes: unknown; base_notes: unknown; bottle_image_url: string | null; description: string | null; houses: { name: string } | Array<{ name: string }> | null }>) {
    if ((r.lowest_price_inr ?? Infinity) > maxPrice) continue;
    const accords = normalizeAccords(r.accords);
    const { score: accordScore, explanation } = scoreAccordProfile(accords, targetAccords);
    const { score: noteScore, matched } = scoreNoteSet(tieredNotes(r), lovedNotes);
    const projScore = scoreProjection(r.concentration, projection);
    const match = Math.round(accordScore * 0.5 + noteScore * 0.3 + projScore * 0.2);
    if (match <= 20) continue;
    const houseRel = r.houses;
    out.push({
      id: r.id, slug: r.slug, name: r.name,
      house: Array.isArray(houseRel) ? (houseRel[0]?.name ?? '') : (houseRel?.name ?? ''),
      match,
      reason: explanation.length > 0
        ? `Strong in ${explanation.join(', ')}${matched.length > 0 ? ` · has ${matched.slice(0, 2).join(', ')}` : ''}`
        : matched.length > 0 ? `Features ${matched.slice(0, 2).join(', ')}` : 'Matches your vibe',
      ratingAvg: r.rating_avg ?? 0,
      lowestPriceInr: r.lowest_price_inr,
      isDupe: (r.description ?? '').startsWith('Dupe of'),
      bottleImage: r.bottle_image_url,
    });
  }
  out.sort((a, b) => b.match - a.match);
  return NextResponse.json({ results: out.slice(0, 12), catalogSize: (pool ?? []).length });
}
