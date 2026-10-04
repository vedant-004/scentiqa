// Shared admin UI primitives (server components).
import Link from 'next/link';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export function StatCard({ label, value, href, accent }: { label: string; value: string | number; href?: string; accent?: string }) {
  const inner = (
    <div className="rounded-2xl border border-stone-200/70 bg-white/70 p-5 shadow-sm transition hover:shadow-md dark:border-white/10 dark:bg-white/[0.04]">
      <p className="text-xs font-bold uppercase tracking-[0.14em] text-stone-400">{label}</p>
      <p className={cn('mt-2 font-display text-3xl font-bold tracking-tight', accent ?? 'text-stone-900 dark:text-stone-100')}>
        {typeof value === 'number' ? value.toLocaleString('en-IN') : value}
      </p>
    </div>
  );
  return href ? <Link href={href}>{inner}</Link> : inner;
}

export function SectionTitle({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="mb-4 flex items-center justify-between">
      <h2 className="font-display text-xl font-bold tracking-tight text-stone-900 dark:text-stone-100">{children}</h2>
      {action}
    </div>
  );
}

export function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-stone-400">{hint}</span>}
    </label>
  );
}

export const inputCls =
  'w-full rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm text-stone-900 shadow-sm focus:border-gold-500 focus:outline-none dark:border-white/10 dark:bg-white/[0.05] dark:text-stone-100';

export function AdminButton({ children, danger }: { children: ReactNode; danger?: boolean }) {
  return (
    <button
      type="submit"
      className={cn(
        'rounded-xl px-4 py-2 text-sm font-bold text-white shadow-sm transition',
        danger ? 'bg-red-700 hover:bg-red-800' : 'bg-gold-700 hover:bg-gold-800 dark:bg-gold-600 dark:hover:bg-gold-500',
      )}
    >
      {children}
    </button>
  );
}

export function EmptyState({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-2xl border border-dashed border-stone-300 p-8 text-center text-sm text-stone-400 dark:border-white/10">
      {children}
    </div>
  );
}
