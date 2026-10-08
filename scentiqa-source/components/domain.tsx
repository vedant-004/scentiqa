// Scentiqa signature components — ScoreBadge, meters, cards, tables.
'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { accordColor, cn, HOUSE_TYPE_LABEL, inr, scoreClasses, scoreTone } from '@/lib/utils';
import { isSupabaseConfigured } from '@/lib/supabase';
import { Badge, Button, Card } from './ui';
import { noteSlug } from '@/lib/note-slugs';
import type { Accord, DupeEntry, House, PriceEntry } from '@/lib/types';

const accordSlug = (name: string) => name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

/* ---------- ScoreBadge: counts up when scrolled into view ---------- */
export function ScoreBadge({ score, size = 'md', label }: { score: number | null; size?: 'sm' | 'md' | 'lg'; label?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [val, setVal] = useState(0);
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || score === null) return;
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setSeen(true); io.disconnect(); } }, { threshold: 0.4 });
    io.observe(el);
    return () => io.disconnect();
  }, [score]);
  useEffect(() => {
    if (!seen || score === null) return;
    const t0 = performance.now(); const dur = 900;
    let raf = 0;
    const tick = (t: number) => {
      const p = Math.min(1, (t - t0) / dur);
      setVal(Math.round(score * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [seen, score]);
  const dims = { sm: 'h-11 w-11 text-sm', md: 'h-16 w-16 text-xl', lg: 'h-24 w-24 text-3xl' }[size];
  if (score === null) {
    return (
      <div className="flex flex-col items-center gap-1">
        <div ref={ref} className={cn('flex items-center justify-center rounded-full border-2 border-dashed border-stone-300 text-stone-400 dark:border-ink-700', dims)}>
          <span className="text-lg">?</span>
        </div>
        {label && <span className="text-[10px] font-semibold uppercase tracking-wider text-stone-400">{label}</span>}
      </div>
    );
  }
  return (
    <div className="flex flex-col items-center gap-1">
      <div ref={ref} className={cn('flex items-center justify-center rounded-full font-display font-bold text-white shadow-card', dims, scoreClasses(scoreTone(score)))}>
        {val}
      </div>
      {label && <span className="text-[10px] font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-400">{label}</span>}
    </div>
  );
}

/* ---------- StarRating ---------- */
export function StarRating({ value, count, size = 16 }: { value: number; count?: number; size?: number }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="inline-flex" aria-label={`${value.toFixed(1)} out of 5 stars`}>
        {[1, 2, 3, 4, 5].map((i) => {
          const fill = Math.max(0, Math.min(1, value - (i - 1)));
          return (
            <svg key={i} width={size} height={size} viewBox="0 0 24 24" className="shrink-0">
              <defs><linearGradient id={`sg-${i}-${size}`}><stop offset={`${fill * 100}%`} stopColor="#d97706" /><stop offset={`${fill * 100}%`} stopColor="#d6d3d1" /></linearGradient></defs>
              <path d="M12 2.5l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.4 6.1 20.5l1.2-6.5L2.5 9.4l6.6-.9z" fill={`url(#sg-${i}-${size})`} />
            </svg>
          );
        })}
      </span>
      {count !== undefined && <span className="text-sm font-medium text-stone-500 dark:text-stone-400">{value.toFixed(1)} · {count.toLocaleString('en-IN')}</span>}
    </span>
  );
}
export function StarInput({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="inline-flex gap-1" role="radiogroup" aria-label="Your rating">
      {[1, 2, 3, 4, 5].map((i) => (
        <button key={i} type="button" role="radio" aria-checked={value === i} aria-label={`${i} star${i > 1 ? 's' : ''}`}
          onClick={() => onChange(i)} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(0)}
          className="transition-transform duration-150 hover:scale-125 active:scale-95">
          <svg width="30" height="30" viewBox="0 0 24 24">
            <path d="M12 2.5l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.4 6.1 20.5l1.2-6.5L2.5 9.4l6.6-.9z"
              fill={(hover || value) >= i ? '#d97706' : 'transparent'} stroke="#d97706" strokeWidth="1.5" />
          </svg>
        </button>
      ))}
    </div>
  );
}

/* ---------- MeterBar (1–5) ---------- */
const METER_LABELS = ['Very weak', 'Weak', 'Moderate', 'Strong', 'Beast mode'];
export function MeterBar({ label, value, hint }: { label: string; value: number; hint?: string }) {
  return (
    <div title={hint}>
      <div className="mb-1.5 flex items-baseline justify-between gap-2">
        <span className="text-sm font-medium text-stone-700 dark:text-stone-300">{label}</span>
        <span className="text-xs font-semibold text-gold-700 dark:text-gold-300">{METER_LABELS[value - 1] ?? ''}</span>
      </div>
      <div className="flex gap-1.5" role="img" aria-label={`${label}: ${value} out of 5`}>
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className={cn('h-2 flex-1 rounded-full transition-all duration-500', i <= value ? 'bg-gradient-to-r from-gold-500 to-gold-400' : 'bg-stone-200 dark:bg-ink-700')} />
        ))}
      </div>
    </div>
  );
}

/* ---------- AccordStack — honest ranked accord list ----------
 * Order is the verified prominence order (most prominent first).
 * We never render invented strength numbers or proportional bars. */
export function AccordStack({ accords }: { accords: Accord[] }) {
  const list = accords.filter((a) => a && a.name).slice(0, 10);
  if (list.length === 0) {
    return <p className="py-6 text-center text-sm text-stone-500 dark:text-stone-400">No accord data yet — be the first to suggest accords for this perfume.</p>;
  }
  return (
    <div>
      <ol className="flex flex-col gap-2" aria-label={`Main accords in prominence order: ${list.map((a) => a.name).join(', ')}`}>
        {list.map((a, i) => (
          <li key={`${a.name}-${i}`}>
            <Link
              href="/search/accords"
              title={`${a.name} — search perfumes with this accord`}
              className="group flex items-center gap-3 rounded-xl border border-stone-200/70 bg-white/60 px-3 py-2 transition hover:-translate-y-px hover:border-gold-400/60 hover:shadow-card dark:border-white/10 dark:bg-white/[0.03]"
            >
              <span
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[13px] font-black text-white shadow-sm transition-transform group-hover:scale-110"
                style={{ background: accordColor(a.name) }}
                aria-hidden="true"
              >
                {i + 1}
              </span>
              <span className="text-sm font-semibold capitalize text-stone-800 dark:text-stone-100">{a.name}</span>
              {i === 0 && (
                <span className="ml-auto shrink-0 rounded-full bg-gold-500/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-gold-700 dark:text-gold-300">
                  Most prominent
                </span>
              )}
            </Link>
          </li>
        ))}
      </ol>
      <p className="mt-3 text-xs text-stone-500 dark:text-stone-400">Ranked by prominence — strongest first, weakest last.</p>
      <div className="mt-4 text-center sm:text-left">
        <Link href="/search/accords" className="inline-flex items-center gap-1.5 rounded-xl bg-gold-600/15 px-4 py-2 text-sm font-bold text-gold-700 transition-colors hover:bg-gold-600/25 dark:text-gold-300">
          Search by accords
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><path d="M5 12h14m-6-6 6 6-6 6" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </Link>
      </div>
    </div>
  );
}

/* ---------- AccordBars — compact honest ranked list (compare view) ---------- */
export function AccordBars({ accords, compact = false }: { accords: Accord[]; compact?: boolean }) {
  const list = accords.filter((a) => a && a.name).slice(0, compact ? 4 : 8);
  return (
    <div className={cn('flex flex-col', compact ? 'gap-1.5' : 'gap-2.5')}>
      {list.map((a, i) => (
        <div key={`${a.name}-${i}`} className="flex items-center gap-2.5">
          <span
            className={cn('flex shrink-0 items-center justify-center rounded-full font-black text-white', compact ? 'h-5 w-5 text-[10px]' : 'h-6 w-6 text-xs')}
            style={{ background: accordColor(a.name) }}
            aria-hidden="true"
          >
            {i + 1}
          </span>
          <Link href={`/accords/${accordSlug(a.name)}`} className="truncate font-medium capitalize text-stone-600 transition hover:text-gold-700 dark:text-stone-300 dark:hover:text-gold-300">
            <span className={cn(compact ? 'text-xs' : 'text-sm')}>{a.name}</span>
          </Link>
        </div>
      ))}
    </div>
  );
}

/* ---------- NotePyramid ---------- */
export function NotePyramid({ top, heart, base }: { top: string[]; heart: string[]; base: string[] }) {
  const [tab, setTab] = useState<'top' | 'heart' | 'base'>('top');
  const rows = { top, heart, base };
  const labels = { top: 'Top notes', heart: 'Heart notes', base: 'Base notes' };
  return (
    <div>
      <div className="mb-3 inline-flex rounded-xl bg-stone-900/5 p-1 dark:bg-white/10">
        {(Object.keys(rows) as Array<keyof typeof rows>).map((k) => (
          <button key={k} onClick={() => setTab(k)}
            className={cn('rounded-lg px-3.5 py-1.5 text-[13px] font-semibold transition-all duration-200',
              tab === k ? 'bg-white text-stone-900 shadow-card dark:bg-ink-800 dark:text-white' : 'text-stone-500 hover:text-stone-800 dark:text-stone-400')}>
            {labels[k]}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap gap-2" key={tab}>
        {rows[tab].map((n, i) => {
          const slug = noteSlug(n);
          const cls = 'animate-[fade-up_0.3s_ease] rounded-full border border-stone-200 bg-cream-100 px-3.5 py-1.5 text-sm font-medium text-stone-700 transition hover:border-gold-400 hover:text-gold-700 dark:border-ink-700 dark:bg-ink-800 dark:text-stone-200 dark:hover:text-gold-300';
          return slug ? (
            <Link key={n} href={`/notes/${slug}`} className={cls} style={{ animationDelay: `${i * 0.04}s` }}>{n}</Link>
          ) : (
            <span key={n} className={cls} style={{ animationDelay: `${i * 0.04}s` }}>{n}</span>
          );
        })}
      </div>
    </div>
  );
}

/* ---------- BottleVisual: premium CSS bottle with brand-specific styling ---------- */
const BRAND_STYLES: Record<string, { bottle: string; liquid: string; cap: string; accent: string; label: string }> = {
  'chanel': { bottle: 'from-slate-100/95 via-slate-200/80 to-slate-300/70', liquid: 'from-amber-100/40 to-amber-200/30', cap: 'from-stone-800 to-stone-900', accent: 'bg-stone-900', label: 'text-stone-900' },
  'dior': { bottle: 'from-slate-200/90 via-blue-100/70 to-slate-300/60', liquid: 'from-blue-200/50 to-slate-300/40', cap: 'from-slate-300 to-slate-400', accent: 'bg-slate-700', label: 'text-slate-800' },
  'versace': { bottle: 'from-amber-100/95 via-yellow-200/80 to-amber-300/70', liquid: 'from-yellow-300/60 to-amber-400/50', cap: 'from-yellow-600 to-yellow-700', accent: 'bg-yellow-700', label: 'text-yellow-900' },
  'armani': { bottle: 'from-stone-200/90 via-stone-300/70 to-stone-400/60', liquid: 'from-stone-300/40 to-stone-400/30', cap: 'from-stone-700 to-stone-800', accent: 'bg-stone-800', label: 'text-stone-800' },
  'gucci': { bottle: 'from-emerald-100/90 via-green-200/70 to-emerald-300/60', liquid: 'from-green-200/50 to-emerald-300/40', cap: 'from-amber-700 to-amber-800', accent: 'bg-emerald-800', label: 'text-emerald-900' },
  'tom ford': { bottle: 'from-stone-800/95 via-stone-900/90 to-black/90', liquid: 'from-amber-900/60 to-stone-900/50', cap: 'from-stone-900 to-black', accent: 'bg-amber-600', label: 'text-amber-100' },
  'creed': { bottle: 'from-slate-100/95 via-white/90 to-slate-200/80', liquid: 'from-yellow-100/50 to-amber-200/40', cap: 'from-slate-400 to-slate-500', accent: 'bg-slate-800', label: 'text-slate-900' },
  'yves saint laurent': { bottle: 'from-blue-900/95 via-indigo-900/90 to-slate-900/90', liquid: 'from-blue-800/60 to-indigo-900/50', cap: 'from-slate-700 to-slate-800', accent: 'bg-blue-600', label: 'text-blue-100' },
  'paco rabanne': { bottle: 'from-yellow-200/95 via-amber-300/90 to-yellow-400/80', liquid: 'from-amber-300/70 to-yellow-500/60', cap: 'from-yellow-500 to-yellow-600', accent: 'bg-yellow-600', label: 'text-yellow-900' },
  'hugo boss': { bottle: 'from-slate-300/90 via-slate-400/80 to-slate-500/70', liquid: 'from-slate-400/50 to-slate-500/40', cap: 'from-slate-600 to-slate-700', accent: 'bg-slate-700', label: 'text-slate-800' },
  'calvin klein': { bottle: 'from-slate-100/90 via-white/80 to-slate-200/70', liquid: 'from-slate-200/40 to-white/30', cap: 'from-slate-300 to-slate-400', accent: 'bg-slate-500', label: 'text-slate-700' },
  'dolce': { bottle: 'from-rose-100/95 via-pink-200/80 to-rose-300/70', liquid: 'from-pink-200/60 to-rose-300/50', cap: 'from-rose-400 to-rose-500', accent: 'bg-rose-600', label: 'text-rose-900' },
  'default': { bottle: 'from-amber-100/90 via-amber-200/70 to-amber-300/60', liquid: 'from-amber-200/50 to-amber-300/40', cap: 'from-stone-400 to-stone-500', accent: 'bg-amber-700', label: 'text-amber-900' },
};

function getBrandStyle(house: string) {
  const h = house.toLowerCase();
  for (const [key, style] of Object.entries(BRAND_STYLES)) {
    if (key !== 'default' && h.includes(key)) return style;
  }
  return BRAND_STYLES['default'];
}

export function BottleVisual({ name, house, size = 'md' }: { name: string; house: string; size?: 'sm' | 'md' | 'lg' }) {
  const dims = { sm: 'h-36 w-28', md: 'h-64 w-48', lg: 'h-80 w-60' }[size];
  const style = getBrandStyle(house);
  const initials = name.split(/\s+/).slice(0, 2).map((w) => w[0]).join('').toUpperCase();
  const displayName = name.length > 20 ? name.substring(0, 20) + '...' : name;

  return (
    <div className={cn('relative flex items-center justify-center overflow-hidden rounded-2xl', dims)} aria-hidden="true">
      {/* Premium backdrop with radial glow */}
      <div className="absolute inset-0 bg-gradient-to-br from-stone-100 via-stone-200 to-stone-300 dark:from-stone-900 dark:via-stone-800 dark:to-black" />
      <div className={cn('absolute inset-x-8 bottom-4 top-8 rounded-full blur-3xl opacity-40', style.accent)} />

      {/* Bottle */}
      <div className="relative flex h-[85%] w-[62%] flex-col items-center">
        {/* Cap */}
        <div className={cn('h-[14%] w-[32%] rounded-t-xl bg-gradient-to-b shadow-lg', style.cap)}>
          <div className="h-full w-full rounded-t-xl bg-gradient-to-r from-transparent via-white/30 to-transparent" />
        </div>
        {/* Neck */}
        <div className="h-[5%] w-[20%] bg-gradient-to-b from-stone-300/90 to-stone-400/70 dark:from-stone-600 dark:to-stone-700" />

        {/* Bottle body with liquid */}
        <div className={cn('relative flex w-full flex-1 flex-col items-center justify-center overflow-hidden rounded-[18px] border border-white/50 bg-gradient-to-br shadow-2xl backdrop-blur-sm', style.bottle)}>
          {/* Liquid fill */}
          <div className={cn('absolute inset-x-0 bottom-0 top-[35%] bg-gradient-to-t opacity-80', style.liquid)} />

          {/* Glass reflections */}
          <div className="absolute inset-y-2 left-2 w-3 rounded-full bg-white/60 blur-[4px] dark:bg-white/20" />
          <div className="absolute inset-y-4 right-3 w-1.5 rounded-full bg-white/40 blur-[3px] dark:bg-white/10" />

          {/* Label */}
          <div className="relative z-10 flex flex-col items-center px-3">
            <div className={cn('mb-1 h-0.5 w-8 rounded-full', style.accent)} />
            <span className={cn('font-display text-2xl font-bold tracking-tight', style.label)}>{initials}</span>
            <span className={cn('mt-1 max-w-full truncate text-center text-[9px] font-bold uppercase tracking-[0.2em]', style.label)}>{house}</span>
            <span className={cn('mt-0.5 max-w-full truncate text-center text-[8px] font-medium uppercase tracking-[0.15em] opacity-70', style.label)}>{displayName}</span>
            <div className={cn('mt-1 h-0.5 w-8 rounded-full', style.accent)} />
          </div>
        </div>

        {/* Shadow */}
        <div className="mt-1 h-[3%] w-[95%] rounded-full bg-black/25 blur-md dark:bg-black/60" />
      </div>

      {/* Subtle vignette */}
      <div className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-inset ring-black/10 dark:ring-white/10" />
    </div>
  );
}

/* ---------- ProductImage: real product photo with CSS bottle fallback ---------- */
export function ProductImage({ name, house, image, size = 'md' }: { name: string; house: string; image?: string | null; size?: 'sm' | 'md' | 'lg' }) {
  const dims = { sm: 'h-36 w-28', md: 'h-64 w-48', lg: 'h-80 w-60' }[size];
  if (image) {
    return (
      <div className={cn('relative flex items-center justify-center overflow-hidden rounded-2xl', dims)}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={image} alt={`${name} by ${house}`} loading="lazy"
          className="h-full w-full object-contain drop-shadow-xl" />
      </div>
    );
  }
  return <BottleVisual name={name} house={house} size={size} />;
}

/* ---------- PerfumeCard ---------- */
export interface CardPerfume {
  slug: string; name: string; house: string; ratingAvg: number;
  lowestPriceInr: number | null; isDupe: boolean; bottleImage?: string | null;
}
export function PerfumeCard({ perfume, rank }: { perfume: CardPerfume; rank?: number }) {
  const best = perfume.lowestPriceInr;
  return (
    <Link href={`/perfume/${perfume.slug}`} className="group block h-full">
      <Card hover className="flex h-full flex-col overflow-hidden p-0">
        <div className="relative flex h-44 items-center justify-center overflow-hidden bg-gradient-to-br from-cream-100 via-cream-50 to-gold-300/20 dark:from-ink-800 dark:via-ink-900 dark:to-gold-700/10">
          {rank !== undefined && (
            <span className="absolute left-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-stone-900/85 font-display text-sm font-bold text-white backdrop-blur dark:bg-white/90 dark:text-stone-900">{rank}</span>
          )}
          <div className="transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-2">
            <ProductImage name={perfume.name} house={perfume.house} image={perfume.bottleImage} size="sm" />
          </div>
          {perfume.isDupe && <Badge className="absolute right-3 top-3 bg-gold-600/95 text-white">Dupe</Badge>}
        </div>
        <div className="flex flex-1 flex-col p-4">
          <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-gold-600 dark:text-gold-400">{perfume.house}</p>
          <h3 className="mt-1 font-display text-[17px] font-semibold leading-snug tracking-tight group-hover:text-gold-700 dark:group-hover:text-gold-300">{perfume.name}</h3>
          <div className="mt-2"><StarRating value={perfume.ratingAvg} size={13} /></div>
          <div className="mt-auto flex items-center justify-between pt-3">
            <span className="text-[15px] font-bold text-stone-900 dark:text-white">{best ? `₹${best.toLocaleString('en-IN')}` : '—'}</span>
            <span className="text-xs font-semibold text-stone-400">View →</span>
          </div>
        </div>
      </Card>
    </Link>
  );
}

/* ---------- HouseCard ---------- */
export function HouseCard({ house }: { house: House }) {
  return (
    <Link href={`/house/${house.slug}`} className="group block h-full">
      <Card hover className="flex h-full items-center gap-4 p-5">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-gold-500 to-gold-700 font-display text-xl font-bold text-white shadow-card">
          {house.name.split(/\s+/).slice(0, 2).map((w) => w[0]).join('')}
        </div>
        <div className="min-w-0">
          <h3 className="truncate font-display text-lg font-semibold tracking-tight group-hover:text-gold-700 dark:group-hover:text-gold-300">{house.name}</h3>
          <p className="mt-0.5 flex items-center gap-2 text-[13px] text-stone-500 dark:text-stone-400">
            <span className="font-semibold text-gold-600 dark:text-gold-400">{HOUSE_TYPE_LABEL[house.type]}</span>
            <span>·</span><span>{house.country}</span>
            {house.perfumeCount > 0 && <><span>·</span><span>{house.perfumeCount} fragrances</span></>}
            {house.avgSimilarity ? <><span>·</span><span className="font-semibold text-emerald-600 dark:text-emerald-400">{house.avgSimilarity}% avg</span></> : null}
          </p>
        </div>
      </Card>
    </Link>
  );
}

/* ---------- DupeCard ---------- */
function BrandClaimNote({ text }: { text: string }) {
  const urlMatch = text.match(/https?:\/\/\S+/);
  let body = urlMatch ? text.slice(0, urlMatch.index).replace(/\s*Source:\s*$/, '') : text;
  // Strip a leading "Brand('s) stated inspiration:" if present in DB text to avoid duplication with the label below
  body = body.replace(/^Brand'?s?[-\s]stated inspiration:\s*/i, '').trim();
  return (
    <p className="mt-2 text-xs leading-relaxed text-stone-500 dark:text-stone-400">
      <span className="font-semibold text-stone-600 dark:text-stone-300">Brand's stated inspiration:</span> {body}
      {urlMatch ? (
        <> <a href={urlMatch[0]} target="_blank" rel="nofollow noopener" className="font-semibold text-gold-700 hover:underline dark:text-gold-300">source →</a></>
      ) : null}
    </p>
  );
}
export function DupeCard({ entry, originalName }: { entry: DupeEntry; originalName: string }) {
  const { dupe, dupeHouse, similarityScore, testedBy, claimedAccuracy, verdict, lowestPrice } = entry;
  const lab = testedBy === 'lab' && similarityScore !== null;
  const demo = !isSupabaseConfigured();
  return (
    <Card hover className="flex flex-col p-5 sm:flex-row sm:gap-5">
      <div className="flex items-start gap-4 sm:w-40 sm:shrink-0 sm:flex-col sm:items-center">
        <ScoreBadge score={similarityScore} size="md" label={lab ? (demo ? 'Lab match · sample' : 'Lab match') : 'Untested'} />
        {!lab && <p className="text-[11px] leading-snug text-stone-400 sm:text-center">Community suggested —<br />lab test pending</p>}
      </div>
      <div className="mt-4 min-w-0 flex-1 sm:mt-0">
        <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-gold-600 dark:text-gold-400">{dupeHouse.name}</p>
        <Link href={`/perfume/${dupe.slug}`} className="font-display text-xl font-semibold tracking-tight hover:text-gold-700 dark:hover:text-gold-300">{dupe.name}</Link>
        <p className="mt-0.5 text-xs text-stone-400">Alternative to {originalName}</p>
        <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-stone-600 dark:text-stone-300">{verdict}</p>
        {claimedAccuracy && lab && (
          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
            <span className="rounded-full bg-stone-900/5 px-2.5 py-1 font-medium text-stone-500 dark:bg-white/10 dark:text-stone-300">House claims {claimedAccuracy}</span>
            <span className={cn('rounded-full px-2.5 py-1 font-bold text-white', scoreClasses(scoreTone(similarityScore)))}>Scentiqa lab{demo ? ' (sample)' : ''}: {similarityScore}%</span>
          </div>
        )}
        {claimedAccuracy && !lab && <BrandClaimNote text={claimedAccuracy} />}
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <span className="text-lg font-bold">{lowestPrice ? inr(lowestPrice.priceInr) : '—'}</span>
          {lowestPrice && <span className="text-xs text-stone-400">at {lowestPrice.seller?.name}</span>}
          <span className="mx-1 hidden h-4 w-px bg-stone-200 dark:bg-ink-700 sm:block" />
          <Link href={`/compare?ids=${entry.originalSlug},${dupe.slug}`}><Button size="sm" variant="outline">Compare</Button></Link>
          <Link href={`/perfume/${dupe.slug}`}><Button size="sm" variant="ghost">Details →</Button></Link>
        </div>
      </div>
    </Card>
  );
}

/* ---------- PriceTable ---------- */
const fmtDate = (d?: string | null) => d ? new Date(d + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '30 Sep 2026';
const priceProvNote = (prov: string, checkedAt?: string | null): string => {
  const dt = fmtDate(checkedAt);
  switch (prov) {
    case 'live': return `Seen live on the official store · ${dt}`;
    case 'mixed': return `Partly from cached copies (${dt}) — re-verify before buying`;
    case 'indexed': return `From a search-indexed copy (${dt}) — re-verify before buying`;
    case 'stale': return `From an older listing (${dt}) — re-verify before buying`;
    default: return '';
  }
};
export function PriceTable({ prices }: { prices: PriceEntry[] }) {
  if (!prices.length) return <p className="text-sm text-stone-500">No prices listed yet.</p>;
  return (
    <div className="overflow-hidden rounded-2xl border border-stone-200/80 dark:border-ink-700/60">
      {prices.map((pr, i) => (
        <div key={pr.id} className={cn('flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-cream-100/60 dark:hover:bg-white/5', i !== 0 && 'border-t border-stone-200/70 dark:border-ink-700/50')}>
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-stone-900/5 font-display text-sm font-bold text-stone-600 dark:bg-white/10 dark:text-stone-300">
            {(pr.seller?.name ?? '₹')[0]}
          </div>
          <div className="min-w-0 flex-1">
            <p className="flex items-center gap-1.5 truncate text-sm font-semibold">
              {pr.seller?.name ?? 'Seller'}
              {pr.seller?.verified ? (
                <svg width="14" height="14" viewBox="0 0 24 24" className="shrink-0 text-emerald-500" fill="currentColor"><path d="M12 2l2.4 2.4 3.4-.5.9 3.3 3 1.7-1.5 3.1 1.5 3.1-3 1.7-.9 3.3-3.4-.5L12 22l-2.4-2.4-3.4.5-.9-3.3-3-1.7L3.8 12 2.3 8.9l3-1.7.9-3.3 3.4.5z" /><path d="M10.6 14.6l-2.1-2.1 1.1-1.1 1 1 3.7-3.7 1.1 1.1z" fill="#fff" /></svg>
              ) : pr.seller?.type === 'official' ? (
                <span className="shrink-0 rounded-full bg-stone-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-stone-500 dark:text-stone-400">Official store · unverified</span>
              ) : null}
            </p>
            <p className="text-xs text-stone-400">{pr.sizeMl ? `${pr.sizeMl}ml` : 'Size not confirmed'}{pr.inStock ? ' · In stock' : ' · Out of stock'}</p>
            {pr.provenance !== 'demo' && priceProvNote(pr.provenance, pr.checkedAt) && (
              <p className="text-[11px] text-amber-600/90 dark:text-amber-400/80">{priceProvNote(pr.provenance, pr.checkedAt)}</p>
            )}
          </div>
          <div className="text-right">
            <p className="text-[15px] font-bold">{inr(pr.priceInr)}</p>
            {pr.mrpInr && pr.priceInr && pr.mrpInr > pr.priceInr && <p className="text-xs text-stone-400 line-through">{inr(pr.mrpInr)}</p>}
          </div>
          {pr.url ? (
            <a href={pr.url} target="_blank" rel="noopener noreferrer"
              className="inline-flex h-8 items-center justify-center gap-2 rounded-lg bg-gold-600 px-3 text-[13px] font-semibold tracking-tight text-white shadow-sm transition-all duration-200 select-none hover:bg-gold-700 hover:shadow-lift active:scale-[0.98] dark:bg-gold-500 dark:text-ink-950 dark:hover:bg-gold-400">
              {pr.inStock ? 'Buy' : 'View'}
            </a>
          ) : (
            <Button size="sm" disabled={!pr.inStock}>{pr.inStock ? 'Buy' : 'Notify me'}</Button>
          )}
        </div>
      ))}
      <p className="border-t border-stone-200/70 bg-cream-100/50 px-4 py-2.5 text-[11px] text-stone-400 dark:border-ink-700/50 dark:bg-white/[0.02]">
        Prices marked with a source note were recorded during research (Sep–Oct 2026). Cached or older prices are flagged — always re-verify on the seller&rsquo;s site before buying. Scentiqa has not independently vetted unverified sellers.
      </p>
    </div>
  );
}

/* ---------- Breadcrumbs ---------- */
export function Breadcrumbs({ items }: { items: Array<{ label: string; href?: string }> }) {
  return (
    <nav aria-label="Breadcrumb" className="mb-5 flex flex-wrap items-center gap-1.5 text-[13px] text-stone-500 dark:text-stone-400">
      {items.map((it, i) => (
        <span key={i} className="flex items-center gap-1.5">
          {i > 0 && <span className="text-stone-300 dark:text-stone-600">/</span>}
          {it.href ? <Link href={it.href} className="font-medium hover:text-gold-700 dark:hover:text-gold-300">{it.label}</Link> : <span className="font-semibold text-stone-800 dark:text-stone-200">{it.label}</span>}
        </span>
      ))}
    </nav>
  );
}

/* ---------- ShareButtons (WhatsApp-first) ---------- */
export function ShareButtons({ title, path }: { title: string; path: string }) {
  const [copied, setCopied] = useState(false);
  const share = async () => {
    const url = typeof window !== 'undefined' ? window.location.origin + path : path;
    if (navigator.share) { try { await navigator.share({ title, url }); } catch { /* dismissed */ } }
    else { await navigator.clipboard.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 2000); }
  };
  const url = typeof window !== 'undefined' ? encodeURIComponent(window.location.origin + path) : '';
  const text = encodeURIComponent(title);
  return (
    <div className="flex items-center gap-2">
      <a href={`https://wa.me/?text=${text}%20${url}`} target="_blank" rel="noopener" aria-label="Share on WhatsApp"
        className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#25D366]/15 text-[#128C4B] transition-all hover:scale-105 hover:bg-[#25D366]/25 dark:text-[#4ce080]">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm5.4 14.1c-.2.7-1.3 1.3-1.9 1.4-.5.1-1.1.2-3.6-.8-3-1.2-4.9-4.2-5.1-4.4-.1-.2-1.2-1.6-1.2-3.1s.8-2.2 1-2.5c.3-.3.6-.4.8-.4h.6c.2 0 .4 0 .6.5l.9 2.1c.1.2.1.4 0 .6l-.4.6-.5.5c-.2.2-.3.4-.1.7.2.3.9 1.5 2 2.4 1.4 1.2 2.5 1.6 2.9 1.8.3.2.5.2.7-.1l1-1.2c.2-.3.4-.2.7-.1l2 1c.3.1.5.2.6.4 0 .1 0 .7-.2 1.6z" /></svg>
      </a>
      <a href={`https://x.com/intent/tweet?text=${text}&url=${url}`} target="_blank" rel="noopener" aria-label="Share on X"
        className="flex h-10 w-10 items-center justify-center rounded-xl bg-stone-900/10 text-stone-800 transition-all hover:scale-105 hover:bg-stone-900/20 dark:bg-white/10 dark:text-stone-100 dark:hover:bg-white/20">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M18.9 2H22l-6.8 7.8L23.3 22h-6.3l-4.9-6.4L6.5 22H3.4l7.3-8.3L1.5 2h6.4l4.4 5.9L18.9 2zm-1.1 17.8h1.7L7.1 3.9H5.3l12.5 15.9z" /></svg>
      </a>
      <a href={`https://t.me/share/url?url=${url}&text=${text}`} target="_blank" rel="noopener" aria-label="Share on Telegram"
        className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500/15 text-sky-600 transition-all hover:scale-105 hover:bg-sky-500/25 dark:text-sky-400">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M21.9 4.6L2.7 12.1c-.8.3-.8 1.4.1 1.6l4.7 1.5 1.8 5.6c.3.8 1.3.9 1.8.2l2.6-3.1 4.9 3.6c.6.5 1.6.1 1.8-.7l2.5-14.1c.2-1-.8-1.7-1-1.1zM8.5 13.1l9.7-6.6c.2-.2.5.1.3.3l-8 7.3-.3 3-1.7-3.9z" /></svg>
      </a>
      <button onClick={share} className="flex h-10 items-center gap-2 rounded-xl bg-stone-900/5 px-4 text-sm font-semibold text-stone-700 transition-all hover:scale-[1.03] hover:bg-stone-900/10 dark:bg-white/10 dark:text-stone-200 dark:hover:bg-white/15">
        {copied ? '✓ Copied!' : 'Share'}
      </button>
    </div>
  );
}

/* ---------- NewsletterSignup ---------- */
export function NewsletterSignup({ source, compact = false }: { source: 'footer' | 'homepage'; compact?: boolean }) {
  const [email, setEmail] = useState('');
  const [state, setState] = useState<'idle' | 'sending' | 'done' | 'error'>('idle');
  const [msg, setMsg] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (state === 'sending' || state === 'done') return;
    setState('sending'); setMsg('');
    try {
      const r = await fetch('/api/newsletter', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, source }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error ?? 'Something went wrong');
      setState('done');
      setMsg(j.already ? 'You are already on the list.' : 'You are on the list. Welcome aboard.');
    } catch (err) {
      setState('error');
      setMsg(err instanceof Error ? err.message : 'Something went wrong');
    }
  };

  return (
    <div className={compact ? '' : 'relative overflow-hidden rounded-3xl border border-gold-600/25 bg-gradient-to-br from-gold-600/10 via-transparent to-transparent p-6 sm:p-10'}>
      {!compact && <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-gold-500/15 blur-3xl" aria-hidden="true" />}
      <div className={compact ? '' : 'relative mx-auto max-w-xl text-center'}>
        {!compact && <p className="text-2xl">💌</p>}
        <h3 className={`font-display font-bold tracking-tight ${compact ? 'text-lg' : 'mt-2 text-2xl sm:text-3xl'}`}>
          {compact ? 'Get the weekly scent drop' : 'The Sunday Scent Drop'}
        </h3>
        <p className={`text-stone-500 dark:text-stone-400 ${compact ? 'mt-1 text-sm' : 'mx-auto mt-3 max-w-md text-[15px] leading-relaxed'}`}>
          {compact
            ? 'One email a week: new dupes, price drops, awards. No spam, unsubscribe anytime.'
            : 'One email every Sunday — the best new dupes, price drops and community finds. No spam, unsubscribe anytime.'}
        </p>
        {state === 'done' ? (
          <p className="mt-4 inline-flex items-center gap-2 rounded-full bg-emerald-500/15 px-4 py-2 text-sm font-bold text-emerald-700 dark:text-emerald-300">
            ✓ {msg}
          </p>
        ) : (
          <form onSubmit={submit} className={`flex gap-2 ${compact ? 'mt-3' : 'mx-auto mt-6 max-w-md'}`}>
            <input
              type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com" disabled={state === 'sending'}
              className="min-w-0 flex-1 rounded-xl border border-stone-300/80 bg-white/90 px-4 py-2.5 text-[15px] outline-none focus:border-gold-600 disabled:opacity-60 dark:border-ink-700 dark:bg-ink-800/80"
            />
            <Button type="submit" disabled={state === 'sending'} size={compact ? 'sm' : undefined}>
              {state === 'sending' ? 'Joining…' : 'Join free'}
            </Button>
          </form>
        )}
        {state === 'error' && <p className="mt-2 text-sm font-semibold text-red-600 dark:text-red-400">{msg}</p>}
        {state !== 'done' && (
          <p className="mt-2 text-[11px] text-stone-400">We only send the newsletter. Your email stays with us.</p>
        )}
      </div>
    </div>
  );
}

/* ---------- ReviewPrompt ---------- */
// Gentle nudge to review a perfume, shown at most once per 24h site-wide
// (localStorage timestamp). Never auto-creates anything.
const REVIEW_PROMPT_KEY = 'scentiqa-review-prompt';
const REVIEW_PROMPT_COOLDOWN_MS = 24 * 3600 * 1000;

export function ReviewPrompt({ context, perfumeName, perfumeSlug }: {
  context: 'quiz' | 'diary';
  perfumeName: string;
  perfumeSlug: string;
}) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let last = 0;
    try { last = Number(localStorage.getItem(REVIEW_PROMPT_KEY) || 0); } catch { /* noop */ }
    if (Date.now() - last > REVIEW_PROMPT_COOLDOWN_MS) {
      try { localStorage.setItem(REVIEW_PROMPT_KEY, String(Date.now())); } catch { /* noop */ }
      setVisible(true);
    }
  }, []);

  if (!visible) return null;

  const copy = context === 'quiz'
    ? { title: 'Tried any of these?', body: 'Your review helps the next person pick with confidence — especially for Indian weather.' }
    : { title: `Wearing ${perfumeName} today?`, body: 'Drop a quick review while the scent is fresh. It takes less than a minute.' };

  return (
    <Card className="relative mt-8 overflow-hidden border-gold-600/30 p-6">
      <button
        onClick={() => setVisible(false)}
        aria-label="Dismiss"
        className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full text-stone-400 transition-colors hover:bg-stone-900/5 hover:text-stone-700 dark:hover:bg-white/10 dark:hover:text-stone-200"
      >
        ✕
      </button>
      <div className="flex flex-col gap-4 pr-8 sm:flex-row sm:items-center">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gold-600/10 text-2xl">✍️</span>
        <div className="min-w-0 flex-1">
          <h3 className="font-display text-lg font-bold">{copy.title}</h3>
          <p className="mt-1 text-sm leading-relaxed text-stone-500 dark:text-stone-400">{copy.body}</p>
        </div>
        <Link href={`/perfume/${perfumeSlug}`} className="shrink-0">
          <Button size="sm">Review {perfumeName.length > 22 ? perfumeName.slice(0, 22) + '…' : perfumeName}</Button>
        </Link>
      </div>
    </Card>
  );
}

/* ---------- CountdownTimer ---------- */
export function CountdownTimer({ endsAt }: { endsAt: string }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(t); }, []);
  const diff = Math.max(0, new Date(endsAt).getTime() - now);
  const d = Math.floor(diff / 86400000), h = Math.floor(diff / 3600000) % 24, m = Math.floor(diff / 60000) % 60, s = Math.floor(diff / 1000) % 60;
  const cell = (v: number, l: string) => (
    <div className="flex min-w-14 flex-col items-center rounded-xl bg-stone-900/5 px-2 py-2 dark:bg-white/10">
      <span className="font-display text-xl font-bold tabular-nums">{String(v).padStart(2, '0')}</span>
      <span className="text-[10px] font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-400">{l}</span>
    </div>
  );
  if (diff === 0) return <p className="text-sm font-semibold text-stone-500">Ended</p>;
  return <div className="flex gap-2">{cell(d, 'days')}{cell(h, 'hrs')}{cell(m, 'min')}{cell(s, 'sec')}</div>;
}

/* ---------- ThemeToggle ---------- */
export function ThemeToggle() {
  const [theme, setTheme] = useState<'light' | 'dark'>(() =>
    typeof document !== 'undefined' && document.documentElement.classList.contains('dark') ? 'dark' : 'light');
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    try { localStorage.setItem('scentiqa-theme', theme); } catch { /* noop */ }
  }, [theme]);
  return (
    <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
      className="flex h-10 w-10 items-center justify-center rounded-xl text-stone-600 transition-all duration-200 hover:bg-stone-900/5 hover:text-stone-900 active:scale-90 dark:text-stone-300 dark:hover:bg-white/10 dark:hover:text-white">
      {theme === 'dark' ? (
        <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="4.5" /><path d="M12 2v2.5M12 19.5V22M4.9 4.9l1.8 1.8M17.3 17.3l1.8 1.8M2 12h2.5M19.5 12H22M4.9 19.1l1.8-1.8M17.3 6.7l1.8-1.8" /></svg>
      ) : (
        <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" /></svg>
      )}
    </button>
  );
}
