import { NextResponse } from 'next/server';

// Light list of all perfumes for client-side discovery filtering.
// Queries Supabase live (falls back to seed.json if not configured).
export async function GET() {
  try {
    const { createClient: createSb } = await import('@supabase/supabase-js');
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) throw new Error('no supabase');

    const sb = createSb(url, key);
    const { data, error } = await sb
      .from('perfumes')
      .select('id, slug, name, house_id, gender, concentration, description, bottle_image_url, top_notes, heart_notes, base_notes, houses(slug, name)')
      .limit(5000);

    if (error || !data) throw new Error('query failed');

    // Get lowest prices
    const { data: prices } = await sb
      .from('prices')
      .select('perfume_id, price_inr')
      .order('price_inr', { ascending: true })
      .limit(5000);

    const lowPrice = new Map<string, number>();
    for (const pr of prices ?? []) {
      if (!lowPrice.has(pr.perfume_id)) lowPrice.set(pr.perfume_id, pr.price_inr);
    }

    return NextResponse.json({
      perfumes: data.map((p: any) => ({
        id: p.id,
        slug: p.slug,
        name: p.name,
        house: p.houses?.name ?? '',
        houseSlug: p.houses?.slug ?? '',
        gender: p.gender,
        ratingAvg: 0,
        ratingCount: 0,
        lowestPriceInr: lowPrice.get(p.id) ?? null,
        isDupe: (p.description || '').startsWith('Dupe of'),
        accords: [],
        topNotes: p.top_notes ?? [],
        heartNotes: p.heart_notes ?? [],
        baseNotes: p.base_notes ?? [],
        bottleImage: p.bottle_image_url,
        concentration: p.concentration,
        description: p.description,
        summerRating: 3,
      })),
    });
  } catch {
    // Fallback to seed.json
    const seedJson = (await import('@/data/seed.json')).default as unknown as {
      perfumes: unknown[];
      climateScores: Array<{ perfumeSlug: string; summerRating: number }>;
    };
    const clim = new Map(seedJson.climateScores.map((c) => [c.perfumeSlug, c.summerRating]));
    return NextResponse.json({
      perfumes: (seedJson.perfumes as Array<Record<string, unknown>>).map((p) => ({
        id: p.id, slug: p.slug, name: p.name, house: p.house, houseSlug: p.houseSlug,
        gender: p.gender, ratingAvg: p.ratingAvg, ratingCount: p.ratingCount,
        lowestPriceInr: p.lowestPriceInr, isDupe: p.isDupe,
        accords: p.accords, topNotes: p.topNotes, heartNotes: p.heartNotes, baseNotes: p.baseNotes,
        bottleImage: p.bottleImage, concentration: p.concentration, description: p.description,
        summerRating: clim.get(p.slug as string) ?? 3,
      })),
    });
  }
}
