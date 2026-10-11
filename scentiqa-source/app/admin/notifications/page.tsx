import { getSupabaseServer } from '@/lib/supabase';
import { requireAdminPage } from '@/lib/admin';
import { SectionTitle, EmptyState } from '../components';
import { NotificationComposer, NotificationDeleteButton } from './notification-client';
import { TYPE_META } from '@/components/notifications';
import type { NotificationType } from '@/components/notifications';
import { cn } from '@/lib/utils';

export const metadata = { title: 'Notifications · Admin' };
export const dynamic = 'force-dynamic';

export default async function AdminNotifications() {
  await requireAdminPage();
  const c = getSupabaseServer(true)!;
  const { data } = await c
    .from('notifications')
    .select('id, title, message, type, link_url, created_at')
    .order('created_at', { ascending: false })
    .limit(100);

  const notes = await Promise.all((data ?? []).map(async (n) => {
    const { count } = await c.from('notification_reads').select('notification_id', { count: 'exact', head: true }).eq('notification_id', n.id);
    return { ...n, readCount: count ?? 0 };
  }));

  return (
    <div>
      <SectionTitle>Notifications ({notes.length})</SectionTitle>
      <p className="mb-6 max-w-2xl text-sm text-stone-500 dark:text-stone-400">
        Broadcast a notification to every signed-in member. It appears instantly in the header bell dropdown.
      </p>

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
              <div key={n.id} className="rounded-2xl border border-stone-200 bg-white p-4 dark:border-white/10 dark:bg-white/[0.03]">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="font-display text-base font-bold">
                      <span className="mr-2" aria-hidden="true">{meta.icon}</span>
                      {n.title}
                      <span className={cn('ml-2 rounded-full px-2 py-0.5 align-middle text-[11px] font-bold uppercase tracking-wide', meta.badge)}>
                        {meta.label}
                      </span>
                    </p>
                    <p className="mt-1 line-clamp-2 text-sm text-stone-600 dark:text-stone-300">{n.message}</p>
                    <p className="mt-1 text-xs text-stone-400">
                      {new Date(n.created_at).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })}
                      {' · '}<strong className="text-stone-600 dark:text-stone-300">{n.readCount} member{n.readCount === 1 ? '' : 's'} read</strong>
                      {n.link_url && <span className="ml-2 text-gold-700 dark:text-gold-300">→ {n.link_url}</span>}
                    </p>
                  </div>
                  <NotificationDeleteButton id={n.id} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
