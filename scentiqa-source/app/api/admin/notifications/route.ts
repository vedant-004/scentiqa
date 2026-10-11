import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin';
import { getSupabaseServer } from '@/lib/supabase';

const TYPES = ['announcement', 'new_perfume', 'giveaway', 'award', 'battle', 'article', 'system'] as const;

// GET /api/admin/notifications — list all with read counts. Admin only.
export async function GET() {
  try { await requireAdmin(); } catch { return NextResponse.json({ error: 'Not authorized' }, { status: 403 }); }
  const c = getSupabaseServer(true);
  if (!c) return NextResponse.json({ error: 'Database not configured' }, { status: 500 });

  const { data: notes, error } = await c
    .from('notifications')
    .select('id, title, message, type, link_url, created_by, created_at')
    .order('created_at', { ascending: false })
    .limit(100);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Read counts per notification (cheap enough at admin scale).
  const withCounts = await Promise.all((notes ?? []).map(async (n) => {
    const { count } = await c.from('notification_reads').select('notification_id', { count: 'exact', head: true }).eq('notification_id', n.id);
    return { ...n, readCount: count ?? 0 };
  }));
  return NextResponse.json({ notifications: withCounts });
}

// POST /api/admin/notifications — broadcast a notification. Admin only.
export async function POST(req: Request) {
  try { await requireAdmin(); } catch { return NextResponse.json({ error: 'Not authorized' }, { status: 403 }); }
  const c = getSupabaseServer(true);
  if (!c) return NextResponse.json({ error: 'Database not configured' }, { status: 500 });

  let body: { title?: string; message?: string; type?: string; link_url?: string };
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }); }

  const title = (body.title ?? '').trim();
  const message = (body.message ?? '').trim();
  const type = (body.type ?? 'announcement').trim();
  const link_url = (body.link_url ?? '').trim() || null;
  if (!title) return NextResponse.json({ error: 'Title is required' }, { status: 400 });
  if (!message) return NextResponse.json({ error: 'Message is required' }, { status: 400 });
  if (!(TYPES as readonly string[]).includes(type)) {
    return NextResponse.json({ error: `Type must be one of: ${TYPES.join(', ')}` }, { status: 400 });
  }

  const { data, error } = await c
    .from('notifications')
    .insert({ title, message, type, link_url })
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, notification: data });
}

// DELETE /api/admin/notifications — delete one (cascade removes reads). Admin only.
export async function DELETE(req: Request) {
  try { await requireAdmin(); } catch { return NextResponse.json({ error: 'Not authorized' }, { status: 403 }); }
  const c = getSupabaseServer(true);
  if (!c) return NextResponse.json({ error: 'Database not configured' }, { status: 500 });

  let body: { id?: string };
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }); }
  const id = (body.id ?? '').trim();
  if (!id) return NextResponse.json({ error: 'Body must be { id }' }, { status: 400 });

  const { error } = await c.from('notifications').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
