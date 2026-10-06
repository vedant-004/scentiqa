'use server';
// Admin mutations for the Scentiqa Awards: categories, nominees, winners.
import { revalidatePath } from 'next/cache';
import { getSupabaseServer } from '@/lib/supabase';
import { requireAdmin } from '@/lib/admin';

function db() {
  const c = getSupabaseServer(true);
  if (!c) throw new Error('SUPABASE_SERVICE_ROLE_KEY is not configured');
  return c;
}

const str = (fd: FormData, k: string) => { const v = fd.get(k); return typeof v === 'string' ? v.trim() : ''; };
const num = (fd: FormData, k: string, dflt: number) => { const n = Number(str(fd, k)); return Number.isFinite(n) ? n : dflt; };

function slugify(s: string) {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80) || 'category';
}

function touch(year: number) {
  // Cache invalidation must never break the mutation itself.
  try {
    revalidatePath('/admin/awards');
    // Layout-level invalidation covers /awards, /awards/[year] and /awards/[year]/[category]
    revalidatePath('/awards', 'layout');
  } catch (e) {
    console.error('[admin/awards] revalidate failed', e instanceof Error ? e.message : e);
  }
}

/**
 * Run an action, converting ANY thrown value into a plain Error with the real
 * message. This prevents React's production error redaction (#441) from hiding
 * the actual cause from the admin UI.
 */
async function guarded<T>(name: string, fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (e) {
    const msg = e instanceof Error ? (e.message || e.name) : String(e);
    console.error(`[admin/awards:${name}]`, msg);
    throw new Error(msg);
  }
}

/* ---------------- categories ---------------- */

export async function createCategory(year: number, fd: FormData) {
  return guarded('createCategory', async () => {
    await requireAdmin();
    const name = str(fd, 'name');
    if (!name) throw new Error('Name required');
    const section = str(fd, 'section') === 'indian' ? 'indian' : 'global';
    const nominee_type = str(fd, 'nominee_type') === 'house' ? 'house' : 'perfume';
    const slug = slugify(str(fd, 'slug') || name);
    const { error } = await db().from('award_categories').insert({
      year, slug, name,
      description: str(fd, 'description'),
      icon: str(fd, 'icon') || '🏆',
      section, nominee_type,
      sort_order: num(fd, 'sort_order', 0),
    });
    if (error) throw new Error(error.message);
    touch(year);
  });
}

export async function updateCategory(id: number, fd: FormData) {
  return guarded('updateCategory', async () => {
    await requireAdmin();
    const name = str(fd, 'name');
    if (!name) throw new Error('Name required');
    const c = db();
    const { data: cur } = await c.from('award_categories').select('year').eq('id', id).single();
    const year = Number((cur as { year: number } | null)?.year ?? 0);
    const { error } = await c.from('award_categories').update({
      name,
      description: str(fd, 'description'),
      icon: str(fd, 'icon') || '🏆',
      section: str(fd, 'section') === 'indian' ? 'indian' : 'global',
      sort_order: num(fd, 'sort_order', 0),
    }).eq('id', id);
    if (error) throw new Error(error.message);
    touch(year);
  });
}

export async function deleteCategory(id: number) {
  return guarded('deleteCategory', async () => {
    await requireAdmin();
    const c = db();
    const { data: cur } = await c.from('award_categories').select('year, slug').eq('id', id).single();
    const rec = cur as { year: number; slug: string } | null;
    if (!rec) throw new Error('Category not found');
    // Remove its nominee rows first
    await c.from('awards').delete().eq('year', rec.year).eq('category_slug', rec.slug);
    const { error } = await c.from('award_categories').delete().eq('id', id);
    if (error) throw new Error(error.message);
    touch(rec.year);
  });
}

/** Copy all categories of one year into a new year (without nominees). */
export async function cloneEdition(fromYear: number, toYear: number) {
  return guarded('cloneEdition', async () => {
    await requireAdmin();
    if (!Number.isFinite(toYear) || toYear < 2000 || toYear > 2100) throw new Error('Invalid year');
    const c = db();
    const { data: cats } = await c.from('award_categories').select('*').eq('year', fromYear);
    if (!cats || cats.length === 0) throw new Error(`No categories found for ${fromYear}`);
    const rows = (cats as Record<string, unknown>[]).map((r) => ({
      year: toYear, slug: r.slug, name: r.name, description: r.description,
      icon: r.icon, section: r.section, nominee_type: r.nominee_type, sort_order: r.sort_order,
    }));
    const { error } = await c.from('award_categories').upsert(rows, { onConflict: 'year,slug' });
    if (error) throw new Error(error.message);
    touch(toYear);
  });
}

/* ---------------- nominees ---------------- */

export async function addNominee(categoryId: number, kind: 'perfume' | 'house', refId: string) {
  return guarded('addNominee', async () => {
    await requireAdmin();
    const c = db();
    const { data: cat, error: catErr } = await c.from('award_categories')
      .select('year, slug, name, nominee_type').eq('id', categoryId).single();
    if (catErr) throw new Error(`Category lookup failed: ${catErr.message}`);
    const rec = cat as { year: number; slug: string; name: string; nominee_type: string } | null;
    if (!rec) throw new Error('Category not found');
    if (rec.nominee_type !== kind) throw new Error(`This category takes ${rec.nominee_type} nominees`);
    // Verify the referenced row exists
    const table = kind === 'house' ? 'houses' : 'perfumes';
    const { data: ref, error: refErr } = await c.from(table).select('id').eq('id', refId).limit(1).single();
    if (refErr || !ref) throw new Error(`${kind === 'house' ? 'House' : 'Perfume'} not found`);
    const col = kind === 'house' ? 'nominee_house_id' : 'nominee_perfume_id';
    const { data: existing, error: exErr } = await c.from('awards').select('id')
      .eq('year', rec.year).eq('category_slug', rec.slug).eq(col, refId).limit(1);
    if (exErr) throw new Error(`Duplicate check failed: ${exErr.message}`);
    if (existing && existing.length > 0) throw new Error('Already a nominee in this category');
    const { error } = await c.from('awards').insert({
      year: rec.year, category: rec.name, category_slug: rec.slug,
      nominee_kind: kind, [col]: refId, vote_count: 0, is_winner: false,
    });
    if (error) throw new Error(`Insert failed: ${error.message}`);
    touch(rec.year);
  });
}

export async function removeNominee(rowId: number) {
  return guarded('removeNominee', async () => {
    await requireAdmin();
    const c = db();
    const { data: cur } = await c.from('awards').select('year').eq('id', rowId).single();
    const year = Number((cur as { year: number } | null)?.year ?? 0);
    const { error } = await c.from('awards').delete().eq('id', rowId);
    if (error) throw new Error(error.message);
    touch(year);
  });
}

export async function setWinner(categoryId: number, rowId: number | null) {
  return guarded('setWinner', async () => {
    await requireAdmin();
    const c = db();
    const { data: cat } = await c.from('award_categories').select('year, slug').eq('id', categoryId).single();
    const rec = cat as { year: number; slug: string } | null;
    if (!rec) throw new Error('Category not found');
    const { error: e1 } = await c.from('awards').update({ is_winner: false })
      .eq('year', rec.year).eq('category_slug', rec.slug);
    if (e1) throw new Error(e1.message);
    if (rowId !== null) {
      const { error: e2 } = await c.from('awards').update({ is_winner: true }).eq('id', rowId);
      if (e2) throw new Error(e2.message);
    }
    touch(rec.year);
  });
}

/* ---------------- search (for the nominee picker) ---------------- */

export async function searchPerfumes(q: string): Promise<Array<{ id: string; name: string; house: string }>> {
  return guarded('searchPerfumes', async () => {
    await requireAdmin();
    const query = q.trim();
    if (query.length < 2) return [];
    const { data, error } = await db().from('perfumes')
      .select('id, name, houses(name)').ilike('name', `%${query}%`).limit(12);
    if (error) throw new Error(error.message);
    return (data ?? []).map((r) => {
      const rec = r as Record<string, unknown>;
      const h = rec.houses as Record<string, string> | undefined;
      return { id: rec.id as string, name: rec.name as string, house: h?.name ?? '' };
    });
  });
}

export async function searchHouses(q: string): Promise<Array<{ id: string; name: string }>> {
  return guarded('searchHouses', async () => {
    await requireAdmin();
    const query = q.trim();
    if (query.length < 2) return [];
    const { data, error } = await db().from('houses').select('id, name').ilike('name', `%${query}%`).limit(12);
    if (error) throw new Error(error.message);
    return (data ?? []).map((r) => {
      const rec = r as Record<string, unknown>;
      return { id: rec.id as string, name: rec.name as string };
    });
  });
}
