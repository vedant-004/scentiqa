import { NextResponse } from 'next/server';
import { searchPerfumes } from '@/lib/data';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q') ?? '';
  const results = await searchPerfumes(q, 8);
  return NextResponse.json({
    results: results.map((p) => ({
      slug: p.slug, name: p.name, house: p.house, isDupe: p.isDupe,
      ratingAvg: p.ratingAvg, price: p.lowestPriceInr,
    })),
  });
}
