// Write actions: real Supabase writes in live mode; friendly demo notice otherwise.
'use client';
import { getSupabaseBrowser, isSupabaseConfigured } from '@/lib/supabase';

export interface ActionResult { ok: boolean; demo?: boolean; error?: string }

async function authed() {
  const sb = getSupabaseBrowser();
  if (!sb) return null;
  const { data } = await sb.auth.getUser();
  return data.user ? sb : null;
}

export async function requireAccount(): Promise<{ sb: NonNullable<ReturnType<typeof getSupabaseBrowser>>; userId: string } | { demo: true }> {
  if (!isSupabaseConfigured()) return { demo: true };
  const sb = await authed();
  if (!sb) return { demo: true };
  const { data } = await sb.auth.getUser();
  if (!data.user) return { demo: true };
  // Self-heal: ensure the public.users row this user_id FKs against exists.
  await sb.rpc('ensure_public_user');
  return { sb, userId: data.user.id };
}

export async function postReview(perfumeId: string, rating: number, title: string, body: string): Promise<ActionResult> {
  const a = await requireAccount();
  if ('demo' in a) return { ok: false, demo: true };
  const { error } = await a.sb.from('reviews').insert({ user_id: a.userId, perfume_id: perfumeId, rating, title, body });
  return error ? { ok: false, error: error.message } : { ok: true };
}

export async function castVote(perfumeId: string, voteType: string, voteValue: string): Promise<ActionResult> {
  const a = await requireAccount();
  if ('demo' in a) return { ok: false, demo: true };
  const { error } = await a.sb.from('community_votes').upsert(
    { user_id: a.userId, perfume_id: perfumeId, vote_type: voteType, vote_value: voteValue },
    { onConflict: 'user_id,perfume_id,vote_type' },
  );
  return error ? { ok: false, error: error.message } : { ok: true };
}

export async function setWardrobe(perfumeId: string, shelf: string): Promise<ActionResult> {
  const a = await requireAccount();
  if ('demo' in a) return { ok: false, demo: true };
  const { error } = await a.sb.from('wardrobe_items').upsert(
    { user_id: a.userId, perfume_id: perfumeId, shelf },
    { onConflict: 'user_id,perfume_id,shelf' },
  );
  return error ? { ok: false, error: error.message } : { ok: true };
}

export async function removeWardrobe(perfumeId: string, shelf: string): Promise<ActionResult> {
  const a = await requireAccount();
  if ('demo' in a) return { ok: false, demo: true };
  const { error } = await a.sb.from('wardrobe_items').delete().eq('user_id', a.userId).eq('perfume_id', perfumeId).eq('shelf', shelf);
  return error ? { ok: false, error: error.message } : { ok: true };
}

export async function removePriceAlert(alertId: number): Promise<ActionResult> {
  const a = await requireAccount();
  if ('demo' in a) return { ok: false, demo: true };
  const { error } = await a.sb.from('price_alerts').delete().eq('user_id', a.userId).eq('id', alertId);
  return error ? { ok: false, error: error.message } : { ok: true };
}

export async function createPriceAlert(perfumeId: string, targetPrice: number): Promise<ActionResult> {
  const a = await requireAccount();
  if ('demo' in a) return { ok: false, demo: true };
  const { error } = await a.sb.from('price_alerts').insert({ user_id: a.userId, perfume_id: perfumeId, target_price_inr: targetPrice });
  return error ? { ok: false, error: error.message } : { ok: true };
}

export async function suggestDupe(originalId: string, dupeName: string, houseName: string, note: string): Promise<ActionResult> {
  const a = await requireAccount();
  if ('demo' in a) return { ok: false, demo: true };
  const { error } = await a.sb.from('reports').insert({
    reporter_user_id: a.userId, target_type: 'review', target_id: originalId,
    reason: `Suggested dupe: ${dupeName} by ${houseName}. ${note}`,
  });
  return error ? { ok: false, error: error.message } : { ok: true };
}

export async function markHelpful(reviewId: string): Promise<ActionResult> {
  const a = await requireAccount();
  if ('demo' in a) return { ok: false, demo: true };
  const { error } = await a.sb.rpc('increment_helpful', { review_id: reviewId });
  return error ? { ok: false, error: error.message } : { ok: true };
}

export async function reportPriceError(perfumeId: string, detail: string): Promise<ActionResult> {
  const a = await requireAccount();
  if ('demo' in a) return { ok: false, demo: true };
  const { error } = await a.sb.from('reports').insert({
    reporter_user_id: a.userId, target_type: 'price', target_id: perfumeId,
    reason: detail.slice(0, 500),
  });
  return error ? { ok: false, error: error.message } : { ok: true };
}
