import { NextResponse } from 'next/server';
import { getAuthedServerClient } from '@/lib/supabase-server';

// GET /api/diary/history?limit=60 — user's wear history with perfume details
export async function GET(req: Request) {
  const sb = await getAuthedServerClient();
  if (!sb) return NextResponse.json({ error: 'Not configured' }, { status: 500 });
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Sign in required' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const limit = Math.min(200, Math.max(1, Number(searchParams.get('limit') ?? 60) || 60));

  const { data, error } = await sb
    .from('wear_logs')
    .select('id, worn_on, notes, created_at, perfumes!inner(id, slug, name, bottle_image_url, houses(name))')
    .eq('user_id', user.id)
    .order('worn_on', { ascending: false })
    .limit(limit);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ logs: data ?? [] });
}
