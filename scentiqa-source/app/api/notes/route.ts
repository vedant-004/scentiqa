import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

// Serve the 400 ML-derived notes (from 24k Fragrantica dataset)
export async function GET() {
  try {
    const p = path.join(process.cwd(), 'public', 'ml', 'ml-notes-list.json');
    const data = await fs.readFile(p, 'utf8');
    return NextResponse.json({ notes: JSON.parse(data) });
  } catch {
    const { getNotes } = await import('@/lib/data');
    return NextResponse.json({ notes: await getNotes() });
  }
}
