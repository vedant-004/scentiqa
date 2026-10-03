import { NextResponse } from 'next/server';
import seedJson from '@/data/seed.json';

// Light list of all perfumes for client-side discovery filtering.
export async function GET() {
  const s = seedJson as unknown as { perfumes: unknown[]; climateScores: Array<{ perfumeSlug: string; summerRating: number }> };
  const clim = new Map(s.climateScores.map((c) => [c.perfumeSlug, c.summerRating]));
  return NextResponse.json({
    perfumes: (s.perfumes as Array<Record<string, unknown>>).map((p) => ({
      slug: p.slug, name: p.name, house: p.house, houseSlug: p.houseSlug,
      gender: p.gender, ratingAvg: p.ratingAvg, ratingCount: p.ratingCount,
      lowestPriceInr: p.lowestPriceInr, isDupe: p.isDupe,
      accords: p.accords, topNotes: p.topNotes, heartNotes: p.heartNotes, baseNotes: p.baseNotes,
      summerRating: clim.get(p.slug as string) ?? 3,
    })),
  });
}
