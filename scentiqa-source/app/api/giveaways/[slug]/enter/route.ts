import { NextResponse } from 'next/server';
import { getAuthedServerClient } from '@/lib/supabase-server';
import { getSupabaseServer } from '@/lib/supabase';

// POST /api/giveaways/[slug]/enter — enter a live giveaway (one entry per user)
export async function POST(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const sb = await getAuthedServerClient();
  if (!sb) return NextResponse.json({ error: 'Not configured' }, { status: 500 });
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Sign in to enter' }, { status: 401 });

  const admin = getSupabaseServer(true);
  if (!admin) return NextResponse.json({ error: 'Not configured' }, { status: 500 });

  const { data: g } = await admin.from('giveaways').select('slug, is_active, ends_at').eq('slug', slug).single();
  if (!g) return NextResponse.json({ error: 'Giveaway not found' }, { status: 404 });
  if (!g.is_active || new Date(g.ends_at).getTime() < Date.now()) {
    return NextResponse.json({ error: 'This giveaway has ended' }, { status: 400 });
  }

  const { data: existing } = await admin.from('giveaway_entries')
    .select('id').eq('giveaway_slug', slug).eq('user_id', user.id).single();
  if (existing) return NextResponse.json({ ok: true, already: true });

  const { error: iErr } = await admin.from('giveaway_entries')
    .insert({ giveaway_slug: slug, user_id: user.id });
  if (iErr) {
    // Unique violation = already entered (race)
    if (iErr.code === '23505') return NextResponse.json({ ok: true, already: true });
    return NextResponse.json({ error: iErr.message }, { status: 400 });
  }

  // Recompute the public entry count from the entries table (race-safe).
  const { count } = await admin.from('giveaway_entries')
    .select('id', { count: 'exact', head: true }).eq('giveaway_slug', slug);
  await admin.from('giveaways').update({ entry_count: count ?? 0 }).eq('slug', slug);

  return NextResponse.json({ ok: true });
}
