import { NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';

// GET /api/search/trending — top 8 searched terms from the last 30 days.
// Returns { queries: [] } gracefully if the search_queries table is missing
// (migration not run yet) or Supabase isn't configured.
export async function GET() {
  try {
    const c = getSupabaseServer(true); // service role: search_queries is default-deny
    if (!c) return NextResponse.json({ queries: [] });
    const since = new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString();
    const { data, error } = await c
      .from('search_queries')
      .select('query')
      .gte('created_at', since)
      .order('created_at', { ascending: false })
      .limit(5000);
    if (error || !data) return NextResponse.json({ queries: [] });
    const counts = new Map<string, number>();
    for (const r of data as Array<{ query: unknown }>) {
      const k = String(r.query ?? '').trim().toLowerCase();
      if (k) counts.set(k, (counts.get(k) ?? 0) + 1);
    }
    const queries = [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([query, count]) => ({ query, count }));
    return NextResponse.json({ queries });
  } catch {
    return NextResponse.json({ queries: [] });
  }
}
