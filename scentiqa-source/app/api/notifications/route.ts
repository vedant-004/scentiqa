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

  const ids = (notes ?? []).map((n) => n.id);
  let readSet = new Set<string>();
  if (ids.length > 0) {
    const { data: reads } = await sb
      .from('notification_reads')
      .select('notification_id')
      .eq('user_id', user.id)
      .in('notification_id', ids);
    readSet = new Set((reads ?? []).map((r) => String(r.notification_id)));
  }

  const notifications = (notes ?? []).map((n) => ({
    ...n,
    read: readSet.has(String(n.id)),
  }));
  return NextResponse.json({
    notifications,
    unreadCount: notifications.filter((n) => !n.read).length,
  });
}
