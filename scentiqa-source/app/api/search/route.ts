import { NextResponse } from 'next/server';
import { searchPerfumesDetailed } from '@/lib/data';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q') ?? '';
  const limit = Math.min(Math.max(Number(searchParams.get('limit') ?? '8') || 8, 1), 60);
  const { results, didYouMean } = await searchPerfumesDetailed(q, limit);
  return NextResponse.json({
    results: results.map((p) => ({
      id: p.id,
      slug: p.slug, name: p.name, house: p.house, isDupe: p.isDupe,
      ratingAvg: p.ratingAvg, ratingCount: p.ratingCount ?? 0,
      price: p.lowestPriceInr, bottleImage: p.bottleImage ?? null,
      dupeCount: p.dupeCount ?? 0, matchedField: p.matchedField ?? 'name',
    })),
    didYouMean,
  });
}
