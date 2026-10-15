// Server-safe notification type metadata. Import this from server components;
// components/notifications.tsx re-exports it for client use.
export type NotificationType = 'announcement' | 'new_perfume' | 'giveaway' | 'award' | 'battle' | 'article' | 'system';

export const TYPE_META: Record<NotificationType, { icon: string; label: string; badge: string }> = {
  announcement: { icon: '📢', label: 'Announcement', badge: 'bg-gold-500/15 text-gold-700 dark:text-gold-300' },
  new_perfume: { icon: '✨', label: 'New perfume', badge: 'bg-violet-500/15 text-violet-600 dark:text-violet-300' },
  giveaway: { icon: '🎁', label: 'Giveaway', badge: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-300' },
  award: { icon: '🏆', label: 'Award', badge: 'bg-amber-500/15 text-amber-600 dark:text-amber-300' },
  battle: { icon: '⚔', label: 'Battle', badge: 'bg-rose-500/15 text-rose-600 dark:text-rose-300' },
  article: { icon: '📰', label: 'Article', badge: 'bg-sky-500/15 text-sky-600 dark:text-sky-300' },
  system: { icon: '⚙', label: 'System', badge: 'bg-stone-500/15 text-stone-500 dark:text-stone-300' },
};
