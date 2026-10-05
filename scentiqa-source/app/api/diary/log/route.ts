import { NextResponse } from 'next/server';
import { getAuthedServerClient } from '@/lib/supabase-server';

// POST /api/diary/log — log today's scent (one entry per user+perfume+day)
export async function POST(req: Request) {
  const sb = await getAuthedServerClient();
  if (!sb) return NextResponse.json({ error: 'Not configured' }, { status: 500 });
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Sign in required' }, { status: 401 });

  let body: { perfume_id?: string; notes?: string; worn_on?: string };
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }); }
  const perfume_id = (body.perfume_id ?? '').trim();
  if (!perfume_id) return NextResponse.json({ error: 'perfume_id required' }, { status: 400 });
  const worn_on = body.worn_on ?? new Date().toISOString().slice(0, 10);

  // Verify the perfume exists
  const { data: perf } = await sb.from('perfumes').select('id').eq('id', perfume_id).limit(1).single();
  if (!perf) return NextResponse.json({ error: 'Perfume not found' }, { status: 404 });

  const { data, error } = await sb.from('wear_logs').upsert(
    { user_id: user.id, perfume_id, worn_on, notes: (body.notes ?? '').trim() || null },
    { onConflict: 'user_id,perfume_id,worn_on' }
  ).select('id, worn_on').single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true, log: data });
}
