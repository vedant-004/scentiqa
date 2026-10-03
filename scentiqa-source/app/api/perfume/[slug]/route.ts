import { NextResponse } from 'next/server';
import { getPerfume } from '@/lib/data';

export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const p = await getPerfume(slug);
  if (!p) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ perfume: p });
}
