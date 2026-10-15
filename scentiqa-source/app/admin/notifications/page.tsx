import { getSupabaseServer } from '@/lib/supabase';
import { requireAdminPage } from '@/lib/admin';
import { SectionTitle, EmptyState } from '../components';
import { NotificationComposer, NotificationDeleteButton, NotificationPushToggle } from './notification-client';
import { TYPE_META } from '@/components/notifications';
import type { NotificationType } from '@/components/notifications';
import { cn } from '@/lib/utils';

export const metadata = { title: 'Notifications · Admin' };
export const dynamic = 'force-dynamic';

interface AdminNote {
  id: string;
  title: string;
  message: string;
  type: string;
  link_url: string | null;
  created_at: string;
  readCount: number;
  is_pushed: boolean;
}

async function loadNotifications(): Promise<{ notes: AdminNote[]; error: string | null }> {
  try {
    const c = getSupabaseServer(true);
    if (!c) return { notes: [], error: 'Database not configured (missing Supabase env vars).' };
    const { data, error } = await c
      .from('notifications')
      .select('id, title, message, type, link_url, created_at')
      .order('created_at', { ascending: false })
      .limit(100);
    if (error) return { notes: [], error: `Could not load notifications: ${error.message}` };

    // Pushed state lives in the optional is_pushed column (migration
    // 20261015_notification_unpush.sql). Missing column = all pushed.
    let pushedById: Record<string, boolean> = {};
    try {
      const { data: pushed } = await c.from('notifications').select('id, is_pushed');
      for (const p of pushed ?? []) pushedById[String(p.id)] = (p as { is_pushed?: boolean }).is_pushed ?? true;
    } catch { /* not migrated yet */ }

    const notes: AdminNote[] = await Promise.all((data ?? []).map(async (n) => {
      let readCount = 0;
      try {
        const { count } = await c.from('notification_reads')
          .select('notification_id', { count: 'exact', head: true })
          .eq('notification_id', n.id);
        readCount = count ?? 0;
      } catch { /* keep 0 — one bad row must not break the page */ }
      return {
        id: String(n.id ?? ''),
        title: String(n.title ?? '(no title)'),
        message: String(n.message ?? ''),
        type: String(n.type ?? 'announcement'),
        link_url: n.link_url ?? null,
        created_at: String(n.created_at ?? ''),
        readCount,
        is_pushed: pushedById[String(n.id)] ?? true,
      };
    }));
    return { notes, error: null };
  } catch (e) {
    return { notes: [], error: e instanceof Error ? e.message : 'Unexpected error loading notifications.' };
  }
}

export default async function AdminNotifications() {
  await requireAdminPage();
  const { notes, error } = await loadNotifications();

  return (
    <div>
      <SectionTitle>Notifications ({notes.length})</SectionTitle>
      <p className="mb-6 max-w-2xl text-sm text-stone-500 dark:text-stone-400">
        Broadcast a notification to every signed-in member. It appears instantly in the header bell dropdown.
        Unpush hides it from members without deleting the record.
      </p>

      {error && (
        <div className="mb-6 rounded-2xl border border-red-500/40 bg-red-500/10 p-4" role="alert">
          <p className="text-sm font-bold text-red-700 dark:text-red-300">Could not load sent notifications</p>
          <p className="mt-1 text-sm text-red-600 dark:text-red-400">{error}</p>
          <p className="mt-1 text-xs text-stone-500 dark:text-stone-400">You can still compose a new one below — sending uses a separate path.</p>
        </div>
      )}

      <div className="mb-10 rounded-2xl border border-stone-200 bg-white p-5 dark:border-white/10 dark:bg-white/[0.03]">
        <h2 className="mb-4 font-display text-lg font-bold">New notification</h2>
        <NotificationComposer />
      </div>

      <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-stone-400">Sent ({notes.length})</h2>
      {notes.length === 0 ? (
        <EmptyState>No notifications sent yet — compose one above.</EmptyState>
      ) : (
        <div className="space-y-3">
          {notes.map((n) => {
            const meta = TYPE_META[(n.type as NotificationType)] ?? TYPE_META.announcement;
            return (
              <div key={n.id} className={cn('rounded-2xl border border-stone-200 bg-white p-4 dark:border-white/10 dark:bg-white/[0.03]', !n.is_pushed && 'opacity-70')}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="font-display text-base font-bold">
                      <span className="mr-2" aria-hidden="true">{meta.icon}</span>
                      {n.title}
                      <span className={cn('ml-2 rounded-full px-2 py-0.5 align-middle text-[11px] font-bold uppercase tracking-wide', meta.badge)}>
                        {meta.label}
                      </span>
                      {!n.is_pushed && (
                        <span className="ml-2 rounded-full bg-stone-500/15 px-2 py-0.5 align-middle text-[11px] font-bold uppercase tracking-wide text-stone-500 dark:text-stone-400">
                          Unpushed
                        </span>
                      )}
                    </p>
                    <p className="mt-1 line-clamp-2 text-sm text-stone-600 dark:text-stone-300">{n.message}</p>
                    <p className="mt-1 text-xs text-stone-400">
                      {n.created_at ? new Date(n.created_at).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' }) : '—'}
                      {' · '}<strong className="text-stone-600 dark:text-stone-300">{n.readCount} member{n.readCount === 1 ? '' : 's'} read</strong>
                      {n.link_url && <span className="ml-2 text-gold-700 dark:text-gold-300">→ {n.link_url}</span>}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <NotificationPushToggle id={n.id} isPushed={n.is_pushed} />
                    <NotificationDeleteButton id={n.id} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
