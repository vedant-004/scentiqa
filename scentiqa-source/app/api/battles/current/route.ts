import { NextResponse } from 'next/server';
import { getAuthedServerClient } from '@/lib/supabase-server';

// GET /api/battles/current — the active (or most recent) battle with entries
export async function GET() {
  const sb = await getAuthedServerClient();
  if (!sb) return NextResponse.json({ error: 'Not configured' }, { status: 500 });

  const { data: battle } = await sb.from('battles')
    .select('*')
    .order('starts_at', { ascending: false, nullsFirst: false })
    .limit(1)
    .single();
  if (!battle) return NextResponse.json({ battle: null });

  const { data: entries } = await sb.from('battle_entries')
    .select('seed, perfumes(id, slug, name, bottle_image_url, houses(name))')
    .eq('battle_id', battle.id)
    .order('seed', { ascending: true });

  const { data: matchups } = await sb.from('battle_matchups')
    .select('*')
    .eq('battle_id', battle.id)
    .order('round', { ascending: true });

  return NextResponse.json({ battle, entries: entries ?? [], matchups: matchups ?? [] });
}
