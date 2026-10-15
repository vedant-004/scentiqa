'use client';
import { useState } from 'react';
import Link from 'next/link';
import { ProductImage } from '@/components/domain';
import { cn } from '@/lib/utils';
import type { AffinityProfile } from '@/lib/weather-occasions';

export interface Pick {
  id: string; slug: string; name: string; house: string; houseSlug: string;
  gender: string | null; concentration: string | null; image: string | null;
  price: number | null; rating: number | null;
  match: number; matchedAccords: string[]; heatScore: number; longevityHrs: number;
}

interface Props {
  profiles: AffinityProfile[];
  endpoint: string;
  storageKey: string;
  selectLabel: string;
  showLongevityFilter?: boolean;
}

const inputCls = 'w-full rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm text-stone-900 dark:border-white/10 dark:bg-ink-900 dark:text-white';

export function PickFinder({ profiles, endpoint, storageKey, selectLabel, showLongevityFilter }: Props) {
  const [selected, setSelected] = useState<string | null>(null);
  const [budget, setBudget] = useState('');
  const [gender, setGender] = useState('any');
  const [minLong, setMinLong] = useState(0);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [picks, setPicks] = useState<Pick[]>([]);
  const [total, setTotal] = useState(0);
  const [doneFor, setDoneFor] = useState<string | null>(null);

  const profile = profiles.find((p) => p.id === selected) ?? null;

  const find = async () => {
    if (!selected) { setErr(`Please ${selectLabel.toLowerCase()} first.`); return; }
    setErr(null); setLoading(true);
    try {
      const r = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          [storageKey]: selected,
          maxBudget: budget.trim() ? Number(budget) : undefined,
          minLongevity: showLongevityFilter && minLong > 0 ? minLong : undefined,
          gender,
        }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error ?? 'Failed to get picks');
      setPicks(j.picks ?? []); setTotal(j.total ?? 0); setDoneFor(selected);
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Failed to get picks');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {/* Profile picker */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {profiles.map((p) => (
          <button key={p.id} onClick={() => { setSelected(p.id); setErr(null); }}
            className={cn('rounded-2xl border p-4 text-left transition-all',
              selected === p.id
                ? 'border-[#F01348] bg-[#F01348]/10 shadow-card dark:border-[#F01348]'
                : 'border-stone-200 bg-white hover:border-stone-300 dark:border-white/10 dark:bg-white/[0.03] dark:hover:border-white/20')}>
            <span className="block text-sm font-bold text-stone-900 dark:text-white">{p.label}</span>
          </button>
        ))}
      </div>
      {profile && (
        <p className="mt-3 rounded-xl bg-stone-100 px-4 py-3 text-sm leading-relaxed text-stone-600 dark:bg-white/[0.04] dark:text-stone-300">
          <strong className="text-stone-800 dark:text-stone-100">{profile.label}:</strong> {profile.blurb}
        </p>
      )}

      {/* Filters */}
      <div className="mt-5 grid gap-3 rounded-2xl border border-stone-200 bg-white p-4 sm:grid-cols-3 dark:border-white/10 dark:bg-white/[0.03]">
        <label className="block text-sm font-semibold">Max budget (₹)
          <input value={budget} onChange={(e) => setBudget(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
            inputMode="numeric" placeholder="e.g. 3000" className={cn(inputCls, 'mt-1')} />
        </label>
        <div className="block text-sm font-semibold">For
          <div className="mt-1 flex gap-2">
            {[['any', 'Anyone'], ['men', 'Men'], ['women', 'Women'], ['unisex', 'Unisex']].map(([v, l]) => (
              <button key={v} onClick={() => setGender(v)}
                className={cn('flex-1 rounded-xl border px-2 py-2 text-xs font-bold transition-colors',
                  gender === v ? 'border-[#F01348] bg-[#F01348]/10 text-stone-900 dark:text-white' : 'border-stone-200 text-stone-500 dark:border-white/10 dark:text-stone-400')}>
                {l}
              </button>
            ))}
          </div>
        </div>
        {showLongevityFilter ? (
          <div className="block text-sm font-semibold">Lasts at least
            <div className="mt-1 flex gap-2">
              {[[0, 'Any'], [4, '4h+'], [6, '6h+'], [8, '8h+']].map(([v, l]) => (
                <button key={v} onClick={() => setMinLong(v as number)}
                  className={cn('flex-1 rounded-xl border px-2 py-2 text-xs font-bold transition-colors',
                    minLong === v ? 'border-[#F01348] bg-[#F01348]/10 text-stone-900 dark:text-white' : 'border-stone-200 text-stone-500 dark:border-white/10 dark:text-stone-400')}>
                  {l}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex items-end">
            <button onClick={find} disabled={loading || !selected}
              className="w-full rounded-xl bg-[#F01348] px-5 py-2.5 text-sm font-bold text-white transition-all hover:brightness-110 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50">
              {loading ? 'Finding…' : 'Find my scents'}
            </button>
          </div>
        )}
      </div>
      {showLongevityFilter && (
        <button onClick={find} disabled={loading || !selected}
          className="mt-4 w-full rounded-xl bg-[#F01348] px-5 py-3 text-sm font-bold text-white transition-all hover:brightness-110 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto sm:px-10">
          {loading ? 'Finding…' : 'Find my scents'}
        </button>
      )}

      {err && <p className="mt-4 text-sm font-semibold text-red-600 dark:text-red-400">{err}</p>}

      {/* Results */}
      {doneFor && !loading && (
        <div className="mt-8">
          <h2 className="mb-1 font-display text-xl font-bold">
            Top picks for {profiles.find((p) => p.id === doneFor)?.label}
          </h2>
          <p className="mb-4 text-xs text-stone-400">
            {total} matching scents · Match % and longevity are estimates from accord profiles, not lab measurements.
          </p>
          {picks.length === 0 ? (
            <p className="rounded-2xl border border-stone-200 p-6 text-center text-sm text-stone-500 dark:border-white/10 dark:text-stone-400">
              No scents matched these filters — try a higher budget or fewer filters.
            </p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {picks.map((p, i) => (
                <Link key={p.id} href={`/perfumes/${p.slug}`}
                  className="group rounded-2xl border border-stone-200 bg-white p-4 transition-all hover:shadow-card dark:border-white/10 dark:bg-white/[0.03]">
                  <div className="flex gap-3">
                    <div className="shrink-0">
                      <ProductImage name={p.name} house={p.house} image={p.image} size="sm" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[11px] font-bold uppercase tracking-wide text-stone-400">#{i + 1} · {Math.round(p.match)}% match</p>
                      <p className="mt-0.5 truncate text-sm font-bold text-stone-900 group-hover:underline dark:text-white">{p.name}</p>
                      <p className="truncate text-xs text-stone-500">{p.house}</p>
                      <div className="mt-1.5 flex flex-wrap gap-1">
                        {p.matchedAccords.map((a) => (
                          <span key={a} className="rounded-full bg-[#F01348]/10 px-2 py-0.5 text-[10px] font-bold text-[#F01348] dark:text-rose-300">{a}</span>
                        ))}
                      </div>
                      <p className="mt-1.5 text-xs text-stone-500 dark:text-stone-400">
                        {p.price !== null ? <strong className="text-stone-800 dark:text-stone-100">₹{p.price.toLocaleString('en-IN')}</strong> : 'Price not listed'}
                        {' · '}⏱ ~{p.longevityHrs}h est.
                        {' · '}🔥 {Math.round(p.heatScore)}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
