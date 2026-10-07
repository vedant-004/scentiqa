import { NextResponse } from 'next/server';
import { searchPerfumes } from '@/lib/data';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q') ?? '';
  const limit = Math.min(Math.max(Number(searchParams.get('limit') ?? '8') || 8, 1), 24);
  const results = await searchPerfumes(q, limit);
  return NextResponse.json({
    results: results.map((p) => ({
      id: p.id,
      slug: p.slug, name: p.name, house: p.house, isDupe: p.isDupe,
      ratingAvg: p.ratingAvg, price: p.lowestPriceInr,
    })),
  });
}
