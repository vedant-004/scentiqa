import { NextResponse } from 'next/server';
import { getAuthedServerClient } from '@/lib/supabase-server';
import { getSupabaseServer } from '@/lib/supabase';

// POST /api/requests/[id]/vote — toggle your upvote on a request (auth required)
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: requestId } = await params;
  const sb = await getAuthedServerClient();
  if (!sb) return NextResponse.json({ error: 'Not configured' }, { status: 500 });
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Sign in to vote' }, { status: 401 });

  const admin = getSupabaseServer(true);
  if (!admin) return NextResponse.json({ error: 'Not configured' }, { status: 500 });

  const { data: pr } = await admin.from('perfume_requests').select('id,status').eq('id', requestId).single();
  if (!pr) return NextResponse.json({ error: 'Request not found' }, { status: 404 });
  if (pr.status !== 'open') return NextResponse.json({ error: 'Voting is closed for this request' }, { status: 400 });

  await admin.rpc('ensure_public_user');

  const { data: existing } = await admin.from('perfume_request_votes')
    .select('request_id').eq('request_id', requestId).eq('user_id', user.id).maybeSingle();

  if (existing) {
    await admin.from('perfume_request_votes').delete().eq('request_id', requestId).eq('user_id', user.id);
    return NextResponse.json({ ok: true, voted: false });
  }
  const { error } = await admin.from('perfume_request_votes').insert({ request_id: requestId, user_id: user.id });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true, voted: true });
}
