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

  // 1. Coverage of each family across the owned wardrobe.
  const { data: ownedRows } = await sb.from('perfumes').select('id, accords').in('id', owned);
  const coverage = new Map<string, number>();
  for (const r of (ownedRows ?? []) as Array<{ accords: unknown }>) {
    for (const [f, w] of familyProminence(normalizeAccords(r.accords))) {
      coverage.set(f, (coverage.get(f) ?? 0) + w);
    }
  }
  const gaps = FAMILIES.map((f) => f.name)
    .sort((a, b) => (coverage.get(a) ?? 0) - (coverage.get(b) ?? 0))
    .slice(0, 4);
  const gapSet = new Set(gaps);

  // 2. Candidate pool: well-rated perfumes with accord data, excluding owned.
  const { data: pool } = await sb.from('perfumes')
    .select('id, slug, name, accords, rating_count, houses(name)')
    .order('rating_count', { ascending: false })
    .limit(1000);

  const recs: Array<{ id: string; slug: string; name: string; house: string; score: number; reason: string; gap: string }> = [];
  for (const r of (pool ?? []) as Array<{ id: string; slug: string; name: string; accords: unknown; rating_count: number | null; houses: unknown }>) {
    if (owned.includes(r.id)) continue;
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
    // Fit score from real prominence: a gap family leading the accord pyramid scores highest.
    const score = Math.round(Math.min(98, 62 + 36 * Math.min(1, bestW * 1.4)));
    const houseRel = r.houses as { name: string } | Array<{ name: string }> | null;
    recs.push({
      id: r.id, slug: r.slug, name: r.name,
      house: Array.isArray(houseRel) ? (houseRel[0]?.name ?? '') : (houseRel?.name ?? ''),
      score,
      reason: `Strong ${bestGap.toLowerCase()} character — the lightest corner of your wardrobe`,
      gap: bestGap,
    });
  }
  recs.sort((a, b) => b.score - a.score);

  return NextResponse.json({ gaps, recommendations: recs.slice(0, 12) });
}
