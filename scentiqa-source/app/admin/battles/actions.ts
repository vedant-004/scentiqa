'use server';
// Admin mutations for Scent Battles: create battles, manage entries,
// generate brackets, advance rounds, declare winners.
import { revalidatePath } from 'next/cache';
import { getSupabaseServer } from '@/lib/supabase';
import { requireAdmin } from '@/lib/admin';

function db() {
  const c = getSupabaseServer(true);
  if (!c) throw new Error('SUPABASE_SERVICE_ROLE_KEY is not configured');
  return c;
}

const str = (fd: FormData, k: string) => { const v = fd.get(k); return typeof v === 'string' ? v.trim() : ''; };

export async function createBattle(fd: FormData) {
  await requireAdmin();
  const title = str(fd, 'title');
  if (!title) throw new Error('Title required');
  const { data, error } = await db().from('battles').insert({
    title,
    theme: str(fd, 'theme') || null,
    status: str(fd, 'status') || 'upcoming',
    starts_at: str(fd, 'starts_at') || null,
    ends_at: str(fd, 'ends_at') || null,
  }).select('id').single();
  if (error) throw new Error(error.message);
  revalidatePath('/admin/battles');
  return data.id as string;
}

export async function updateBattleStatus(battleId: string, status: string) {
  await requireAdmin();
  if (!['upcoming', 'active', 'completed'].includes(status)) throw new Error('Invalid status');
  const { error } = await db().from('battles').update({ status }).eq('id', battleId);
  if (error) throw new Error(error.message);
  revalidatePath('/admin/battles');
}

export async function addBattleEntry(battleId: string, fd: FormData) {
  await requireAdmin();
  const perfume_id = str(fd, 'perfume_id');
  const seed = str(fd, 'seed');
  if (!perfume_id) throw new Error('perfume_id required');
  // Verify perfume exists
  const { data: p } = await db().from('perfumes').select('id').eq('id', perfume_id).limit(1).single();
  if (!p) throw new Error('Perfume not found');
  const { error } = await db().from('battle_entries').upsert(
    { battle_id: battleId, perfume_id, seed: seed ? Number(seed) : null },
    { onConflict: 'battle_id,perfume_id' }
  );
  if (error) throw new Error(error.message);
  revalidatePath('/admin/battles');
}

export async function removeBattleEntry(battleId: string, perfumeId: string) {
  await requireAdmin();
  const { error } = await db().from('battle_entries').delete().eq('battle_id', battleId).eq('perfume_id', perfumeId);
  if (error) throw new Error(error.message);
  revalidatePath('/admin/battles');
}

/** Generate round-1 matchups from entries (seeded 1vN, 2vN-1…). Requires even entry count ≥ 4. */
export async function generateBracket(battleId: string) {
  await requireAdmin();
  const c = db();
  const { data: entries } = await c.from('battle_entries').select('perfume_id, seed').eq('battle_id', battleId).order('seed', { ascending: true });
  const list = entries ?? [];
  if (list.length < 4 || list.length % 2 !== 0) throw new Error('Need an even number of entries (≥4) to generate a bracket');
  // Clear existing round-1 matchups
  await c.from('battle_matchups').delete().eq('battle_id', battleId).eq('round', 1);
  const half = list.length / 2;
  const rows = [];
  for (let i = 0; i < half; i++) {
    rows.push({
      battle_id: battleId, round: 1,
      perfume_a_id: list[i].perfume_id,
      perfume_b_id: list[list.length - 1 - i].perfume_id,
    });
  }
  const { error } = await c.from('battle_matchups').insert(rows);
  if (error) throw new Error(error.message);
  revalidatePath('/admin/battles');
}

/** Set the winner of a matchup (closes voting). */
export async function setMatchupWinner(battleId: string, matchupId: string, winnerId: string) {
  await requireAdmin();
  const { error } = await db().from('battle_matchups').update({ winner_id: winnerId }).eq('id', matchupId).eq('battle_id', battleId);
  if (error) throw new Error(error.message);
  revalidatePath('/admin/battles');
}

/** Advance winners of a round into the next round's matchups. */
export async function advanceRound(battleId: string, fromRound: number) {
  await requireAdmin();
  const c = db();
  const { data: done } = await c.from('battle_matchups')
    .select('id, winner_id').eq('battle_id', battleId).eq('round', fromRound).order('id');
  const winners = (done ?? []).map((m) => m.winner_id).filter(Boolean) as string[];
  if (winners.length < 2 || winners.length % 2 !== 0) {
    throw new Error('All matchups in this round need a winner (even count) before advancing');
  }
  await c.from('battle_matchups').delete().eq('battle_id', battleId).eq('round', fromRound + 1);
  const rows = [];
  for (let i = 0; i < winners.length; i += 2) {
    rows.push({ battle_id: battleId, round: fromRound + 1, perfume_a_id: winners[i], perfume_b_id: winners[i + 1] });
  }
  const { error } = await c.from('battle_matchups').insert(rows);
  if (error) throw new Error(error.message);
  revalidatePath('/admin/battles');
}
