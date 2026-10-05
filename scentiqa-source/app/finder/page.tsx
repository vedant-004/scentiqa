// AI Scent Finder — Scentiqa's flagship. A 10-step scent profiling wizard
// with precision-ranked, explainable recommendations.
// Mobile-first, premium feel.
'use client';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { cn, inr } from '@/lib/utils';
import { Button, Card, Skeleton } from '@/components';
import { PerfumeCard } from '@/components/domain';

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

/* ---------------- small components ---------------- */

function ProgressBar({ step, total }: { step: number; total: number }) {
  return (
    <div className="mb-6">
      <div className="mb-2 flex items-center justify-between text-xs font-semibold">
        <span className="uppercase tracking-[0.14em] text-gold-600 dark:text-gold-400">AI Scent Finder</span>
        <span className="text-stone-400">{step + 1} / {total}</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-stone-200 dark:bg-ink-700">
        <div
          className="h-full rounded-full bg-gradient-to-r from-violet-600 via-fuchsia-500 to-gold-500 transition-all duration-500 ease-out"
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
          ? 'border-violet-600 bg-violet-600 text-white shadow-md shadow-violet-600/25 dark:border-violet-400 dark:bg-violet-500'
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
                'flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold text-white shadow active:scale-95',
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
                        ? excludeMode
                          ? 'border-rose-500 bg-rose-500 font-semibold text-white shadow'
                          : 'border-violet-600 bg-violet-600 font-semibold text-white shadow dark:bg-violet-500'
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
                className="flex items-center gap-1.5 rounded-full bg-violet-600 px-3 py-1.5 text-sm font-semibold text-white active:scale-95">
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
                  active ? 'border-violet-600 bg-violet-600 text-white' : 'border-stone-300 text-transparent'
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

/* ---------------- main page ---------------- */

const DEFAULTS: Answers = {
  lovedNotes: [], hatedNotes: [], houses: [],
  longevity: 3, sillage: 3, occasions: [],
  budget: 5000, gender: 'any', clonePref: 'any', concentration: [],
};

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
  const [phase, setPhase] = useState<'wizard' | 'loading' | 'results'>('wizard');
  const [out, setOut] = useState<ApiOut | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const topRef = useRef<HTMLDivElement>(null);

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
    // shared profile via #p=...
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
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || 'Something went wrong');
      setOut(j);
      setPhase('results');
    } catch (e: any) {
      setError(e.message || 'Failed to get recommendations');
      setPhase('wizard');
    }
    topRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  const reset = () => {
    setAnswers(DEFAULTS);
    setStep(0);
    setOut(null);
    setPhase('wizard');
    if (typeof window !== 'undefined') window.location.hash = '';
  };

  const shareProfile = async () => {
    const url = `${window.location.origin}/finder#p=${encodeAnswers(answers)}`;
    const text = `My Scent Profile 🌸\nLoves: ${answers.lovedNotes.join(', ')}\nBudget: ₹${answers.budget.toLocaleString('en-IN')} · ${LONGEVITY_LABELS[answers.longevity]} wear\nTop match: ${out?.results[0] ? `${out.results[0].name} (${out.results[0].score}%)` : '—'}\n${url}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: 'My Scent Profile — Scentiqa', text, url });
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

  /* ---------- results phase ---------- */
  if (phase === 'results' && out) {
    const [top, ...rest] = out.results;
    return (
      <div ref={topRef} className="mx-auto max-w-3xl px-4 pb-24 pt-6 sm:px-6">
        {/* header */}
        <div className="mb-6 text-center">
          <p className="mb-1 text-[11px] font-bold uppercase tracking-[0.18em] text-violet-600 dark:text-violet-300">
            ✨ AI Scent Finder
          </p>
          <h1 className="font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
            Your scent matches
          </h1>
          <p className="mx-auto mt-2 max-w-md text-sm text-stone-500 dark:text-stone-400">
            Ranked from {out.totalScored.toLocaleString()} perfumes by how precisely they fit your profile.
          </p>
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
              Your combination is extremely rare. Try removing a hated note, widening the budget, or picking fewer houses.
            </p>
            <Button className="mt-5" onClick={() => setPhase('wizard')}>Adjust my answers</Button>
          </Card>
        ) : (
          <>
            {/* top pick spotlight */}
            {top && (
              <Card className="mb-6 overflow-hidden">
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
            )}

            {/* rest of ranking */}
            {rest.length > 0 && (
              <div className="mb-8">
                <h3 className="mb-3 font-display text-lg font-bold">More matches, ranked</h3>
                <div className="space-y-3">
                  {rest.map((r, i) => (
                    <Card key={r.id} className="p-4">
                      <div className="flex items-center gap-4">
                        <span className="w-7 shrink-0 text-center font-display text-lg font-extrabold text-stone-300 dark:text-stone-600">
                          {i + 2}
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

            {/* scent profile card — shareable */}
            <Card className="mb-8 overflow-hidden">
              <div className="bg-gradient-to-br from-stone-900 to-violet-950 p-5 text-white sm:p-6">
                <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.2em] text-gold-400">
                  🌸 My Scent Profile
                </p>
                <div className="space-y-2.5 text-sm">
                  <ProfileRow label="Loves" value={answers.lovedNotes.join(', ') || '—'} />
                  {answers.hatedNotes.length > 0 && <ProfileRow label="Avoids" value={answers.hatedNotes.join(', ')} />}
                  <ProfileRow label="Wears" value={`${LONGEVITY_LABELS[answers.longevity]} · ${SILLAGE_LABELS[answers.sillage]} projection`} />
                  <ProfileRow label="Budget" value={`up to ${inr(answers.budget)}`} />
                  {answers.houses.length > 0 && <ProfileRow label="Houses" value={answers.houses.length + ' picked'} />}
                  {out.tensions.map((t, i) => (
                    <p key={i} className="rounded-xl bg-white/10 p-3 text-[13px] leading-relaxed text-violet-100">
                      ⚡ {t}
                    </p>
                  ))}
                  {top && (
                    <p className="pt-1 text-[13px] text-gold-200">
                      Top match: <strong>{top.name}</strong> by {top.house} — {top.score}% fit
                    </p>
                  )}
                </div>
                <p className="mt-4 text-center text-[11px] uppercase tracking-[0.2em] text-white/40">
                  scentiqa · india's perfume encyclopedia
                </p>
              </div>
              <div className="flex gap-2 p-4">
                <Button className="flex-1" onClick={shareProfile}>
                  {copied ? '✓ Copied!' : '📤 Share my profile'}
                </Button>
                <Button variant="outline" onClick={() => setPhase('wizard')}>Adjust</Button>
              </div>
            </Card>

            <div className="text-center">
              <Button variant="ghost" onClick={reset}>↺ Start over</Button>
            </div>
          </>
        )}
      </div>
    );
  }

  /* ---------- loading phase ---------- */
  if (phase === 'loading') {
    return (
      <div ref={topRef} className="mx-auto flex min-h-[70vh] max-w-md flex-col items-center justify-center px-6 text-center">
        <div className="relative mb-6">
          <div className="h-20 w-20 animate-spin rounded-full border-4 border-violet-200 border-t-violet-600 dark:border-ink-700 dark:border-t-violet-400" />
          <span className="absolute inset-0 flex items-center justify-center text-3xl">🌸</span>
        </div>
        <h2 className="font-display text-2xl font-extrabold">Analyzing your taste…</h2>
        <LoadingLine />
      </div>
    );
  }

  /* ---------- wizard phase ---------- */
  const s = STEPS[step];
  return (
    <div ref={topRef} className="mx-auto max-w-xl px-4 pb-32 pt-6 sm:px-6">
      <style>{`
        @keyframes finderIn { from { opacity: 0; transform: translateX(28px); } to { opacity: 1; transform: translateX(0); } }
        .finder-step { animation: finderIn .32s cubic-bezier(.22,.9,.3,1); }
      `}</style>

      <ProgressBar step={step} total={STEPS.length} />

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
                      ? 'border-violet-600 bg-violet-50 dark:border-violet-400 dark:bg-violet-950/40'
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
                      ? 'border-violet-600 bg-violet-50 dark:border-violet-400 dark:bg-violet-950/40'
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
                        ? 'border-violet-600 bg-violet-50 dark:border-violet-400 dark:bg-violet-950/40'
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

      {/* sticky bottom nav */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-stone-200 bg-white/95 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur dark:border-ink-700 dark:bg-ink-950/95">
        <div className="mx-auto flex max-w-xl items-center gap-3 px-4">
          {step > 0 ? (
            <Button variant="outline" onClick={goBack} className="shrink-0">← Back</Button>
          ) : (
            <Link href="/" className="shrink-0"><Button variant="outline">✕</Button></Link>
          )}
          <Button onClick={goNext} disabled={!canContinue} className="flex-1 py-3 text-[16px]">
            {step === STEPS.length - 1
              ? '✨ Find my scents'
              : s.skippable
                ? 'Continue →'
                : 'Continue →'}
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

/* ---------------- result helpers ---------------- */

function WhyMatch({ result, expanded, onToggle, compact }: {
  result: Result; expanded: boolean; onToggle: () => void; compact?: boolean;
}) {
  return (
    <div className={cn(!compact && 'mt-4')}>
      <button onClick={onToggle}
        className="mt-2 flex items-center gap-1 text-[13px] font-semibold text-violet-600 dark:text-violet-300">
        {expanded ? '▾ Hide' : '▸'} Why this matches
      </button>
      {expanded && (
        <div className="mt-2 space-y-1.5 rounded-xl bg-stone-50 p-3 dark:bg-ink-800">
          {result.breakdown.map((b) => (
            <div key={b.key} className="flex items-center gap-2 text-xs">
              <span className="w-32 shrink-0 font-medium text-stone-500 dark:text-stone-400">{b.label}</span>
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-stone-200 dark:bg-ink-700">
                <div className="h-full rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500"
                  style={{ width: `${(b.points / b.max) * 100}%` }} />
              </div>
              <span className="w-10 shrink-0 text-right font-bold">{b.points}/{b.max}</span>
            </div>
          ))}
          {result.matchedLovedNotes.length > 0 && (
            <p className="pt-1 text-xs text-stone-500">
              Matched notes: {result.matchedLovedNotes.join(', ')}
            </p>
          )}
          <p className="text-xs text-stone-500">
            Predicted: {result.predictedLongevity}/5 longevity · {result.predictedSillage}/5 projection
          </p>
          {result.relaxed && <p className="text-xs text-amber-600">⚠️ {result.relaxed}</p>}
        </div>
      )}
    </div>
  );
}

function ProfileRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-3">
      <span className="w-16 shrink-0 font-bold uppercase tracking-wider text-white/50 text-[11px] pt-0.5">{label}</span>
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
