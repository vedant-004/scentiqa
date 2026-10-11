'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { TYPE_META } from '@/components/notifications';
import type { NotificationType } from '@/components/notifications';
import { cn } from '@/lib/utils';

const inputCls = 'w-full rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm text-stone-900 dark:border-white/10 dark:bg-ink-900 dark:text-white';
const TYPES: NotificationType[] = ['announcement', 'new_perfume', 'giveaway', 'award', 'battle', 'article', 'system'];

export function NotificationComposer() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [type, setType] = useState<NotificationType>('announcement');
  const [linkUrl, setLinkUrl] = useState('');
  const [sending, setSending] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  const meta = TYPE_META[type];

  const send = async () => {
    if (!window.confirm('Send this notification to all signed-in members?')) return;
    setErr(null); setOk(null); setSending(true);
    try {
      const r = await fetch('/api/admin/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, message, type, link_url: linkUrl }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error ?? 'Failed to send');
      setOk('Notification sent to all members.');
      setTitle(''); setMessage(''); setLinkUrl(''); setType('announcement');
      router.refresh();
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Failed to send');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="space-y-3">
        <label className="block text-sm font-semibold">Title
          <input value={title} onChange={(e) => setTitle(e.target.value)} className={cn(inputCls, 'mt-1')} placeholder="New Lattafa drop just landed" maxLength={120} />
        </label>
        <label className="block text-sm font-semibold">Message
          <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={4} className={cn(inputCls, 'mt-1')} placeholder="Write the full message members will see…" maxLength={2000} />
        </label>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block text-sm font-semibold">Type
            <select value={type} onChange={(e) => setType(e.target.value as NotificationType)} className={cn(inputCls, 'mt-1')}>
              {TYPES.map((t) => (
                <option key={t} value={t}>{TYPE_META[t].icon} {TYPE_META[t].label}</option>
              ))}
            </select>
          </label>
          <label className="block text-sm font-semibold">Link URL (optional)
            <input value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} className={cn(inputCls, 'mt-1')} placeholder="/giveaways" />
          </label>
        </div>
        {err && <p className="text-sm font-semibold text-red-600 dark:text-red-400">{err}</p>}
        {ok && <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">{ok}</p>}
        <button onClick={send} disabled={sending || !title.trim() || !message.trim()}
          className="rounded-xl bg-gold-600 px-5 py-2.5 text-sm font-bold text-white transition-all hover:bg-gold-500 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50">
          {sending ? 'Sending…' : '🔔 Send to all members'}
        </button>
      </div>

      {/* Live preview */}
      <div>
        <p className="mb-2 text-xs font-bold uppercase tracking-wider text-stone-400">Live preview</p>
        <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-card dark:border-white/10 dark:bg-ink-900">
          <div className="flex items-start gap-3 px-4 py-3">
            <span className="mt-0.5 text-lg" aria-hidden="true">{meta.icon}</span>
            <span className="min-w-0 flex-1">
              <span className="flex items-center gap-2">
                <span className="text-sm font-bold text-stone-900 dark:text-white">{title || 'Your title here'}</span>
                <span className="h-2 w-2 shrink-0 rounded-full bg-red-500" aria-hidden="true" />
              </span>
              <span className="mt-0.5 block text-xs text-stone-500 dark:text-stone-400">{message || 'Your message will appear here…'}</span>
              <span className="mt-1.5 flex items-center gap-2">
                <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide', meta.badge)}>{meta.label}</span>
                <span className="text-[11px] text-stone-400">just now</span>
                {linkUrl.trim() && <span className="ml-auto text-[11px] font-bold text-gold-700 dark:text-gold-300">View →</span>}
              </span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export function NotificationDeleteButton({ id }: { id: string }) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);
  const del = async () => {
    if (!window.confirm('Delete this notification for everyone?')) return;
    setDeleting(true);
    try {
      const r = await fetch('/api/admin/notifications', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      if (!r.ok) { const j = await r.json(); throw new Error(j.error ?? 'Failed'); }
      router.refresh();
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Failed to delete');
      setDeleting(false);
    }
  };
  return (
    <button onClick={del} disabled={deleting}
      className="rounded-lg border border-red-500/30 px-3 py-1.5 text-xs font-bold text-red-600 transition-colors hover:bg-red-500/10 disabled:opacity-50 dark:text-red-400">
      {deleting ? 'Deleting…' : 'Delete'}
    </button>
  );
}
