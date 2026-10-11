'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { Giveaway } from '@/lib/types';

function useCountdown(ends: string) {
  const [left, setLeft] = useState('');
  useEffect(() => {
    const tick = () => {
      const ms = new Date(ends).getTime() - Date.now();
      if (ms <= 0) { setLeft('Ended'); return; }
      const d = Math.floor(ms / 864e5);
      const h = Math.floor((ms % 864e5) / 36e5);
      const m = Math.floor((ms % 36e5) / 6e4);
      setLeft(d > 0 ? `${d}d ${h}h left` : h > 0 ? `${h}h ${m}m left` : `${m}m left`);
    };
    tick();
    const t = setInterval(tick, 30000);
    return () => clearInterval(t);
  }, [ends]);
  return left;
}

export function GiveawayBanner({ giveaways }: { giveaways: Giveaway[] }) {
  const now = Date.now();
  const live = giveaways.filter((g) => g.active && new Date(g.ends).getTime() > now).slice(0, 1);
  if (live.length === 0) return null;
  const g = live[0];
  return <BannerInner g={g} />;
}

function BannerInner({ g }: { g: Giveaway }) {
  const left = useCountdown(g.ends);
  return (
    <section className="relative overflow-hidden" aria-label="Live giveaway">
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="absolute inset-0 bg-gradient-to-r from-amber-500/15 via-gold-500/10 to-amber-500/15 dark:from-gold-600/20 dark:via-gold-500/10 dark:to-gold-600/20" />
        <div className="absolute -left-10 top-0 h-40 w-40 rounded-full bg-gold-400/30 blur-3xl animate-glow-pulse" />
        <div className="absolute -right-10 bottom-0 h-40 w-40 rounded-full bg-amber-400/30 blur-3xl animate-glow-pulse" />
      </div>
      <div className="relative mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div className="flex flex-col items-center gap-4 rounded-3xl border border-gold-500/30 bg-white/70 p-6 text-center shadow-lift backdrop-blur-xl sm:flex-row sm:text-left dark:border-gold-500/25 dark:bg-ink-900/70">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-gold-400 to-gold-600 text-3xl shadow-glow animate-float" aria-hidden="true">
            🎁
          </div>
          <div className="min-w-0 flex-1">
            <p className="inline-flex items-center gap-2 rounded-full bg-emerald-500/15 px-3 py-1 text-[11px] font-black uppercase tracking-[0.14em] text-emerald-700 dark:text-emerald-300">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-glow-pulse" />
              Giveaway live · {left}
            </p>
            <h2 className="mt-2 font-display text-2xl font-bold tracking-tight text-stone-900 dark:text-white">
              {g.title}
            </h2>
            {g.prize && (
              <p className="mt-1 text-sm font-semibold text-gold-700 dark:text-gold-300">Win: {g.prize}</p>
            )}
            {g.desc && (
              <p className="mt-1 line-clamp-2 text-sm text-stone-500 dark:text-stone-400">{g.desc}</p>
            )}
          </div>
          <div className="flex shrink-0 flex-col items-center gap-2">
            <Link
              href="/giveaways"
              className="rounded-2xl bg-gradient-to-r from-gold-500 to-gold-600 px-8 py-3.5 text-base font-black text-white shadow-glow transition-all hover:scale-105 hover:shadow-lift active:scale-95"
            >
              Enter now
            </Link>
            <p className="text-xs font-medium text-stone-400">Sign in required to participate</p>
          </div>
        </div>
      </div>
    </section>
  );
}
