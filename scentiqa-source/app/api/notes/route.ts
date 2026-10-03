import { NextResponse } from 'next/server';
import { getNotes } from '@/lib/data';

export async function GET() {
  return NextResponse.json({ notes: await getNotes() });
}
