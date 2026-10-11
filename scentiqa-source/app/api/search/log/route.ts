import { NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';

// POST /api/search/log — fire-and-forget search query log for admin analytics.
// Body: { q: string, resultsCount?: number }. Always returns { ok: true } —
// logging must NEVER break search, even if the table/migration doesn't exist yet.
export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => ({}))) as { q?: unknown; resultsCount?: unknown };
    const q = typeof body.q === 'string' ? body.q.trim().slice(0, 120) : '';
    if (!q) return NextResponse.json({ ok: true });
    const n = Number(body.resultsCount);
    const resultsCount = Number.isFinite(n) ? Math.max(0, Math.floor(n)) : 0;
    const c = getSupabaseServer(true); // service role: search_queries is default-deny
    if (!c) return NextResponse.json({ ok: true });
    // Errors (e.g. table missing because the migration wasn't run) are swallowed.
    await c.from('search_queries').insert({ query: q, results_count: resultsCount });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: true });
  }
}
