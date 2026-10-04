'use server';
// All admin mutations. Every action verifies the admin session first and
// writes through the service-role client (server-side only).
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { getSupabaseServer } from '@/lib/supabase';
import { requireAdmin } from '@/lib/admin';

function db() {
  const c = getSupabaseServer(true);
  if (!c) throw new Error('SUPABASE_SERVICE_ROLE_KEY is not configured');
  return c;
}

const str = (fd: FormData, k: string) => { const v = fd.get(k); return typeof v === 'string' ? v.trim() : ''; };
const numOrNull = (fd: FormData, k: string) => { const v = str(fd, k); if (!v) return null; const n = Number(v); return Number.isFinite(n) ? n : null; };
const listOf = (s: string) => s.split(',').map((x) => x.trim()).filter(Boolean);

function parseAccords(raw: string): { name: string; strength: number }[] {
  const t = raw.trim();
  if (!t) return [];
  try {
    const j = JSON.parse(t);
    if (Array.isArray(j)) return j.map((a) => ({ name: String(a.name ?? a.accord ?? ''), strength: Number(a.strength ?? a.value ?? 50) })).filter((a) => a.name);
  } catch { /* fall through to line format */ }
  return t.split('\n').map((l) => l.trim()).filter(Boolean).map((l) => {
    const m = l.match(/^(.+?)\s*[:=]\s*(\d+)\s*$/);
    return m ? { name: m[1].trim(), strength: Math.min(100, Math.max(0, Number(m[2]))) } : { name: l, strength: 50 };
  });
}

function slugify(s: string) {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80) || 'perfume';
}

async function uniqueSlug(base: string, table: 'perfumes' | 'houses' | 'sellers') {
  const c = db();
  let slug = base, i = 2;
  for (;;) {
    const { data } = await c.from(table).select('id').eq('slug', slug).limit(1);
    if (!data || data.length === 0) return slug;
    slug = `${base}-${i++}`;
  }
}

/* ---------------- perfumes ---------------- */

export async function updatePerfume(id: string, fd: FormData) {
  await requireAdmin();
  const c = db();
  const { error } = await c.from('perfumes').update({
    name: str(fd, 'name'),
    house_id: str(fd, 'house_id') || null,
    gender: str(fd, 'gender') || null,
    concentration: str(fd, 'concentration') || null,
    launch_year: numOrNull(fd, 'launch_year'),
    description: str(fd, 'description') || null,
    top_notes: listOf(str(fd, 'top_notes')),
    heart_notes: listOf(str(fd, 'heart_notes')),
    base_notes: listOf(str(fd, 'base_notes')),
    accords: parseAccords(str(fd, 'accords')),
    bottle_image_url: str(fd, 'bottle_image_url') || null,
    scent_story: str(fd, 'scent_story') || null,
    beginner_friendly: fd.get('beginner_friendly') === 'on' ? true : fd.get('beginner_friendly_null') === 'on' ? null : false,
    is_discontinued: fd.get('is_discontinued') === 'on',
  }).eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/admin/perfumes');
  revalidatePath('/admin/health');
}

export async function createPerfume(fd: FormData) {
  await requireAdmin();
  const c = db();
  const name = str(fd, 'name');
  if (!name) throw new Error('Name is required');
  const slug = await uniqueSlug(slugify(name), 'perfumes');
  const id = `perf_${slug}`.slice(0, 60);
  const { error } = await c.from('perfumes').insert({
    id, slug, name,
    house_id: str(fd, 'house_id') || null,
    gender: str(fd, 'gender') || null,
    concentration: str(fd, 'concentration') || null,
    launch_year: numOrNull(fd, 'launch_year'),
    description: str(fd, 'description') || null,
    top_notes: listOf(str(fd, 'top_notes')),
    heart_notes: listOf(str(fd, 'heart_notes')),
    base_notes: listOf(str(fd, 'base_notes')),
    accords: parseAccords(str(fd, 'accords')),
    bottle_image_url: str(fd, 'bottle_image_url') || null,
    scent_story: str(fd, 'scent_story') || null,
    beginner_friendly: fd.get('beginner_friendly') === 'on' ? true : null,
    is_discontinued: false,
  });
  if (error) throw new Error(error.message);
  revalidatePath('/admin/perfumes');
  redirect(`/admin/perfumes/${id}`);
}

export async function deletePerfume(id: string) {
  await requireAdmin();
  const c = db();
  // remove dependents first (prices, dupe links, reviews reference it)
  await c.from('prices').delete().eq('perfume_id', id);
  await c.from('dupe_relationships').delete().eq('dupe_perfume_id', id);
  await c.from('dupe_relationships').delete().eq('original_perfume_id', id);
  await c.from('reviews').delete().eq('perfume_id', id);
  const { error } = await c.from('perfumes').delete().eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/admin/perfumes');
  redirect('/admin/perfumes');
}

/* ---------------- houses ---------------- */

export async function createHouse(fd: FormData) {
  await requireAdmin();
  const c = db();
  const name = str(fd, 'name');
  if (!name) throw new Error('Name is required');
  const slug = await uniqueSlug(slugify(name), 'houses');
  const { error } = await c.from('houses').insert({
    id: `house_${slug}`.slice(0, 60), slug, name,
    country: str(fd, 'country') || null,
    website_url: str(fd, 'website_url') || null,
    house_type: str(fd, 'house_type') || null,
    description: str(fd, 'description') || null,
  });
  if (error) throw new Error(error.message);
  revalidatePath('/admin/houses');
}

export async function updateHouse(id: string, fd: FormData) {
  await requireAdmin();
  const c = db();
  const { error } = await c.from('houses').update({
    name: str(fd, 'name'),
    country: str(fd, 'country') || null,
    website_url: str(fd, 'website_url') || null,
    house_type: str(fd, 'house_type') || null,
    description: str(fd, 'description') || null,
  }).eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/admin/houses');
}

/* ---------------- sellers & prices ---------------- */

export async function createSeller(fd: FormData) {
  await requireAdmin();
  const c = db();
  const name = str(fd, 'name');
  if (!name) throw new Error('Name is required');
  const slug = await uniqueSlug(slugify(name), 'sellers');
  const { error } = await c.from('sellers').insert({
    id: `seller_${slug}`.slice(0, 60), slug, name,
    website_url: str(fd, 'website_url') || null,
    seller_type: str(fd, 'seller_type') || null,
    verified: fd.get('verified') === 'on',
    trust_notes: str(fd, 'trust_notes') || null,
  });
  if (error) throw new Error(error.message);
  revalidatePath('/admin/sellers');
}

export async function updateSeller(id: string, fd: FormData) {
  await requireAdmin();
  const c = db();
  const { error } = await c.from('sellers').update({
    name: str(fd, 'name'),
    website_url: str(fd, 'website_url') || null,
    seller_type: str(fd, 'seller_type') || null,
    verified: fd.get('verified') === 'on',
    trust_notes: str(fd, 'trust_notes') || null,
  }).eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/admin/sellers');
}

export async function createPrice(fd: FormData) {
  await requireAdmin();
  const c = db();
  const { error } = await c.from('prices').insert({
    id: `pr_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`,
    perfume_id: str(fd, 'perfume_id'),
    seller_id: str(fd, 'seller_id'),
    price_inr: numOrNull(fd, 'price_inr'),
    mrp_inr: numOrNull(fd, 'mrp_inr'),
    size_ml: numOrNull(fd, 'size_ml'),
    in_stock: fd.get('in_stock') === 'on',
    product_url: str(fd, 'product_url') || null,
    price_provenance: 'manual_admin',
    checked_at: new Date().toISOString(),
  });
  if (error) throw new Error(error.message);
  revalidatePath('/admin/sellers');
}

export async function deletePrice(id: string) {
  await requireAdmin();
  const { error } = await db().from('prices').delete().eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/admin/sellers');
}

/* ---------------- dupe mappings ---------------- */

export async function createDupe(fd: FormData) {
  await requireAdmin();
  const c = db();
  const { error } = await c.from('dupe_relationships').insert({
    id: `rel_admin_${Date.now().toString(36)}`,
    original_perfume_id: str(fd, 'original_perfume_id'),
    dupe_perfume_id: str(fd, 'dupe_perfume_id'),
    similarity_score: numOrNull(fd, 'similarity_score'),
    tested_by: str(fd, 'tested_by') || 'community',
    claimed_accuracy_text: str(fd, 'claimed_accuracy_text') || null,
    verdict_text: str(fd, 'verdict_text') || 'Added via admin panel.',
  });
  if (error) throw new Error(error.message);
  revalidatePath('/admin/dupes');
}

export async function deleteDupe(id: string) {
  await requireAdmin();
  const { error } = await db().from('dupe_relationships').delete().eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/admin/dupes');
}

/* ---------------- reviews ---------------- */

export async function deleteReview(id: string) {
  await requireAdmin();
  const { error } = await db().from('reviews').delete().eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/admin/reviews');
}

/* ---------------- photo upload ---------------- */

export async function uploadPhoto(fd: FormData): Promise<string> {
  await requireAdmin();
  const c = db();
  const file = fd.get('photo');
  if (!(file instanceof File) || file.size === 0) throw new Error('No file selected');
  const ext = (file.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg';
  const path = `admin/${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const { error } = await c.storage.from('product-images').upload(path, file, {
    contentType: file.type || 'image/jpeg', upsert: false,
  });
  if (error) throw new Error(`Upload failed: ${error.message}. Create a public Storage bucket named "product-images" in Supabase first.`);
  const { data } = c.storage.from('product-images').getPublicUrl(path);
  revalidatePath('/admin/perfumes');
  return data.publicUrl;
}
