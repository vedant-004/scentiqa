import { NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';

// Lightweight houses list for the Finder (and anywhere a house picker is needed).
// Returns just the 199 houses with counts — a few KB instead of the full perfume catalog.
export const revalidate = 3600;

export async function GET() {
  try {
    const sb = getSupabaseServer();
    if (!sb) return NextResponse.json({ houses: [] }, { status: 200 });
    const houses: { slug: string; name: string; count: number }[] = [];
    const pageSize = 1000;
    let page = 0;
    for (;;) {
      const { data, error } = await sb
        .from('houses')
        .select('slug, name, perfume_count')
        .order('perfume_count', { ascending: false })
        .range(page * pageSize, (page + 1) * pageSize - 1);
      if (error) throw error;
      for (const h of data ?? []) {
        houses.push({
          slug: (h as { slug: string }).slug,
          name: (h as { name: string }).name,
          count: Number((h as { perfume_count: number }).perfume_count ?? 0),
        });
      }
      if (!data || data.length < pageSize) break;
      page += 1;
    }
    const { count: totalPerfumes, error: countError } = await sb
      .from('perfumes')
      .select('id', { count: 'exact', head: true });
    if (countError) throw countError;
    return NextResponse.json({ houses, totalPerfumes: totalPerfumes ?? 0 });
  } catch (e) {
    console.error('GET /api/houses failed', e);
    return NextResponse.json({ houses: [], totalPerfumes: 0 }, { status: 200 });
  }
}
