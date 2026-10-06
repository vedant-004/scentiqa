// AI Scent Finder — Scentiqa's flagship. A cinematic 10-step scent profiling
// wizard: entry ritual → living Scent DNA orb → archetype reveal →
// precision-ranked, explainable recommendations.
// Mobile-first, premium feel. Respects prefers-reduced-motion.
'use client';
import { useCallback, useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { cn, inr } from '@/lib/utils';
import { Button, Card, Skeleton } from '@/components';
import {
  archetypeFromAnswers,
  confidenceFor,
  dnaFromAnswers,
  type DnaParams,
  type ScentArchetype,
} from '@/lib/scent-archetypes';

/* ---------------- types ---------------- */

interface Note { slug: string; name: string; category: string }
interface House { slug: string; name: string; count: number }
interface Breakdown { key: string; label: string; points: number; max: number }
interface Result {
  id: string; slug: string; name: string; house: string; houseSlug: string;
  concentration: string; bottleImage: string | null;
  lowestPriceInr: number | null; ratingAvg: number; ratingCount: number;
  isDupe: boolean; score: number;
  breakdown: Breakdown[]; reasons: string[];
  matchedLovedNotes: string[];
  predictedLongevity: number; predictedSillage: number;
  relaxed?: string;
}
interface ApiOut {
  answers: any; totalScored: number; relaxed: string | null;
  tensions: string[]; results: Result[];
  wildcard: { pick: Result; explanation: string } | null;
}

interface Answers {
  lovedNotes: string[];
  hatedNotes: string[];
  houses: string[];
  longevity: number;
  sillage: number;
  occasions: string[];
  budget: number;
  gender: string;
  clonePref: string;
  concentration: string[];
}

type Phase = 'entry' | 'wizard' | 'loading' | 'reveal' | 'results';

/* ---------------- constants ---------------- */

const OCCASIONS = [
  { v: 'office', label: '💼 Office' },
  { v: 'date', label: '🌹 Date Night' },
  { v: 'party', label: '🎉 Party' },
  { v: 'daily', label: '☀️ Daily Wear' },
  { v: 'wedding', label: '💒 Wedding / Festive' },
  { v: 'gym', label: '🏋️ Gym' },
  { v: 'monsoon', label: '🌧️ Monsoon' },
  { v: 'summer', label: '🌤️ Summer Day' },
  { v: 'winter', label: '❄️ Winter Evening' },
];

const CONCENTRATIONS = [
  { v: 'parfum', label: 'Parfum / Extrait', desc: 'Richest, longest-lasting' },
  { v: 'edp', label: 'Eau de Parfum', desc: 'The all-rounder' },
  { v: 'edt', label: 'Eau de Toilette', desc: 'Lighter, fresher' },
  { v: 'attar', label: 'Attar / Oil', desc: 'Alcohol-free, traditional' },
];

const GENDERS = [
  { v: 'any', label: 'Any', desc: 'Show me everything' },
  { v: 'men', label: 'Men', desc: '' },
  { v: 'women', label: 'Women', desc: '' },
  { v: 'unisex', label: 'Unisex', desc: '' },
];

const CLONE_PREFS = [
  { v: 'any', label: 'No preference', desc: 'Best matches, whatever they are', icon: '⚖️' },
  { v: 'originals', label: 'Prefer originals', desc: 'Designer & niche creations', icon: '💎' },
  { v: 'clones', label: 'Prefer dupes', desc: 'Smell expensive for less', icon: '💰' },
];

const LONGEVITY_LABELS = ['', '2–3 hours', '4–6 hours', '6–8 hours', '8–12 hours', '12+ hours'];
const SILLAGE_LABELS = ['', 'Intimate', 'Close', 'Moderate', 'Strong', 'Beast mode'];

const STEP_LABELS = ['Notes', 'Dislikes', 'Houses', 'Wear', 'Projection', 'Occasions', 'Budget', 'For', 'Style', 'Strength'];

const STEPS = [
  { id: 'loved', title: 'Which notes do you love?', sub: 'Pick 3–10. This shapes your entire profile.' },
  { id: 'hated', title: 'Any notes you can\'t stand?', sub: 'Optional — we\'ll avoid these completely.', skippable: true },
  { id: 'houses', title: 'Favorite houses?', sub: 'Optional — leave empty to search everything.', skippable: true },
  { id: 'longevity', title: 'How long should it last?', sub: 'On skin, in real Indian weather.' },
  { id: 'sillage', title: 'How loud should it project?', sub: 'From a whisper to a statement.' },
  { id: 'occasions', title: 'When will you wear it?', sub: 'Pick all that apply.' },
  { id: 'budget', title: 'Your max budget?', sub: 'We use real prices from Indian sellers.' },
  { id: 'gender', title: 'Who is it for?', sub: '' },
  { id: 'clone', title: 'Originals or dupes?', sub: 'India\'s clone game is world-class. Your call.' },
  { id: 'concentration', title: 'Concentration?', sub: 'Optional — skip for everything.', skippable: true },
];

/* ---------------- shared CSS keyframes ---------------- */

function FinderStyles() {
  return (
    <style>{`
      @keyframes finderStepIn { from { opacity: 0; transform: translateX(34px); } to { opacity: 1; transform: translateX(0); } }
      .finder-step { animation: finderStepIn .34s cubic-bezier(.22,.9,.3,1); }
      @keyframes chipPop { 0% { transform: scale(.82); } 55% { transform: scale(1.08); } 100% { transform: scale(1); } }
      .chip-pop { animation: chipPop .28s cubic-bezier(.3,1.4,.5,1); }
      @keyframes shimmerSweep { 0% { transform: translateX(-120%) skewX(-18deg); } 100% { transform: translateX(240%) skewX(-18deg); } }
      .btn-shimmer { position: relative; overflow: hidden; }
      .btn-shimmer::after { content: ''; position: absolute; top: 0; bottom: 0; width: 45%;
        background: linear-gradient(90deg, transparent, rgba(255,255,255,.35), transparent);
        animation: shimmerSweep 2.8s ease-in-out infinite; }
      @keyframes barShimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
      .progress-shimmer { background-size: 200% 100%; animation: barShimmer 2.4s linear infinite; }
      @keyframes riseParticle { 0% { transform: translateY(24px) scale(1); opacity: 0; } 12% { opacity: .85; } 100% { transform: translateY(-105vh) scale(.4); opacity: 0; } }
      .rise-particle { animation: riseParticle linear infinite; }
      @keyframes dnaPulse { 0%,100% { transform: scale(1); } 50% { transform: scale(1.14); } }
      .dna-pulse { animation: dnaPulse 3.2s ease-in-out infinite; transform-box: fill-box; transform-origin: center; }
      @keyframes dnaSpin { to { transform: rotate(360deg); } }
      .dna-spin { animation: dnaSpin 16s linear infinite; transform-box: fill-box; transform-origin: center; }
      @keyframes dnaSpinRev { to { transform: rotate(-360deg); } }
      .dna-spin-rev { animation: dnaSpinRev 22s linear infinite; transform-box: fill-box; transform-origin: center; }
      @keyframes dnaFloat { 0%,100% { transform: translateY(0); opacity: .95; } 50% { transform: translateY(-7px); opacity: .35; } }
      .dna-particle { animation: dnaFloat ease-in-out infinite; }
      @keyframes dnaBreathe { 0%,100% { transform: scale(1); } 50% { transform: scale(1.045); } }
      .dna-core { animation: dnaBreathe 4.2s ease-in-out infinite; transform-box: fill-box; transform-origin: center; }
      .dna-stop { transition: stop-color 1.4s ease; }
      @keyframes revealFlourish { 0% { opacity: 0; transform: scale(.86) translateY(26px); } 60% { opacity: 1; transform: scale(1.03) translateY(-4px); } 100% { opacity: 1; transform: scale(1) translateY(0); } }
      .reveal-flourish { animation: revealFlourish .9s cubic-bezier(.22,1.2,.36,1) both; }
      @keyframes fadeUp { from { opacity: 0; transform: translateY(22px); } to { opacity: 1; transform: translateY(0); } }
      .fade-up { animation: fadeUp .7s cubic-bezier(.22,.9,.3,1) both; }
      @keyframes glowPulse { 0%,100% { box-shadow: 0 0 24px rgba(217,180,84,.35), 0 8px 32px rgba(124,58,237,.25); } 50% { box-shadow: 0 0 44px rgba(217,180,84,.55), 0 8px 44px rgba(124,58,237,.4); } }
      .glow-pulse { animation: glowPulse 2.6s ease-in-out infinite; }
      @keyframes tickGlow { 0%,100% { opacity: 1; } 50% { opacity: .55; } }
      .tick-glow { animation: tickGlow 1.1s ease-in-out infinite; }
      @media (prefers-reduced-motion: reduce) {
        .finder-step, .chip-pop, .btn-shimmer::after, .progress-shimmer, .rise-particle,
        .dna-pulse, .dna-spin, .dna-spin-rev, .dna-particle, .dna-core,
        .reveal-flourish, .fade-up, .glow-pulse, .tick-glow { animation: none !important; }
        .dna-stop { transition: none; }
      }
    `}</style>
  );
}

/* ---------------- Scent DNA orb ---------------- */

function ScentDnaOrb({ dna, size = 96 }: { dna: DnaParams; size?: number }) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');
  const particles = useMemo(() => {
    const arr: Array<{ x: number; y: number; r: number; d: number; delay: number }> = [];
    for (let i = 0; i < dna.particles; i++) {
      const a = (i * 137.508 * Math.PI) / 180;
      const rad = 30 + ((i * 53) % 20);
      arr.push({
        x: 60 + Math.cos(a) * rad,
        y: 60 + Math.sin(a) * rad,
        r: 1.4 + (i % 3) * 0.9,
        d: 3.5 + (i % 5),
        delay: -((i * 1.7) % 6),
      });
    }
    return arr;
  }, [dna.particles]);

  const sat = Math.round(dna.saturation);
  const glowOp = 0.18 + dna.glow * 0.3;
  return (
    <svg viewBox="0 0 120 120" width={size} height={size} role="img" aria-label="Your scent DNA">
      <defs>
        <radialGradient id={`dna-${uid}`} cx="50%" cy="42%" r="68%">
          <stop offset="0%" className="dna-stop" stopColor={`hsl(${Math.round(dna.hue)} ${sat}% 74%)`} />
          <stop offset="55%" className="dna-stop" stopColor={`hsl(${Math.round(dna.hue2)} ${sat}% 56%)`} />
          <stop offset="100%" className="dna-stop" stopColor={`hsl(${Math.round(dna.hue)} ${sat}% 30%)`} stopOpacity="0.95" />
        </radialGradient>
        <filter id={`dnab-${uid}`} x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="7" />
        </filter>
      </defs>
      <circle cx="60" cy="60" r="47" fill={`hsl(${Math.round(dna.hue)} ${sat}% 55%)`} opacity={glowOp} filter={`url(#dnab-${uid})`} className="dna-pulse" />
      <ellipse cx="60" cy="60" rx="45" ry="19" fill="none" stroke={`hsl(${Math.round(dna.hue2)} 85% 72%)`} strokeWidth="1.4" opacity="0.55" className="dna-spin" />
      <ellipse cx="60" cy="60" rx="45" ry="19" fill="none" stroke={`hsl(${Math.round(dna.hue)} 85% 66%)`} strokeWidth="1" opacity="0.35" className="dna-spin-rev" />
      {particles.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r={p.r} fill={`hsl(${Math.round(dna.hue)} 90% 80%)`} className="dna-particle"
          style={{ animationDuration: `${p.d}s`, animationDelay: `${p.delay}s` }} />
      ))}
      <circle cx="60" cy="60" r="33" fill={`url(#dna-${uid})`} className="dna-core" opacity={0.6 + dna.glow * 0.4} />
      <circle cx="50" cy="48" r="9" fill="white" opacity="0.28" filter={`url(#dnab-${uid})`} />
    </svg>
  );
}

/* ---------------- small components ---------------- */

function ProgressBar({ step, total }: { step: number; total: number }) {
  return (
    <div className="mb-5">
      <div className="mb-2 flex items-center justify-between text-xs font-semibold">
        <span className="uppercase tracking-[0.14em] text-gold-600 dark:text-gold-400">✨ AI Scent Finder</span>
        <span className="text-stone-400">{STEP_LABELS[step]} · {step + 1}/{total}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-stone-200 dark:bg-ink-700">
        <div
          className="progress-shimmer h-full rounded-full bg-gradient-to-r from-violet-600 via-fuchsia-500 to-gold-500 transition-all duration-700 ease-out"
          style={{ width: `${((step + 1) / total) * 100}%` }}
        />
      </div>
    </div>
  );
}

function ScoreRing({ score, size = 84 }: { score: number; size?: number }) {
  const r = (size - 10) / 2;
  const circ = 2 * Math.PI * r;
  const color = score >= 80 ? '#10b981' : score >= 60 ? '#84cc16' : score >= 40 ? '#f59e0b' : '#f43f5e';
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={7}
          className="stroke-stone-200 dark:stroke-ink-700" />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={7}
          strokeLinecap="round" strokeDasharray={circ}
          strokeDashoffset={circ - (circ * score) / 100}
          className="transition-all duration-1000" />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-xl font-extrabold leading-none">{score}%</span>
        <span className="text-[9px] font-bold uppercase tracking-wider text-stone-400">match</span>
      </div>
    </div>
  );
}

function Chip({ active, onClick, children, className }: {
  active?: boolean; onClick?: () => void; children: React.ReactNode; className?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'rounded-full border px-3.5 py-2 text-sm font-medium transition-all duration-150 active:scale-95',
        active
          ? 'chip-pop border-violet-600 bg-violet-600 text-white shadow-md shadow-violet-600/25 dark:border-violet-400 dark:bg-violet-500'
          : 'border-stone-200 bg-white text-stone-700 hover:border-violet-300 dark:border-ink-700 dark:bg-ink-900 dark:text-stone-200',
        className
      )}
    >
      {children}
    </button>
  );
}

/* ---------------- note picker ---------------- */

function NotePicker({ notes, selected, onToggle, min, max, excludeMode }: {
  notes: Note[]; selected: string[]; onToggle: (name: string) => void;
  min: number; max: number; excludeMode?: boolean;
}) {
  const [q, setQ] = useState('');
  const accent = excludeMode ? 'rose' : 'violet';

  const filtered = useMemo(() => {
    const query = q.toLowerCase().trim();
    if (!query) return notes;
    return notes.filter((n) => n.name.toLowerCase().includes(query) || n.category.toLowerCase().includes(query));
  }, [notes, q]);

  const grouped = useMemo(() => {
    const g = new Map<string, Note[]>();
    for (const n of filtered) {
      const c = n.category || 'other';
      if (!g.has(c)) g.set(c, []);
      g.get(c)!.push(n);
    }
    return [...g.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  }, [filtered]);

  return (
    <div>
      <div className="relative mb-3">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search 400 notes — try 'oud', 'vanilla'…"
          className="w-full rounded-2xl border border-stone-200 bg-white py-3 pl-11 pr-4 text-[15px] outline-none transition focus:border-violet-400 dark:border-ink-700 dark:bg-ink-900 dark:focus:border-violet-500"
        />
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg">🔍</span>
      </div>

      {selected.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-2 rounded-2xl bg-violet-50 p-3 dark:bg-violet-950/30">
          {selected.map((s) => (
            <button
              key={s}
              onClick={() => onToggle(s)}
              className={cn(
                'chip-pop flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold text-white shadow active:scale-95',
                excludeMode ? 'bg-rose-500' : 'bg-violet-600 dark:bg-violet-500'
              )}
            >
              {s} <span className="text-xs opacity-70">✕</span>
            </button>
          ))}
        </div>
      )}

      <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-stone-400">
        {selected.length} selected {min > 0 && `(need ${min}–${max})`}
      </p>

      <div className="max-h-[42vh] space-y-4 overflow-y-auto pr-1">
        {grouped.map(([cat, list]) => (
          <div key={cat}>
            <p className="mb-1.5 text-[11px] font-bold uppercase tracking-[0.12em] text-stone-400">
              {cat.replace(/_/g, ' ')}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {list.map((n) => {
                const active = selected.includes(n.name);
                const disabled = !active && selected.length >= max;
                return (
                  <button
                    key={n.slug}
                    disabled={disabled}
                    onClick={() => onToggle(n.name)}
                    className={cn(
                      'rounded-full border px-3 py-1.5 text-[13px] transition-all active:scale-95',
                      active
                        ? cn('chip-pop font-semibold text-white shadow',
                            excludeMode ? 'border-rose-500 bg-rose-500' : 'border-violet-600 bg-violet-600 dark:bg-violet-500')
                        : 'border-stone-200 bg-white text-stone-600 hover:border-violet-300 dark:border-ink-700 dark:bg-ink-900 dark:text-stone-300',
                      disabled && 'opacity-40'
                    )}
                  >
                    {n.name}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
        {grouped.length === 0 && (
          <p className="py-8 text-center text-sm text-stone-400">No notes match “{q}”.</p>
        )}
      </div>
    </div>
  );
}

/* ---------------- house picker ---------------- */

function HousePicker({ houses, selected, onToggle }: {
  houses: House[]; selected: string[]; onToggle: (slug: string) => void;
}) {
  const [q, setQ] = useState('');
  const filtered = useMemo(() => {
    const query = q.toLowerCase().trim();
    const list = query
      ? houses.filter((h) => h.name.toLowerCase().includes(query))
      : houses.slice(0, 40);
    return list.slice(0, 60);
  }, [houses, q]);

  return (
    <div>
      <div className="relative mb-3">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search houses — try 'Dior', 'Lattafa'…"
          className="w-full rounded-2xl border border-stone-200 bg-white py-3 pl-11 pr-4 text-[15px] outline-none transition focus:border-violet-400 dark:border-ink-700 dark:bg-ink-900 dark:focus:border-violet-500"
        />
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg">🏠</span>
      </div>
      {selected.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-2">
          {selected.map((s) => {
            const h = houses.find((x) => x.slug === s);
            return (
              <button key={s} onClick={() => onToggle(s)}
                className="chip-pop flex items-center gap-1.5 rounded-full bg-violet-600 px-3 py-1.5 text-sm font-semibold text-white active:scale-95">
                {h?.name ?? s} <span className="text-xs opacity-70">✕</span>
              </button>
            );
          })}
        </div>
      )}
      <div className="max-h-[42vh] space-y-1 overflow-y-auto pr-1">
        {filtered.map((h) => {
          const active = selected.includes(h.slug);
          return (
            <button
              key={h.slug}
              onClick={() => onToggle(h.slug)}
              className={cn(
                'flex w-full items-center justify-between rounded-xl border px-4 py-2.5 text-left text-[15px] transition active:scale-[0.99]',
                active
                  ? 'border-violet-600 bg-violet-50 font-semibold dark:border-violet-400 dark:bg-violet-950/40'
                  : 'border-stone-100 bg-white hover:border-violet-200 dark:border-ink-800 dark:bg-ink-900'
              )}
            >
              <span>{h.name}</span>
              <span className="flex items-center gap-2 text-xs text-stone-400">
                {h.count} scents
                <span className={cn(
                  'flex h-5 w-5 items-center justify-center rounded-full border text-[11px]',
                  active ? 'chip-pop border-violet-600 bg-violet-600 text-white' : 'border-stone-300 text-transparent'
                )}>✓</span>
              </span>
            </button>
          );
        })}
        {filtered.length === 0 && <p className="py-8 text-center text-sm text-stone-400">No houses match.</p>}
      </div>
    </div>
  );
}

/* ---------------- slider ---------------- */

function BigSlider({ value, onChange, min, max, labels, format }: {
  value: number; onChange: (v: number) => void;
  min: number; max: number; labels: string[]; format: (v: number) => string;
}) {
  return (
    <div className="py-4">
      <div className="mb-6 text-center">
        <p className="font-display text-4xl font-extrabold text-violet-700 dark:text-violet-300">{format(value)}</p>
        <p className="mt-1 text-sm text-stone-500">{labels[value]}</p>
      </div>
      <input
        type="range" min={min} max={max} step={1} value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="finder-slider w-full"
        aria-label="value slider"
      />
      <div className="mt-2 flex justify-between text-[11px] font-medium text-stone-400">
        {labels.slice(min, max + 1).map((l, i) => (
          <span key={i} className={cn('text-center', (i + min) === value && 'font-bold text-violet-600 dark:text-violet-300')}>
            {l.split(' ')[0]}
          </span>
        ))}
      </div>
      <style>{`
        .finder-slider { -webkit-appearance: none; appearance: none; height: 8px; border-radius: 999px;
          background: linear-gradient(to right, #7c3aed var(--fill, 50%), #e7e5e4 var(--fill, 50%)); outline: none; }
        .finder-slider::-webkit-slider-thumb { -webkit-appearance: none; width: 30px; height: 30px; border-radius: 50%;
          background: #fff; border: 3px solid #7c3aed; box-shadow: 0 2px 10px rgba(124,58,237,.4); cursor: pointer; }
        .finder-slider::-moz-range-thumb { width: 26px; height: 26px; border-radius: 50%;
          background: #fff; border: 3px solid #7c3aed; cursor: pointer; }
      `}</style>
    </div>
  );
}

/* ---------------- entry screen ---------------- */

function EntryScreen({ onStart }: { onStart: () => void }) {
  const motes = useMemo(() => {
    const arr: Array<{ left: string; size: number; dur: number; delay: number; hue: number }> = [];
    const hues = [268, 310, 190, 36, 140];
    for (let i = 0; i < 22; i++) {
      arr.push({
        left: `${(i * 41) % 100}%`,
        size: 3 + ((i * 7) % 6),
        dur: 9 + ((i * 13) % 10),
        delay: -((i * 3.3) % 14),
        hue: hues[i % hues.length],
      });
    }
    return arr;
  }, []);

  return (
    <div className="relative flex min-h-[92vh] flex-col items-center justify-center overflow-hidden px-6 text-center">
      {/* rising scent motes */}
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        {motes.map((m, i) => (
          <span key={i} className="rise-particle absolute bottom-0 rounded-full"
            style={{
              left: m.left, width: m.size, height: m.size,
              background: `hsl(${m.hue} 85% 70%)`,
              boxShadow: `0 0 12px hsl(${m.hue} 85% 65%)`,
              animationDuration: `${m.dur}s`, animationDelay: `${m.delay}s`,
            }} />
        ))}
        {/* ambient glows */}
        <div className="absolute -left-24 top-1/4 h-72 w-72 rounded-full bg-violet-600/20 blur-3xl" />
        <div className="absolute -right-24 bottom-1/4 h-72 w-72 rounded-full bg-fuchsia-500/15 blur-3xl" />
        <div className="absolute left-1/2 top-8 h-56 w-56 -translate-x-1/2 rounded-full bg-gold-500/10 blur-3xl" />
      </div>

      <div className="fade-up relative" style={{ animationDelay: '.1s' }}>
        <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-violet-400/30 bg-violet-500/10 px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.2em] text-violet-300">
          ✨ Scentiqa AI
        </p>
        <h1 className="font-display text-[42px] font-extrabold leading-[1.05] tracking-tight text-white sm:text-6xl">
          Discover Your<br />
          <span className="bg-gradient-to-r from-violet-400 via-fuchsia-300 to-gold-300 bg-clip-text text-transparent">
            Signature Scent
          </span>
        </h1>
        <p className="mx-auto mt-4 max-w-sm text-[15px] leading-relaxed text-stone-400">
          60 seconds. 10 questions. One perfect match — ranked from 6,639 perfumes by an AI trained on real perfumery data.
        </p>
      </div>

      <div className="fade-up relative mt-8" style={{ animationDelay: '.3s' }}>
        <button
          onClick={onStart}
          className="btn-shimmer glow-pulse group rounded-2xl bg-gradient-to-r from-violet-600 via-fuchsia-600 to-violet-600 bg-[length:200%_100%] px-10 py-4 text-lg font-extrabold text-white transition-all duration-200 hover:bg-right active:scale-95"
        >
          Start My Journey →
        </button>
        <p className="mt-4 text-xs font-medium text-stone-400">
          6,639 perfumes · AI-matched · No account needed
        </p>
      </div>

      <div className="fade-up relative mt-10 grid max-w-md grid-cols-3 gap-3 text-center" style={{ animationDelay: '.5s' }}>
        {[
          ['🧬', 'Scent DNA', 'Watch your taste take shape live'],
          ['🔮', '12 archetypes', 'Discover your scent personality'],
          ['🎯', 'Explained', 'Every pick shows its reasons'],
        ].map(([e, t, d]) => (
          <div key={t} className="rounded-2xl border border-white/15 bg-white/10 p-3 backdrop-blur">
            <p className="text-2xl">{e}</p>
            <p className="mt-1 text-[13px] font-bold text-white">{t}</p>
            <p className="mt-0.5 text-[11px] leading-snug text-stone-300">{d}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------------- reveal / analyzing screen ---------------- */

function RevealScreen({ dna }: { dna: DnaParams }) {
  const [count, setCount] = useState(0);
  const [line, setLine] = useState(0);
  const lines = [
    'Reading your scent DNA…',
    'Comparing 6,639 perfumes…',
    'Scoring notes, accords & performance…',
    'Checking live Indian prices…',
    'Finding your archetype…',
  ];
  useEffect(() => {
    const t0 = performance.now();
    const dur = 2600;
    let raf = 0;
    const tick = (t: number) => {
      const p = Math.min(1, (t - t0) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      setCount(Math.round(eased * 6639));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    const li = setInterval(() => setLine((v) => (v + 1) % lines.length), 900);
    return () => { cancelAnimationFrame(raf); clearInterval(li); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex min-h-[85vh] flex-col items-center justify-center px-6 text-center">
      <div className="reveal-flourish">
        <ScentDnaOrb dna={{ ...dna, glow: 1, particles: Math.max(dna.particles, 26) }} size={168} />
      </div>
      <p className="tick-glow mt-6 font-display text-5xl font-extrabold tabular-nums tracking-tight">
        {count.toLocaleString('en-IN')}
      </p>
      <p className="mt-1 text-[11px] font-bold uppercase tracking-[0.22em] text-stone-400">
        perfumes analyzed
      </p>
      <p className="mt-5 min-h-[24px] text-[15px] font-medium text-violet-600 dark:text-violet-300">
        {lines[line]}
      </p>
      <div className="mt-6 h-1.5 w-56 overflow-hidden rounded-full bg-stone-200 dark:bg-ink-700">
        <div className="progress-shimmer h-full rounded-full bg-gradient-to-r from-violet-600 via-fuchsia-500 to-gold-500"
          style={{ width: `${Math.min(100, (count / 6639) * 100)}%` }} />
      </div>
    </div>
  );
}

/* ---------------- archetype card ---------------- */

function ArchetypeCard({ arch, dna, delay = 0 }: { arch: ScentArchetype; dna: DnaParams; delay?: number }) {
  const h = Math.round(arch.hue);
  return (
    <div
      className="reveal-flourish overflow-hidden rounded-3xl border border-white/10 shadow-2xl"
      style={{
        animationDelay: `${delay}s`,
        background: `linear-gradient(135deg, hsl(${h} 45% 14%) 0%, hsl(${(h + 40) % 360} 50% 22%) 60%, hsl(${h} 55% 30%) 100%)`,
      }}
    >
      <div className="relative p-6 sm:p-8">
        <div className="pointer-events-none absolute -right-10 -top-10 opacity-30" aria-hidden>
          <ScentDnaOrb dna={dna} size={170} />
        </div>
        <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-white/60">
          🔮 Your scent archetype
        </p>
        <div className="mt-3 flex items-center gap-4">
          <span className="text-5xl drop-shadow-lg">{arch.emoji}</span>
          <div>
            <h2 className="font-display text-3xl font-extrabold text-white sm:text-4xl">{arch.name}</h2>
            <p className="mt-1 text-[15px] font-medium italic text-white/80">“{arch.tagline}”</p>
          </div>
        </div>
        <p className="relative mt-4 max-w-lg text-[14px] leading-relaxed text-white/85">{arch.description}</p>
        <div className="relative mt-4 flex flex-wrap gap-1.5">
          {arch.families.map((f) => (
            <span key={f} className="rounded-full bg-white/15 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-white backdrop-blur">
              {f}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ---------------- confidence meter ---------------- */

function ConfidenceMeter({ score }: { score: number }) {
  const c = confidenceFor(score);
  const toneColor = c.tone === 'high' ? 'emerald' : c.tone === 'good' ? 'lime' : c.tone === 'ok' ? 'amber' : 'fuchsia';
  return (
    <div className={cn(
      'rounded-2xl border p-4',
      c.tone === 'high' && 'border-emerald-300 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/40',
      c.tone === 'good' && 'border-lime-300 bg-lime-50 dark:border-lime-800 dark:bg-lime-950/40',
      c.tone === 'ok' && 'border-amber-300 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/40',
      c.tone === 'wild' && 'border-fuchsia-300 bg-fuchsia-50 dark:border-fuchsia-800 dark:bg-fuchsia-950/40',
    )}>
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-extrabold">
          {c.tone === 'high' ? '💚' : c.tone === 'good' ? '💛' : c.tone === 'ok' ? '🧡' : '🎲'} {c.label}
        </p>
        <span className="text-xs font-bold text-stone-400">{score}%</span>
      </div>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-black/10 dark:bg-white/10">
        <div className={cn('h-full rounded-full transition-all duration-1000',
          c.tone === 'high' && 'bg-gradient-to-r from-emerald-500 to-teal-400',
          c.tone === 'good' && 'bg-gradient-to-r from-lime-500 to-emerald-400',
          c.tone === 'ok' && 'bg-gradient-to-r from-amber-500 to-orange-400',
          c.tone === 'wild' && 'bg-gradient-to-r from-fuchsia-500 to-violet-400',
        )} style={{ width: `${score}%` }} />
      </div>
      <p className="mt-2 text-[13px] text-stone-600 dark:text-stone-300">{c.detail}</p>
    </div>
  );
}

/* ---------------- main page ---------------- */

const DEFAULTS: Answers = {
  lovedNotes: [], hatedNotes: [], houses: [],
  longevity: 3, sillage: 3, occasions: [],
  budget: 5000, gender: 'any', clonePref: 'any', concentration: [],
};

// useLayoutEffect on client (no paint flash), useEffect on server (no SSR warning)
const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

function encodeAnswers(a: Answers): string {
  return btoa(unescape(encodeURIComponent(JSON.stringify(a))));
}
function decodeAnswers(s: string): Answers | null {
  try {
    const p = JSON.parse(decodeURIComponent(escape(atob(s))));
    return { ...DEFAULTS, ...p };
  } catch { return null; }
}

export default function FinderPage() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [houses, setHouses] = useState<House[]>([]);
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Answers>(DEFAULTS);
  const [phase, setPhase] = useState<Phase>('entry');
  const [out, setOut] = useState<ApiOut | null>(null);
  const [error, setError] = useState<string | null>(null);
  const topRef = useRef<HTMLDivElement>(null);

  // Wizard takeover: hide the global footer + site mobile bottom nav while the
  // user is in the finder flow (entry → wizard → analyzing → reveal).
  // Shown again on the results page. Runs before paint so there is no flash.
  useIsomorphicLayoutEffect(() => {
    document.body.dataset.finderPhase = phase;
    return () => { delete document.body.dataset.finderPhase; };
  }, [phase]);

  // Living DNA params — recomputed as answers evolve
  const dna = useMemo(
    () => dnaFromAnswers(answers, step / STEPS.length),
    [answers, step]
  );
  const resultDna = useMemo(() => dnaFromAnswers(answers, 1), [answers]);
  const liveArchetype = useMemo(() => archetypeFromAnswers(answers), [answers]);

  // Load notes + houses
  useEffect(() => {
    fetch('/api/notes').then((r) => r.json()).then((j) => setNotes(j.notes ?? [])).catch(() => {});
    fetch('/api/perfumes').then((r) => r.json()).then((j) => {
      const map = new Map<string, House>();
      for (const p of j.perfumes ?? []) {
        if (!p.houseSlug) continue;
        const h = map.get(p.houseSlug) ?? { slug: p.houseSlug, name: p.house, count: 0 };
        h.count += 1;
        map.set(p.houseSlug, h);
      }
      setHouses([...map.values()].sort((a, b) => b.count - a.count));
    }).catch(() => {});
    // shared profile via #p=... → skip straight to results
    if (typeof window !== 'undefined' && window.location.hash.startsWith('#p=')) {
      const a = decodeAnswers(window.location.hash.slice(3));
      if (a && a.lovedNotes.length >= 3) {
        setAnswers(a);
        runFinder(a);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const set = <K extends keyof Answers>(k: K, v: Answers[K]) =>
    setAnswers((a) => ({ ...a, [k]: v }));

  const toggleIn = (list: string[], v: string, max?: number) => {
    if (list.includes(v)) return list.filter((x) => x !== v);
    if (max && list.length >= max) return list;
    return [...list, v];
  };

  const canContinue = useMemo(() => {
    const id = STEPS[step].id;
    if (id === 'loved') return answers.lovedNotes.length >= 3;
    if (id === 'occasions') return answers.occasions.length >= 1;
    return true;
  }, [step, answers]);

  const goNext = () => {
    if (step < STEPS.length - 1) {
      setStep(step + 1);
      topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      runFinder(answers);
    }
  };
  const goBack = () => {
    if (step > 0) {
      setStep(step - 1);
      topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const runFinder = useCallback(async (a: Answers) => {
    setPhase('loading');
    setError(null);
    topRef.current?.scrollIntoView({ behavior: 'smooth' });
    try {
      const r = await fetch('/api/finder/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(a),
      });
      let j: any = null;
      try {
        j = await r.json();
      } catch {
        throw new Error('The finder service did not respond properly. Please check your connection and try again.');
      }
      if (!r.ok) throw new Error(j?.error || 'Something went wrong');
      setOut(j);
      // dramatic reveal beat before results
      setPhase('reveal');
      setTimeout(() => {
        setPhase('results');
        topRef.current?.scrollIntoView({ behavior: 'auto', block: 'start' });
      }, 3400);
    } catch (e: any) {
      setError(e.message || 'Failed to get recommendations');
      setPhase('wizard');
    }
  }, []);

  const reset = () => {
    setAnswers(DEFAULTS);
    setStep(0);
    setOut(null);
    setPhase('entry');
    if (typeof window !== 'undefined') window.location.hash = '';
  };

  /* ---------- entry phase ---------- */
  if (phase === 'entry') {
    return (
      <div ref={topRef} className="bg-stone-950 text-white">
        <FinderStyles />
        <EntryScreen onStart={() => { setPhase('wizard'); topRef.current?.scrollIntoView(); }} />
      </div>
    );
  }

  /* ---------- results phase ---------- */
  if (phase === 'results' && out) {
    return <ResultsView out={out} answers={answers} reset={reset} topRef={topRef} />;
  }

  /* ---------- loading phase ---------- */
  if (phase === 'loading') {
    return (
      <div ref={topRef} className="mx-auto flex min-h-[70vh] max-w-md flex-col items-center justify-center px-6 text-center">
        <FinderStyles />
        <div className="relative mb-6">
          <div className="h-20 w-20 animate-spin rounded-full border-4 border-violet-200 border-t-violet-600 dark:border-ink-700 dark:border-t-violet-400" />
          <span className="absolute inset-0 flex items-center justify-center text-3xl">🌸</span>
        </div>
        <h2 className="font-display text-2xl font-extrabold">Consulting the AI…</h2>
        <LoadingLine />
      </div>
    );
  }

  /* ---------- reveal phase ---------- */
  if (phase === 'reveal') {
    return (
      <div ref={topRef}>
        <FinderStyles />
        <RevealScreen dna={resultDna} />
      </div>
    );
  }

  /* ---------- wizard phase ---------- */
  const s = STEPS[step];
  const showTeaser = step === 4 && answers.lovedNotes.length >= 2;
  return (
    <div ref={topRef} className="mx-auto max-w-xl px-4 pb-32 pt-6 sm:px-6">
      <FinderStyles />
      <ProgressBar step={step} total={STEPS.length} />

      {/* living scent DNA */}
      <div className="fade-up mb-5 flex flex-col items-center" key={`dna-${step}`}>
        <ScentDnaOrb dna={dna} size={88} />
        <p className="mt-1.5 text-[11px] font-bold uppercase tracking-[0.2em] text-stone-400">
          🧬 Your scent DNA {step === 0 ? 'is awakening' : 'is forming'}
        </p>
      </div>

      {/* mid-quiz archetype teaser */}
      {showTeaser && (
        <div className="fade-up mb-5 flex items-center gap-3 rounded-2xl border border-fuchsia-300/60 bg-gradient-to-r from-fuchsia-500/10 to-violet-500/10 p-4 dark:border-fuchsia-700/50">
          <span className="text-3xl">{liveArchetype.emoji}</span>
          <p className="text-sm leading-snug">
            <span className="font-bold">🔮 You’re shaping up to be {liveArchetype.name}…</span>
            <span className="text-stone-500 dark:text-stone-400"> {liveArchetype.tagline}</span>
          </p>
        </div>
      )}

      <div key={step} className="finder-step">
        <h1 className="font-display text-[26px] font-extrabold leading-tight tracking-tight sm:text-3xl">
          {s.title}
        </h1>
        {s.sub && <p className="mt-1.5 text-[15px] text-stone-500 dark:text-stone-400">{s.sub}</p>}

        <div className="mt-6">
          {s.id === 'loved' && (
            notes.length === 0 ? <Skeleton className="h-64" /> : (
              <NotePicker notes={notes} selected={answers.lovedNotes}
                onToggle={(n) => set('lovedNotes', toggleIn(answers.lovedNotes, n, 10))}
                min={3} max={10} />
            )
          )}

          {s.id === 'hated' && (
            notes.length === 0 ? <Skeleton className="h-64" /> : (
              <NotePicker notes={notes} selected={answers.hatedNotes}
                onToggle={(n) => set('hatedNotes', toggleIn(answers.hatedNotes, n, 10))}
                min={0} max={10} excludeMode />
            )
          )}

          {s.id === 'houses' && (
            houses.length === 0 ? <Skeleton className="h-64" /> : (
              <HousePicker houses={houses} selected={answers.houses}
                onToggle={(h) => set('houses', toggleIn(answers.houses, h))} />
            )
          )}

          {s.id === 'longevity' && (
            <Card className="p-5">
              <BigSlider value={answers.longevity} onChange={(v) => set('longevity', v)}
                min={1} max={5} labels={LONGEVITY_LABELS}
                format={(v) => LONGEVITY_LABELS[v]} />
              <p className="mt-3 text-center text-[13px] text-stone-500">
                How many hours should one application last on your skin?
              </p>
            </Card>
          )}

          {s.id === 'sillage' && (
            <Card className="p-5">
              <BigSlider value={answers.sillage} onChange={(v) => set('sillage', v)}
                min={1} max={5} labels={SILLAGE_LABELS}
                format={(v) => SILLAGE_LABELS[v]} />
              <p className="mt-3 text-center text-[13px] text-stone-500">
                Intimate = only hugs smell it. Beast mode = the room knows.
              </p>
            </Card>
          )}

          {s.id === 'occasions' && (
            <div className="flex flex-wrap gap-2">
              {OCCASIONS.map((o) => (
                <Chip key={o.v} active={answers.occasions.includes(o.v)}
                  onClick={() => set('occasions', toggleIn(answers.occasions, o.v))}
                  className="px-4 py-2.5 text-[15px]">
                  {o.label}
                </Chip>
              ))}
            </div>
          )}

          {s.id === 'budget' && (
            <Card className="p-5">
              <BigSlider value={budgetToSlider(answers.budget)} onChange={(v) => set('budget', sliderToBudget(v))}
                min={0} max={10} labels={[]}
                format={() => inr(answers.budget)} />
              <div className="mt-1 flex justify-between text-[11px] font-medium text-stone-400">
                <span>₹500</span><span>₹50,000</span>
              </div>
              <p className="mt-3 text-center text-[13px] text-stone-500">
                Maximum you'd pay for a bottle, in INR.
              </p>
            </Card>
          )}

          {s.id === 'gender' && (
            <div className="grid grid-cols-2 gap-3">
              {GENDERS.map((g) => (
                <button
                  key={g.v}
                  onClick={() => set('gender', g.v)}
                  className={cn(
                    'rounded-2xl border-2 p-5 text-center transition-all active:scale-95',
                    answers.gender === g.v
                      ? 'chip-pop border-violet-600 bg-violet-50 dark:border-violet-400 dark:bg-violet-950/40'
                      : 'border-stone-200 bg-white dark:border-ink-700 dark:bg-ink-900'
                  )}
                >
                  <p className="text-lg font-bold">{g.label}</p>
                  {g.desc && <p className="mt-1 text-xs text-stone-500">{g.desc}</p>}
                </button>
              ))}
            </div>
          )}

          {s.id === 'clone' && (
            <div className="space-y-3">
              {CLONE_PREFS.map((c) => (
                <button
                  key={c.v}
                  onClick={() => set('clonePref', c.v)}
                  className={cn(
                    'flex w-full items-center gap-4 rounded-2xl border-2 p-4 text-left transition-all active:scale-[0.99]',
                    answers.clonePref === c.v
                      ? 'chip-pop border-violet-600 bg-violet-50 dark:border-violet-400 dark:bg-violet-950/40'
                      : 'border-stone-200 bg-white dark:border-ink-700 dark:bg-ink-900'
                  )}
                >
                  <span className="text-3xl">{c.icon}</span>
                  <span>
                    <span className="block text-[16px] font-bold">{c.label}</span>
                    <span className="block text-[13px] text-stone-500">{c.desc}</span>
                  </span>
                </button>
              ))}
            </div>
          )}

          {s.id === 'concentration' && (
            <div className="grid grid-cols-2 gap-3">
              {CONCENTRATIONS.map((c) => {
                const active = answers.concentration.includes(c.v);
                return (
                  <button
                    key={c.v}
                    onClick={() => set('concentration', toggleIn(answers.concentration, c.v))}
                    className={cn(
                      'rounded-2xl border-2 p-4 text-left transition-all active:scale-95',
                      active
                        ? 'chip-pop border-violet-600 bg-violet-50 dark:border-violet-400 dark:bg-violet-950/40'
                        : 'border-stone-200 bg-white dark:border-ink-700 dark:bg-ink-900'
                    )}
                  >
                    <p className="font-bold">{c.label}</p>
                    <p className="mt-0.5 text-xs text-stone-500">{c.desc}</p>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {error && (
          <p className="mt-4 rounded-xl bg-rose-50 p-3 text-sm text-rose-700 dark:bg-rose-950/40 dark:text-rose-300">
            {error}
          </p>
        )}
      </div>

      {/* sticky bottom nav — the only bottom chrome during the wizard.
          z-[70] keeps it above page content; the site footer + mobile nav
          are hidden via body[data-finder-phase] while answering. */}
      <div className="fixed inset-x-0 bottom-0 z-[70] border-t border-stone-200 bg-white/95 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur dark:border-ink-700 dark:bg-ink-950/95">
        <div className="mx-auto flex max-w-xl items-center gap-3 px-4">
          {step > 0 ? (
            <Button variant="outline" onClick={goBack} className="min-h-[52px] shrink-0 touch-manipulation px-5">← Back</Button>
          ) : (
            <Button variant="outline" onClick={() => setPhase('entry')} aria-label="Back to start"
              className="min-h-[52px] shrink-0 touch-manipulation px-5">✕</Button>
          )}
          <Button
            onClick={goNext}
            disabled={!canContinue}
            className="btn-shimmer min-h-[52px] flex-1 touch-manipulation py-3 text-[16px] shadow-lg shadow-violet-600/30 transition-all duration-150 active:scale-[0.97] disabled:shadow-none"
          >
            {step === STEPS.length - 1 ? '✨ Reveal my scents' : 'Continue →'}
          </Button>
          {s.skippable && step < STEPS.length - 1 && (
            <button onClick={goNext} className="shrink-0 text-sm font-semibold text-stone-400 underline">
              Skip
            </button>
          )}
        </div>
        {!canContinue && (
          <p className="mt-1.5 text-center text-xs font-medium text-violet-600 dark:text-violet-300">
            {s.id === 'loved' && `Pick ${3 - answers.lovedNotes.length} more note${3 - answers.lovedNotes.length === 1 ? '' : 's'} to continue`}
            {s.id === 'occasions' && 'Pick at least one occasion'}
          </p>
        )}
      </div>
    </div>
  );
}

/* ---------------- results view ---------------- */

function ResultsView({ out, answers, reset, topRef }: {
  out: ApiOut; answers: Answers; reset: () => void;
  topRef: React.RefObject<HTMLDivElement | null>;
}) {
  const [top, ...rest] = out.results;
  const [expanded, setExpanded] = useState<string | null>(top?.id ?? null);
  const [copied, setCopied] = useState(false);
  const arch = useMemo(() => archetypeFromAnswers(answers), [answers]);
  const dna = useMemo(() => dnaFromAnswers(answers, 1), [answers]);
  const companions = rest.slice(0, 2);

  const doShare = async () => {
    const url = typeof window !== 'undefined' ? `${window.location.origin}/finder#p=${encodeAnswers(answers)}` : '';
    const text =
      `🔮 I'm ${arch.name} ${arch.emoji}\n` +
      `Loves: ${answers.lovedNotes.slice(0, 5).join(', ')}\n` +
      (top ? `Top match: ${top.name} (${top.score}%)\n` : '') +
      `Find your scent personality → ${url}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: 'My Scent Personality — Scentiqa', text, url });
      } else {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch {
      try {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch { /* noop */ }
    }
  };

  return (
    <div ref={topRef} className="mx-auto max-w-3xl px-4 pb-24 pt-6 sm:px-6">
      <FinderStyles />
      <div className="mb-6 text-center">
        <p className="mb-1 text-[11px] font-bold uppercase tracking-[0.18em] text-violet-600 dark:text-violet-300">
          ✨ AI Scent Finder
        </p>
        <h1 className="fade-up font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
          Your scent personality,<br className="sm:hidden" /> revealed
        </h1>
      </div>

      {/* archetype reveal — the shock moment */}
      <div className="mb-6">
        <ArchetypeCard arch={arch} dna={dna} delay={0.15} />
      </div>

      {out.relaxed && (
        <div className="mb-5 rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
          {out.relaxed}
        </div>
      )}

      {out.results.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-4xl">🔍</p>
          <h2 className="mt-3 font-display text-xl font-bold">No matches found</h2>
          <p className="mx-auto mt-2 max-w-sm text-sm text-stone-500">
            Your combination is extremely rare — even for {arch.name}. Try removing a hated note, widening the budget, or picking fewer houses.
          </p>
          <Button className="mt-5" onClick={reset}>Retake the journey</Button>
        </Card>
      ) : (
        <>
          {/* top pick spotlight */}
          {top && (
            <div className="fade-up" style={{ animationDelay: '.55s' }}>
              <Card className="mb-5 overflow-hidden">
                <div className="bg-gradient-to-br from-violet-600/10 via-fuchsia-500/10 to-gold-500/10 p-5 sm:p-7">
                  <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.2em] text-violet-600 dark:text-violet-300">
                    🏆 Your #1 match
                  </p>
                  <div className="flex items-center gap-5">
                    <ScoreRing score={top.score} size={96} />
                    <div className="min-w-0 flex-1">
                      <Link href={`/perfume/${top.slug}`} className="hover:underline">
                        <h2 className="font-display text-2xl font-extrabold leading-tight">{top.name}</h2>
                      </Link>
                      <p className="text-sm text-stone-500">{top.house} · {top.concentration || 'EDP'}</p>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        {top.lowestPriceInr ? (
                          <span className="text-lg font-extrabold">{inr(top.lowestPriceInr)}</span>
                        ) : null}
                        {top.isDupe && (
                          <span className="rounded-full bg-gold-600/15 px-2.5 py-0.5 text-[11px] font-bold text-gold-700 dark:text-gold-300">
                            DUPE — great value
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="mt-4">
                    <ConfidenceMeter score={top.score} />
                  </div>
                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {top.reasons.slice(0, 4).map((r, i) => (
                      <span key={i} className="rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                        ✓ {r}
                      </span>
                    ))}
                  </div>
                  <WhyMatch result={top} expanded={expanded === top.id} onToggle={() => setExpanded(expanded === top.id ? null : top.id)} />
                  <Link href={`/perfume/${top.slug}`}>
                    <Button className="mt-4 w-full sm:w-auto">View full details →</Button>
                  </Link>
                </div>
              </Card>
            </div>
          )}

          {/* archetype companions */}
          {companions.length > 0 && (
            <div className="fade-up mb-8" style={{ animationDelay: '.75s' }}>
              <h3 className="mb-1 font-display text-lg font-bold">
                {arch.emoji} Others with your archetype also loved
              </h3>
              <p className="mb-3 text-[13px] text-stone-500">
                Fellow {arch.name}s with taste like yours rated these highly.
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                {companions.map((r) => (
                  <Link key={r.id} href={`/perfume/${r.slug}`}>
                    <Card hover className="flex items-center gap-3 p-4">
                      <ScoreRing score={r.score} size={52} />
                      <div className="min-w-0">
                        <p className="truncate font-display text-[15px] font-bold">{r.name}</p>
                        <p className="truncate text-xs text-stone-500">{r.house}</p>
                        {r.lowestPriceInr ? (
                          <p className="mt-0.5 text-[13px] font-extrabold">{inr(r.lowestPriceInr)}</p>
                        ) : null}
                      </div>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* rest of ranking */}
          {rest.slice(2).length > 0 && (
            <div className="mb-8">
              <h3 className="mb-3 font-display text-lg font-bold">More matches, ranked</h3>
              <div className="space-y-3">
                {rest.slice(2).map((r, i) => (
                  <Card key={r.id} className="p-4">
                    <div className="flex items-center gap-4">
                      <span className="w-7 shrink-0 text-center font-display text-lg font-extrabold text-stone-300 dark:text-stone-600">
                        {i + 4}
                      </span>
                      <ScoreRing score={r.score} size={56} />
                      <div className="min-w-0 flex-1">
                        <Link href={`/perfume/${r.slug}`} className="block truncate font-display text-[17px] font-bold hover:underline">
                          {r.name}
                        </Link>
                        <p className="truncate text-[13px] text-stone-500">{r.house}</p>
                        <div className="mt-1.5 flex flex-wrap gap-1">
                          {r.reasons.slice(0, 2).map((reason, j) => (
                            <span key={j} className="rounded-full bg-stone-100 px-2 py-0.5 text-[11px] font-medium text-stone-600 dark:bg-ink-800 dark:text-stone-300">
                              ✓ {reason}
                            </span>
                          ))}
                          {r.lowestPriceInr ? (
                            <span className="rounded-full bg-stone-100 px-2 py-0.5 text-[11px] font-bold text-stone-700 dark:bg-ink-800 dark:text-stone-200">
                              {inr(r.lowestPriceInr)}
                            </span>
                          ) : null}
                        </div>
                      </div>
                      <Link href={`/perfume/${r.slug}`} className="shrink-0">
                        <Button size="sm" variant="outline">View</Button>
                      </Link>
                    </div>
                    <WhyMatch result={r} expanded={expanded === r.id} onToggle={() => setExpanded(expanded === r.id ? null : r.id)} compact />
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* wildcard */}
          {out.wildcard && (
            <Card className="mb-8 border-2 border-dashed border-fuchsia-400 p-5 dark:border-fuchsia-700">
              <p className="mb-1 text-[11px] font-bold uppercase tracking-[0.18em] text-fuchsia-600 dark:text-fuchsia-300">
                🎲 Feeling lucky — wildcard pick
              </p>
              <div className="flex items-center gap-4">
                <ScoreRing score={out.wildcard.pick.score} size={64} />
                <div className="min-w-0 flex-1">
                  <Link href={`/perfume/${out.wildcard.pick.slug}`} className="font-display text-lg font-bold hover:underline">
                    {out.wildcard.pick.name}
                  </Link>
                  <p className="text-sm text-stone-500">{out.wildcard.pick.house}</p>
                </div>
                <Link href={`/perfume/${out.wildcard.pick.slug}`} className="shrink-0">
                  <Button size="sm">View</Button>
                </Link>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-stone-600 dark:text-stone-300">
                {out.wildcard.explanation}
              </p>
            </Card>
          )}

          {/* shareable scent personality card */}
          <Card className="mb-8 overflow-hidden">
            <div className="relative p-5 text-white sm:p-6"
              style={{ background: `linear-gradient(135deg, hsl(${Math.round(arch.hue)} 45% 13%) 0%, hsl(${(Math.round(arch.hue) + 40) % 360} 52% 24%) 100%)` }}>
              <div className="pointer-events-none absolute right-3 top-3 opacity-40" aria-hidden>
                <ScentDnaOrb dna={dna} size={92} />
              </div>
              <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.2em] text-white/60">
                🔮 My Scent Personality
              </p>
              <div className="flex items-center gap-3">
                <span className="text-4xl">{arch.emoji}</span>
                <div>
                  <p className="font-display text-2xl font-extrabold">{arch.name}</p>
                  <p className="text-[13px] italic text-white/75">“{arch.tagline}”</p>
                </div>
              </div>
              <div className="mt-4 space-y-2.5 text-sm">
                <ProfileRow label="Loves" value={answers.lovedNotes.slice(0, 6).join(', ') || '—'} />
                {answers.hatedNotes.length > 0 && <ProfileRow label="Avoids" value={answers.hatedNotes.slice(0, 4).join(', ')} />}
                <ProfileRow label="Wears" value={`${LONGEVITY_LABELS[answers.longevity]} · ${SILLAGE_LABELS[answers.sillage]}`} />
                <ProfileRow label="Budget" value={`up to ${inr(answers.budget)}`} />
                {out.tensions.slice(0, 1).map((t, i) => (
                  <p key={i} className="rounded-xl bg-white/10 p-3 text-[13px] leading-relaxed text-white/85">
                    ⚡ {t}
                  </p>
                ))}
                {top && (
                  <p className="pt-1 text-[13px] text-white/90">
                    Top match: <strong>{top.name}</strong> by {top.house} — {top.score}% fit
                  </p>
                )}
              </div>
              <p className="mt-4 text-center text-[11px] uppercase tracking-[0.2em] text-white/40">
                scentiqa · india's perfume encyclopedia
              </p>
            </div>
            <div className="flex gap-2 p-4">
              <Button className="btn-shimmer flex-1" onClick={doShare}>
                {copied ? '✓ Copied!' : '📤 Share my personality'}
              </Button>
              <Button variant="outline" onClick={reset}>↺ Retake</Button>
            </div>
          </Card>

          <div className="text-center">
            <p className="text-xs text-stone-400">
              Ranked from {out.totalScored.toLocaleString()} perfumes · scores update as the catalog grows
            </p>
          </div>
        </>
      )}
    </div>
  );
}

/* ---------------- result helpers ---------------- */

function WhyMatch({ result, expanded, onToggle, compact }: {
  result: Result; expanded: boolean; onToggle: () => void; compact?: boolean;
}) {
  return (
    <div className={cn(!compact && 'mt-4')}>
      <p className="text-[13px] font-bold text-stone-700 dark:text-stone-200">
        🧠 Why the AI picked this <span className="font-medium text-stone-400">— your answers, matched</span>
      </p>
      <div className="mt-2 space-y-1.5 rounded-xl bg-stone-50 p-3 dark:bg-ink-800">
        {result.breakdown.map((b) => (
          <div key={b.key} className="flex items-center gap-2 text-xs">
            <span className="w-32 shrink-0 font-medium text-stone-500 dark:text-stone-400">{b.label}</span>
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-stone-200 dark:bg-ink-700">
              <div className="h-full rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 transition-all duration-1000"
                style={{ width: `${(b.points / b.max) * 100}%` }} />
            </div>
            <span className="w-10 shrink-0 text-right font-bold">{b.points}/{b.max}</span>
          </div>
        ))}
        {result.matchedLovedNotes.length > 0 && (
          <p className="pt-1 text-xs text-stone-500">
            💜 Your notes in this scent: {result.matchedLovedNotes.join(', ')}
          </p>
        )}
        <p className="text-xs text-stone-500">
          ⏱️ Predicted: {result.predictedLongevity}/5 longevity · {result.predictedSillage}/5 projection
        </p>
        {result.relaxed && <p className="text-xs text-amber-600">⚠️ {result.relaxed}</p>}
      </div>
      <button onClick={onToggle}
        className="mt-2 flex items-center gap-1 text-[13px] font-semibold text-violet-600 dark:text-violet-300">
        {expanded ? '▾ Show less' : '▸ Full score audit'}
      </button>
      {expanded && (
        <p className="mt-1 text-xs leading-relaxed text-stone-500 dark:text-stone-400">
          Every point above comes from your answers — nothing random, nothing sponsored.
          The AI scored {result.breakdown.reduce((s, b) => s + b.max, 0)} possible points across
          notes, scent character, longevity, projection, budget and brand preference.
        </p>
      )}
    </div>
  );
}

function ProfileRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-3">
      <span className="w-16 shrink-0 pt-0.5 text-[11px] font-bold uppercase tracking-wider text-white/50">{label}</span>
      <span className="text-white/90">{value}</span>
    </div>
  );
}

function LoadingLine() {
  const [i, setI] = useState(0);
  const lines = [
    'Reading your note preferences…',
    'Comparing 6,600+ perfumes…',
    'Checking Indian prices…',
    'Scoring longevity & projection…',
    'Ranking your perfect matches…',
  ];
  useEffect(() => {
    const t = setInterval(() => setI((v) => (v + 1) % lines.length), 1400);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return <p className="mt-3 text-sm text-stone-500 dark:text-stone-400">{lines[i]}</p>;
}

// budget slider: 0..10 maps to 500..50000 on a curve
function budgetToSlider(b: number): number {
  const steps = [500, 1000, 1500, 2000, 3000, 5000, 8000, 12000, 20000, 35000, 50000];
  let best = 0;
  steps.forEach((s, i) => { if (Math.abs(s - b) < Math.abs(steps[best] - b)) best = i; });
  return best;
}
function sliderToBudget(s: number): number {
  return [500, 1000, 1500, 2000, 3000, 5000, 8000, 12000, 20000, 35000, 50000][s] ?? 5000;
}
