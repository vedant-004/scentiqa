import { NextResponse } from 'next/server';
import { getAuthedServerClient } from '@/lib/supabase-server';
import { getSupabaseServer } from '@/lib/supabase';

// GET /api/requests — list open perfume requests, most-voted first (public)
export async function GET() {
  const admin = getSupabaseServer(true);
  if (!admin) return NextResponse.json({ requests: [] });
  const { data } = await admin.from('perfume_requests').select('*')
    .eq('status', 'open').order('vote_count', { ascending: false }).order('created_at', { ascending: false }).limit(100);
  return NextResponse.json({ requests: data ?? [] });
}

// POST /api/requests — submit a new perfume request (auth required)
export async function POST(req: Request) {
  const sb = await getAuthedServerClient();
  if (!sb) return NextResponse.json({ error: 'Not configured' }, { status: 500 });
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Sign in to request a perfume' }, { status: 401 });

  let body: { perfume_name?: string; house_name?: string; reason?: string };
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }); }
  const perfume_name = (body.perfume_name ?? '').trim().slice(0, 120);
  const house_name = (body.house_name ?? '').trim().slice(0, 120);
  const reason = (body.reason ?? '').trim().slice(0, 500);
  if (perfume_name.length < 2) return NextResponse.json({ error: 'Perfume name is required' }, { status: 400 });
  if (reason.split(/\s+/).filter(Boolean).length < 5) {
    return NextResponse.json({ error: 'Tell us why in at least 5 words' }, { status: 400 });
  }

  const admin = getSupabaseServer(true);
  if (!admin) return NextResponse.json({ error: 'Not configured' }, { status: 500 });

  // Self-heal the public.users row (same pattern as lib/actions.ts).
  await admin.rpc('ensure_public_user');

  // Avoid duplicates: same perfume + house already open.
  const { data: dup } = await admin.from('perfume_requests')
    .select('id').eq('status', 'open')
    .ilike('perfume_name', perfume_name)
    .ilike('house_name', house_name || '%')
    .limit(1).maybeSingle();
  if (dup) return NextResponse.json({ error: 'This perfume has already been requested — upvote it instead', duplicate: true }, { status: 409 });

  const requester_name = user.user_metadata?.username ?? user.email?.split('@')[0] ?? 'Member';
  const { data, error } = await admin.from('perfume_requests').insert({
    perfume_name, house_name, reason, user_id: user.id, requester_name,
  }).select('id').single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  // The requester automatically upvotes their own request.
  await admin.from('perfume_request_votes').insert({ request_id: data.id, user_id: user.id });
  return NextResponse.json({ ok: true, id: data.id });
}
