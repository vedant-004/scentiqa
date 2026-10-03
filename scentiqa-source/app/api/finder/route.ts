import { NextResponse } from 'next/server';
import { finderRecommendations } from '@/lib/data';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const liked = (searchParams.get('liked') ?? '').split(',').filter(Boolean).slice(0, 5);
  const recs = await finderRecommendations(liked);
  return NextResponse.json({
    recs: recs.map((r) => ({
      perfume: { slug: r.slug, name: r.name, house: r.house, ratingAvg: r.ratingAvg, lowestPriceInr: r.lowestPriceInr, isDupe: r.isDupe },
      reason: r.reason,
    })),
  });
}
