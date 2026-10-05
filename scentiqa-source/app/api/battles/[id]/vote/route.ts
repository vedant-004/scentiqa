import { NextResponse } from 'next/server';
import { getAuthedServerClient } from '@/lib/supabase-server';
import { getSupabaseServer } from '@/lib/supabase';

// POST /api/battles/[id]/vote — vote for a perfume in a matchup (one vote per user per matchup)
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: battleId } = await params;
  const sb = await getAuthedServerClient();
  if (!sb) return NextResponse.json({ error: 'Not configured' }, { status: 500 });
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Sign in to vote' }, { status: 401 });

  let body: { matchup_id?: string; perfume_id?: string };
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }); }
  const matchup_id = (body.matchup_id ?? '').trim();
  const perfume_id = (body.perfume_id ?? '').trim();
  if (!matchup_id || !perfume_id) return NextResponse.json({ error: 'matchup_id and perfume_id required' }, { status: 400 });

  const admin = getSupabaseServer(true);
  if (!admin) return NextResponse.json({ error: 'Not configured' }, { status: 500 });

  // Validate matchup belongs to this battle and perfume is a contestant
  const { data: m } = await admin.from('battle_matchups').select('*').eq('id', matchup_id).eq('battle_id', battleId).single();
  if (!m) return NextResponse.json({ error: 'Matchup not found' }, { status: 404 });
  if (m.winner_id) return NextResponse.json({ error: 'Voting closed for this matchup' }, { status: 400 });
  if (perfume_id !== m.perfume_a_id && perfume_id !== m.perfume_b_id) {
    return NextResponse.json({ error: 'Perfume is not in this matchup' }, { status: 400 });
  }

  // One vote per user per matchup (upsert switches the vote)
  const { data: existing } = await admin.from('battle_votes')
    .select('perfume_id').eq('matchup_id', matchup_id).eq('user_id', user.id).single();

  if (existing && existing.perfume_id === perfume_id) {
    return NextResponse.json({ ok: true, unchanged: true });
  }

  // Decrement old side if switching
  if (existing) {
    const col = existing.perfume_id === m.perfume_a_id ? 'votes_a' : 'votes_b';
    await admin.from('battle_matchups').update({ [col]: Math.max(0, (m[col] as number) - 1) }).eq('id', matchup_id);
  }

  const { error: vErr } = await admin.from('battle_votes').upsert(
    { matchup_id, user_id: user.id, perfume_id },
    { onConflict: 'matchup_id,user_id' }
  );
  if (vErr) return NextResponse.json({ error: vErr.message }, { status: 400 });

  const col = perfume_id === m.perfume_a_id ? 'votes_a' : 'votes_b';
  await admin.from('battle_matchups').update({ [col]: (m[col] as number) + 1 }).eq('id', matchup_id);

  return NextResponse.json({ ok: true });
}
