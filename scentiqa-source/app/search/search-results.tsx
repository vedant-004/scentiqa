// Search results island: heading with count, filters + sort over the
// server-fetched result set. All filtering/sorting is client-side so it stays
// instant after the first load.
'use client';
import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Button, EmptyState, Select } from '@/components';
import { PerfumeCard } from '@/components/domain';
import type { Perfume } from '@/lib/types';
import { POPULAR_SEARCHES, suggestCorrection } from './suggest';

type SortKey = 'relevance' | 'rating' | 'reviews' | 'newest';

const SORTS: Array<{ v: SortKey; label: string }> = [
  { v: 'relevance', label: 'Most relevant' },
  { v: 'rating', label: 'Highest rated' },
  { v: 'reviews', label: 'Most reviewed' },
  { v: 'newest', label: 'Newest' },
];

const GENDERS = [
  { v: 'all', label: 'All genders' },
  { v: 'men', label: 'Men' },
  { v: 'women', label: 'Women' },
  { v: 'unisex', label: 'Unisex' },
];

const CONCS = [
  { v: 'all', label: 'All concentrations' },
  { v: 'edt', label: 'EDT' },
  { v: 'edp', label: 'EDP' },
  { v: 'parfum', label: 'Parfum' },
  { v: 'extrait', label: 'Extrait' },
];

// Matches the DB concentration tokens (edt/edp/parfum/attar) plus common spell-outs.
function concMatch(conc: string | null | undefined, v: string): boolean {
  const c = (conc ?? '').toLowerCase();
  if (!c) return false;
  if (v === 'edt') return c.includes('edt') || c.includes('toilette');
  if (v === 'edp') return /\bedp\b/.test(c) || c.includes('eau de parfum');
  if (v === 'parfum') return /\bparfum\b/.test(c) && !c.includes('extrait');
  if (v === 'extrait') return c.includes('extrait');
  return false;
}

// The backend tags each hit with which field it matched on. 'name' is the
// default and gets no tag; anything unrecognized is hidden, never rendered raw.
function matchedFieldLabel(p: Perfume): string | null {
  switch (p.matchedField) {
    case 'note':
      return 'Matched in notes';
    case 'house':
      return 'Matched house';
    case 'fuzzy':
      return 'Close match';
    default:
      return null;
  }
}

export default function SearchResults({
  results,
  query,
  didYouMean,
}: {
  results: Perfume[];
  query: string;
  /** Optional backend-provided spelling suggestion; falls back to the static map. */
  didYouMean?: string | null;
}) {
  const [house, setHouse] = useState('all');
  const [gender, setGender] = useState('all');
  const [conc, setConc] = useState('all');
  const [sort, setSort] = useState<SortKey>('relevance');

  const houses = useMemo(
    () => [...new Set(results.map((r) => r.house).filter(Boolean))].sort((a, b) => a.localeCompare(b)),
    [results],
  );

  const shown = useMemo(() => {
    let list = results;
    if (house !== 'all') list = list.filter((p) => p.house === house);
    if (gender !== 'all') list = list.filter((p) => p.gender === gender);
    if (conc !== 'all') list = list.filter((p) => concMatch(p.concentration, conc));
    const sorted = [...list];
    if (sort === 'rating') sorted.sort((a, b) => b.ratingAvg - a.ratingAvg);
    else if (sort === 'reviews') sorted.sort((a, b) => b.ratingCount - a.ratingCount);
    else if (sort === 'newest') sorted.sort((a, b) => (b.launchYear ?? -1) - (a.launchYear ?? -1));
    return sorted;
  }, [results, house, gender, conc, sort]);

  const clearAll = () => {
    setHouse('all');
    setGender('all');
    setConc('all');
    setSort('relevance');
  };
  const hasFilters = house !== 'all' || gender !== 'all' || conc !== 'all';

  // One did-you-mean line max, only when nothing matched.
  const suggestion = results.length === 0 ? didYouMean?.trim() || suggestCorrection(query) || null : null;

  return (
    <div>
      <p className="mb-1 text-[11px] font-bold uppercase tracking-[0.14em] text-gold-600 dark:text-gold-400">
        Search results
      </p>
      <h1 className="mb-5 font-display text-3xl font-bold tracking-tight text-stone-900 dark:text-white sm:text-4xl">
        Results for &ldquo;{query}&rdquo;
        <span className="ml-3 text-lg font-semibold text-stone-500 dark:text-stone-400">
          &mdash; {results.length} {results.length === 1 ? 'perfume' : 'perfumes'}
        </span>
      </h1>

      {suggestion && (
        <p className="mb-4 text-[15px] text-stone-600 dark:text-stone-300">
          Did you mean{' '}
          <Link
            href={`/search?q=${encodeURIComponent(suggestion)}`}
            className="font-semibold text-gold-700 underline underline-offset-2 hover:text-gold-600 dark:text-gold-300"
          >
            {suggestion}
          </Link>
          ?
        </p>
      )}

      {results.length === 0 ? (
        <ZeroResults query={query} />
      ) : (
        <>
          {/* filter + sort bar */}
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <label className="sr-only" htmlFor="sr-house">
              Filter by house
            </label>
            <Select id="sr-house" value={house} onChange={(e) => setHouse(e.target.value)} className="w-auto text-sm">
              <option value="all">All houses</option>
              {houses.map((h) => (
                <option key={h} value={h}>
                  {h}
                </option>
              ))}
            </Select>
            <label className="sr-only" htmlFor="sr-gender">
              Filter by gender
            </label>
            <Select id="sr-gender" value={gender} onChange={(e) => setGender(e.target.value)} className="w-auto text-sm">
              {GENDERS.map((g) => (
                <option key={g.v} value={g.v}>
                  {g.label}
                </option>
              ))}
            </Select>
            <label className="sr-only" htmlFor="sr-conc">
              Filter by concentration
            </label>
            <Select id="sr-conc" value={conc} onChange={(e) => setConc(e.target.value)} className="w-auto text-sm">
              {CONCS.map((c) => (
                <option key={c.v} value={c.v}>
                  {c.label}
                </option>
              ))}
            </Select>
            <div className="ml-auto flex items-center gap-2">
              <span className="text-sm text-stone-500 dark:text-stone-400">Sort</span>
              <label className="sr-only" htmlFor="sr-sort">
                Sort results
              </label>
              <Select id="sr-sort" value={sort} onChange={(e) => setSort(e.target.value as SortKey)} className="w-auto text-sm">
                {SORTS.map((s) => (
                  <option key={s.v} value={s.v}>
                    {s.label}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          <p className="mb-4 text-sm text-stone-500 dark:text-stone-400" role="status">
            {shown.length} {shown.length === 1 ? 'perfume' : 'perfumes'} shown
            {hasFilters && (
              <button
                type="button"
                onClick={clearAll}
                className="ml-2 font-semibold text-gold-700 underline-offset-2 hover:underline dark:text-gold-300"
              >
                Clear filters
              </button>
            )}
          </p>

          {shown.length === 0 ? (
            <EmptyState
              icon={<span aria-hidden="true">&#127912;</span>}
              title="No matches with these filters"
              body={`Nothing in the results for \u201c${query}\u201d matches the current filters. Loosen them up to see more.`}
              action={
                <Button variant="outline" size="sm" onClick={clearAll}>
                  Clear filters
                </Button>
              }
            />
          ) : (
            <div className="grid gap-5 pb-16 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {shown.map((p) => {
                const tag = matchedFieldLabel(p);
                return (
                  <div key={p.id} className="relative">
                    {tag && (
                      <span className="absolute left-3 top-3 z-10 rounded-full bg-ink-950/80 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur dark:bg-white/90 dark:text-ink-950">
                        {tag}
                      </span>
                    )}
                    <PerfumeCard perfume={p} />
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function ZeroResults({ query }: { query: string }) {
  return (
    <div className="pb-16">
      <EmptyState
        icon={<span aria-hidden="true">&#128269;</span>}
        title={`No perfumes found for \u201c${query}\u201d`}
        body="Check the spelling, or try a house name (Lattafa, Creed, Dior) or a note (oud, vanilla, citrus)."
        action={
          <Link
            href="/finder"
            className="inline-flex h-11 items-center rounded-xl bg-gold-600 px-5 text-sm font-semibold text-white transition-all hover:bg-gold-700 dark:bg-gold-500 dark:text-ink-950 dark:hover:bg-gold-400"
          >
            Try the AI Scent Finder
          </Link>
        }
      />
      <p className="mb-2 mt-6 text-sm font-semibold text-stone-600 dark:text-stone-300">
        Popular searches
      </p>
      <div className="flex flex-wrap gap-2">
        {POPULAR_SEARCHES.map((t) => (
          <Link
            key={t}
            href={`/search?q=${encodeURIComponent(t)}`}
            className="inline-flex h-9 items-center rounded-full border border-stone-300 px-4 text-sm font-medium text-stone-600 transition-all hover:border-gold-600 hover:text-gold-700 dark:border-ink-700 dark:text-stone-300 dark:hover:border-gold-400 dark:hover:text-gold-300"
          >
            {t}
          </Link>
        ))}
      </div>
    </div>
  );
}
