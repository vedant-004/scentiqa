import { NextResponse } from 'next/server';
import { getDupesForPerfume } from '@/lib/data';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const original = searchParams.get('original') ?? '';
  if (!original) return NextResponse.json({ dupes: [] });
  const dupes = await getDupesForPerfume(original);
  return NextResponse.json({
    dupes: dupes.map((d) => ({
      id: d.id, originalSlug: d.originalSlug, dupeSlug: d.dupeSlug,
      similarityScore: d.similarityScore, testedBy: d.testedBy,
      claimedAccuracy: d.claimedAccuracy, verdict: d.verdict,
      dupe: { slug: d.dupe.slug, name: d.dupe.name, house: d.dupe.house, houseSlug: d.dupe.houseSlug, ratingAvg: d.dupe.ratingAvg, ratingCount: d.dupe.ratingCount, lowestPriceInr: d.dupe.lowestPriceInr, isDupe: true },
      dupeHouse: { slug: d.dupeHouse.slug, name: d.dupeHouse.name, type: d.dupeHouse.type },
      lowestPrice: d.lowestPrice ? { priceInr: d.lowestPrice.priceInr, seller: d.lowestPrice.seller?.name } : null,
    })),
  });
}
