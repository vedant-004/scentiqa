'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useAuth } from './auth';
import { cn } from '@/lib/utils';

export type NotificationType = 'announcement' | 'new_perfume' | 'giveaway' | 'award' | 'battle' | 'article' | 'system';

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  link_url: string | null;
  created_at: string;
  read: boolean;
}

export const TYPE_META: Record<NotificationType, { icon: string; label: string; badge: string }> = {
  announcement: { icon: '📢', label: 'Announcement', badge: 'bg-gold-500/15 text-gold-700 dark:text-gold-300' },
  new_perfume: { icon: '✨', label: 'New perfume', badge: 'bg-violet-500/15 text-violet-600 dark:text-violet-300' },
  giveaway: { icon: '🎁', label: 'Giveaway', badge: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-300' },
  award: { icon: '🏆', label: 'Award', badge: 'bg-amber-500/15 text-amber-600 dark:text-amber-300' },
  battle: { icon: '⚔', label: 'Battle', badge: 'bg-rose-500/15 text-rose-600 dark:text-rose-300' },
  article: { icon: '📰', label: 'Article', badge: 'bg-sky-500/15 text-sky-600 dark:text-sky-300' },
  system: { icon: '⚙', label: 'System', badge: 'bg-stone-500/15 text-stone-500 dark:text-stone-300' },
};

function timeAgo(iso: string): string {
  const s = Math.max(1, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  if (s < 60) return 'just now';
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  const w = Math.floor(d / 7);
  if (w < 5) return `${w}w ago`;
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function NotificationBell() {
  const { user, loading } = useAuth();
  const [open, setOpen] = useState(false);
  const [notes, setNotes] = useState<AppNotification[]>([]);
  const [unread, setUnread] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  const fetchNotes = useCallback(async () => {
    if (!user) { setNotes([]); setUnread(0); return; }
    try {
      const r = await fetch('/api/notifications', { cache: 'no-store' });
      if (!r.ok) return;
      const j = await r.json();
      setNotes(j.notifications ?? []);
      setUnread(j.unreadCount ?? 0);
    } catch { /* network hiccup — keep stale state */ }
  }, [user]);

  // Initial fetch + 60s polling while signed in.
  useEffect(() => {
    if (!user) { setNotes([]); setUnread(0); return; }
    fetchNotes();
    const t = setInterval(fetchNotes, 60000);
    return () => clearInterval(t);
  }, [user, fetchNotes]);

  // Close on outside click / Escape.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open ]);

  const markOne = async (id: string) => {
    setNotes((ns) => ns.map((n) => (n.id === id ? { ...n, read: true } : n)));
    setUnread((u) => Math.max(0, u - 1));
    try { await fetch('/api/notifications/read', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) }); } catch { /* best effort */ }
  };

  const markAll = async () => {
    setNotes((ns) => ns.map((n) => ({ ...n, read: true })));
    setUnread(0);
    try { await fetch('/api/notifications/read', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ all: true }) }); } catch { /* best effort */ }
  };

  const toggle = () => {
    const next = !open;
    setOpen(next);
    if (next && user) fetchNotes();
  };

  return (
    <div ref={ref} className="relative">
      <button onClick={toggle} aria-label="Notifications" aria-expanded={open}
        className="relative flex h-10 w-10 items-center justify-center rounded-xl text-stone-600 transition-all hover:bg-stone-900/5 hover:text-stone-900 active:scale-90 dark:text-stone-300 dark:hover:bg-white/10 dark:hover:text-white">
        <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M10.3 21a2 2 0 0 0 3.4 0" /></svg>
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-black text-white shadow-sm">
            {unread > 99 ? '99+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-[70] mt-2 w-[22rem] max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-card dark:border-white/10 dark:bg-ink-900">
          <div className="flex items-center justify-between border-b border-stone-200/70 px-4 py-3 dark:border-white/10">
            <h2 className="font-display text-sm font-bold">Notifications</h2>
            {user && unread > 0 && (
              <button onClick={markAll} className="text-xs font-bold text-gold-700 hover:underline dark:text-gold-300">
                Mark all as read
              </button>
            )}
          </div>

          {!loading && !user ? (
            <div className="px-4 py-8 text-center">
              <p className="text-2xl" aria-hidden="true">🔔</p>
              <p className="mt-2 text-sm font-semibold text-stone-700 dark:text-stone-200">Sign in to receive notifications</p>
              <p className="mt-1 text-xs text-stone-500 dark:text-stone-400">Get alerts for new perfumes, giveaways, awards and battles.</p>
              <Link href="/login" onClick={() => setOpen(false)}
                className="mt-4 inline-block rounded-xl bg-gold-600/15 px-4 py-2 text-sm font-bold text-gold-700 transition-colors hover:bg-gold-600/25 dark:text-gold-300">
                Sign in
              </Link>
            </div>
          ) : notes.length === 0 ? (
            <div className="px-4 py-8 text-center">
              <p className="text-2xl" aria-hidden="true">✨</p>
              <p className="mt-2 text-sm text-stone-500 dark:text-stone-400">You are all caught up.</p>
            </div>
          ) : (
            <ul className="max-h-[26rem] divide-y divide-stone-200/60 overflow-y-auto dark:divide-white/5">
              {notes.map((n) => {
                const meta = TYPE_META[n.type] ?? TYPE_META.announcement;
                return (
                  <li key={n.id}>
                    <button onClick={() => { if (!n.read) markOne(n.id); }}
                      className={cn('flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-stone-900/[0.03] dark:hover:bg-white/[0.04]',
                        !n.read && 'bg-gold-500/[0.06]')}>
                      <span className="mt-0.5 text-lg" aria-hidden="true">{meta.icon}</span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-2">
                          <span className={cn('font-bold text-sm', n.read ? 'text-stone-600 dark:text-stone-300' : 'text-stone-900 dark:text-white')}>{n.title}</span>
                          {!n.read && <span className="h-2 w-2 shrink-0 rounded-full bg-red-500" aria-label="Unread" />}
                        </span>
                        <span className="mt-0.5 line-clamp-2 block text-xs text-stone-500 dark:text-stone-400">{n.message}</span>
                        <span className="mt-1.5 flex items-center gap-2">
                          <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide', meta.badge)}>{meta.label}</span>
                          <span className="text-[11px] text-stone-400">{timeAgo(n.created_at)}</span>
                          {n.link_url && (
                            <Link href={n.link_url} onClick={(e) => { e.stopPropagation(); setOpen(false); }}
                              className="ml-auto shrink-0 text-[11px] font-bold text-gold-700 hover:underline dark:text-gold-300">
                              View →
                            </Link>
                          )}
                        </span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
