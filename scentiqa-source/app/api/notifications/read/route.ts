import { NextResponse } from 'next/server';
import { getAuthedServerClient } from '@/lib/supabase-server';

// POST /api/notifications/read — mark notification(s) as read.
// Body: { id?: string } marks one; { all: true } marks every notification.
export async function POST(req: Request) {
  const sb = await getAuthedServerClient();
  if (!sb) return NextResponse.json({ error: 'Not configured' }, { status: 500 });
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Sign in to continue' }, { status: 401 });

  let body: { id?: string; all?: boolean };
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }); }

  if (body.all) {
    const { data: notes } = await sb.from('notifications').select('id').limit(500);
    const rows = (notes ?? []).map((n) => ({ notification_id: n.id, user_id: user.id }));
    if (rows.length > 0) {
      const { error } = await sb.from('notification_reads').upsert(rows, { onConflict: 'notification_id,user_id' });
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true, marked: rows.length });
  }

  const id = (body.id ?? '').trim();
  if (!id) return NextResponse.json({ error: 'Body must be { id } or { all: true }' }, { status: 400 });
  const { error } = await sb
    .from('notification_reads')
    .upsert({ notification_id: id, user_id: user.id }, { onConflict: 'notification_id,user_id' });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
