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
  const words = body.trim().split(/\s+/).filter(Boolean).length;
  if (!(rating > 0) || words < 10) return { ok: false, error: 'Please write at least 10 words and pick a star rating.' };
  const { error } = await a.sb.from('reviews').insert({ user_id: a.userId, perfume_id: perfumeId, rating, title, body });
  return error ? { ok: false, error: error.message } : { ok: true };
}

export async function updateReview(reviewId: string, rating: number, title: string, body: string): Promise<ActionResult> {
  const a = await requireAccount();
  if ('demo' in a) return { ok: false, demo: true };
  const words = body.trim().split(/\s+/).filter(Boolean).length;
  if (!(rating > 0) || words < 10) return { ok: false, error: 'Please write at least 10 words and pick a star rating.' };
  const { error } = await a.sb.from('reviews').update({ rating, title, body }).eq('id', reviewId).eq('user_id', a.userId);
  return error ? { ok: false, error: error.message } : { ok: true };
}

export async function deleteReview(reviewId: string): Promise<ActionResult> {
  const a = await requireAccount();
  if ('demo' in a) return { ok: false, demo: true };
  const { error } = await a.sb.from('reviews').delete().eq('id', reviewId).eq('user_id', a.userId);
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

export async function setWardrobeVisibility(visibility: 'private' | 'public'): Promise<ActionResult> {
  const a = await requireAccount();
  if ('demo' in a) return { ok: false, demo: true };
  if (visibility !== 'private' && visibility !== 'public') return { ok: false, error: 'Invalid visibility.' };
  const { error } = await a.sb.from('users').update({ wardrobe_visibility: visibility }).eq('id', a.userId);
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

export async function postForumReply(topicId: string, body: string): Promise<ActionResult> {
  const a = await requireAccount();
  if ('demo' in a) return { ok: false, demo: true };
  const words = body.trim().split(/\s+/).filter(Boolean).length;
  if (words < 10) return { ok: false, error: 'Please write at least 10 words.' };
  const postId = `post_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
  const { error } = await a.sb.from('forum_posts').insert({
    id: postId, topic_id: topicId, user_id: a.userId, body: body.trim().slice(0, 5000),
  });
  if (error) return { ok: false, error: error.message };
  // Bump reply count + last post time (best effort)
  const { count } = await a.sb.from('forum_posts').select('id', { count: 'exact', head: true }).eq('topic_id', topicId);
  await a.sb.from('forum_topics').update({
    reply_count: count ?? 1,
    last_post_at: new Date().toISOString(),
  }).eq('id', topicId);
  return { ok: true };
}

export async function createForumTopic(categoryId: string, title: string, body: string): Promise<ActionResult & { topicId?: string }> {
  const a = await requireAccount();
  if ('demo' in a) return { ok: false, demo: true };
  const cleanTitle = title.trim().slice(0, 120);
  const words = body.trim().split(/\s+/).filter(Boolean).length;
  if (!cleanTitle) return { ok: false, error: 'Give your discussion a title.' };
  if (words < 10) return { ok: false, error: 'Please write at least 10 words.' };
  const topicId = `topic_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
  const { error: tErr } = await a.sb.from('forum_topics').insert({
    id: topicId, category_id: categoryId, user_id: a.userId, title: cleanTitle,
  });
  if (tErr) return { ok: false, error: tErr.message };
  const postId = `post_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
  const { error: pErr } = await a.sb.from('forum_posts').insert({
    id: postId, topic_id: topicId, user_id: a.userId, body: body.trim().slice(0, 5000),
  });
  if (pErr) return { ok: false, error: pErr.message };
  await a.sb.from('forum_topics').update({ reply_count: 1 }).eq('id', topicId);
  return { ok: true, topicId };
}

export async function updateProfile(username: string, bio: string, location: string): Promise<ActionResult> {
  const a = await requireAccount();
  if ('demo' in a) return { ok: false, demo: true };
  const cleanUsername = username.trim();
  if (!/^[a-zA-Z0-9_]{3,20}$/.test(cleanUsername)) {
    return { ok: false, error: 'Username must be 3-20 characters (letters, numbers, underscore only).' };
  }
  if (bio.length > 500) return { ok: false, error: 'Bio must be 500 characters or less.' };
  // Check username is not taken by someone else
  const { data: existing } = await a.sb.from('users').select('id').eq('username', cleanUsername).limit(1);
  if (existing && existing.length > 0 && (existing[0] as { id: string }).id !== a.userId) {
    return { ok: false, error: 'That username is already taken.' };
  }
  const { error } = await a.sb.from('users').update({
    username: cleanUsername,
    bio: bio.trim().slice(0, 500),
    location_city: location.trim().slice(0, 100),
  }).eq('id', a.userId);
  return error ? { ok: false, error: error.message } : { ok: true };
}

export async function exportUserData(): Promise<ActionResult & { data?: string }> {
  const a = await requireAccount();
  if ('demo' in a) return { ok: false, demo: true };
  const uid = a.userId;
  const [profileR, reviewsR, wardrobeR, votesR, alertsR, diaryR] = await Promise.all([
    a.sb.from('users').select('username, bio, location_city, level, created_at').eq('id', uid).maybeSingle(),
    a.sb.from('reviews').select('id, rating, title, body, created_at, perfumes(slug, name)').eq('user_id', uid),
    a.sb.from('wardrobe_items').select('shelf, created_at, perfumes(slug, name)').eq('user_id', uid),
    a.sb.from('community_votes').select('vote_type, vote_value, created_at, perfumes(slug, name)').eq('user_id', uid),
    a.sb.from('price_alerts').select('id, target_price_inr, created_at, perfumes(slug, name)').eq('user_id', uid),
    a.sb.from('wear_logs').select('worn_on, perfume_id, created_at').eq('user_id', uid),
  ]);
  const data = {
    exported_at: new Date().toISOString(),
    profile: profileR.data ?? null,
    reviews: reviewsR.data ?? [],
    wardrobe: wardrobeR.data ?? [],
    votes: votesR.data ?? [],
    price_alerts: alertsR.data ?? [],
    diary_entries: diaryR.data ?? [],
  };
  return { ok: true, data: JSON.stringify(data, null, 2) };
}

export async function deleteAccount(): Promise<ActionResult> {
  const a = await requireAccount();
  if ('demo' in a) return { ok: false, demo: true };
  const uid = a.userId;
  // Delete all user data from public tables (order matters for FK constraints)
  const tables = ['reviews', 'community_votes', 'wardrobe_items', 'price_alerts', 'wear_logs'];
  for (const table of tables) {
    const { error } = await a.sb.from(table).delete().eq('user_id', uid);
    if (error) return { ok: false, error: `Could not delete from ${table}: ${error.message}` };
  }
  // Delete forum posts and topics
  await a.sb.from('forum_posts').delete().eq('user_id', uid);
  await a.sb.from('forum_topics').delete().eq('user_id', uid);
  // Delete the public users row
  const { error: userError } = await a.sb.from('users').delete().eq('id', uid);
  if (userError) return { ok: false, error: `Could not delete profile: ${userError.message}` };
  // Note: the auth.users record cannot be deleted client-side; it will be orphaned.
  // An admin can clean it up via the Supabase dashboard.
  return { ok: true };
}
