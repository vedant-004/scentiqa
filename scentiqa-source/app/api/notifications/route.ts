import { NextResponse } from 'next/server';
import { getAuthedServerClient } from '@/lib/supabase-server';

// GET /api/notifications — latest 30 notifications with per-user read state.
// Returns { notifications, unreadCount }. Signed-out users get an empty list (not an error).
export async function GET() {
  const sb = await getAuthedServerClient();
  if (!sb) return NextResponse.json({ notifications: [], unreadCount: 0 });
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ notifications: [], unreadCount: 0 });

  const { data: notes, error } = await sb
    .from('notifications')
    .select('id, title, message, type, link_url, created_at')
    .order('created_at', { ascending: false })
    .limit(30);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Hide unpushed (retracted) notifications. The is_pushed column may not
  // exist until migration 20261015_notification_unpush.sql runs — when it is
  // missing, every notification counts as pushed.
  let unpushed = new Set<string>();
  try {
    const { data: pushed } = await sb.from('notifications').select('id, is_pushed');
    for (const p of pushed ?? []) {
      if ((p as { is_pushed?: boolean }).is_pushed === false) unpushed.add(String(p.id));
    }
  } catch { /* column not migrated yet — nothing is unpushed */ }
  const visible = (notes ?? []).filter((n) => !unpushed.has(String(n.id)));

  const ids = visible.map((n) => n.id);
  let readSet = new Set<string>();
  if (ids.length > 0) {
    const { data: reads } = await sb
      .from('notification_reads')
      .select('notification_id')
      .eq('user_id', user.id)
      .in('notification_id', ids);
    readSet = new Set((reads ?? []).map((r) => String(r.notification_id)));
  }

  const notifications = visible.map((n) => ({
    ...n,
    read: readSet.has(String(n.id)),
  }));
  return NextResponse.json({
    notifications,
    unreadCount: notifications.filter((n) => !n.read).length,
  });
}
