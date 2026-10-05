import { NextResponse } from 'next/server';
import { getPerfume } from '@/lib/data';
import { computeBlindBuyScore } from '@/lib/blindbuy';

// GET /api/perfumes/[slug]/blindbuy — blind-buy safety score + factor breakdown
export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const p = await getPerfume(slug);
  if (!p) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  const result = await computeBlindBuyScore(p.id);
  if (!result) return NextResponse.json({ error: 'Could not compute' }, { status: 500 });
  return NextResponse.json(result);
}
