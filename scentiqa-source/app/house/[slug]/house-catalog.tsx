'use client';

import { useMemo, useState } from 'react';
import { PerfumeCard } from '@/components';
import { SectionHeading } from '@/components/ui';
import type { Perfume } from '@/lib/types';

type SortKey = 'name' | 'newest' | 'rating';

const SORTS: { key: SortKey; label: string }[] = [
  { key: 'name', label: 'Name A–Z' },
  { key: 'newest', label: 'Newest first' },
  { key: 'rating', label: 'Top rated' },
];

function sortPerfumes(list: Perfume[], sort: SortKey): Perfume[] {
  const arr = [...list];
  if (sort === 'name') arr.sort((a, b) => a.name.localeCompare(b.name));
  else if (sort === 'newest') arr.sort((a, b) => (b.launchYear ?? 0) - (a.launchYear ?? 0));
  else arr.sort((a, b) => (b.ratingAvg ?? 0) - (a.ratingAvg ?? 0) || (b.ratingCount ?? 0) - (a.ratingCount ?? 0));
  return arr;
}

function SortSelect({ value, onChange, id }: { value: SortKey; onChange: (s: SortKey) => void; id: string }) {
  return (
    <label className="flex items-center gap-2 text-sm">
      <span className="font-medium text-stone-500 dark:text-stone-400">Sort by</span>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value as SortKey)}
        className="h-10 rounded-xl border border-stone-300 bg-white px-3 text-sm font-semibold text-stone-800 outline-none focus:border-gold-600 dark:border-ink-700 dark:bg-ink-800 dark:text-stone-100"
      >
        {SORTS.map((s) => (
          <option key={s.key} value={s.key}>{s.label}</option>
        ))}
      </select>
    </label>
  );
}

export default function HouseCatalog({ dupes, originals }: { dupes: Perfume[]; originals: Perfume[] }) {
  const [sort, setSort] = useState<SortKey>('name');
  const sortedDupes = useMemo(() => sortPerfumes(dupes, sort), [dupes, sort]);
  const sortedOriginals = useMemo(() => sortPerfumes(originals, sort), [originals, sort]);

  return (
    <>
      {dupes.length > 0 && (
        <section className="mt-12">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <SectionHeading kicker="Dupe lab" title={`Inspired fragrances (${dupes.length})`} />
            <SortSelect id="sort-dupes" value={sort} onChange={setSort} />
          </div>
          <div className="stagger grid grid-cols-2 gap-4 lg:grid-cols-4">
            {sortedDupes.map((p) => <PerfumeCard key={p.slug} perfume={p} />)}
          </div>
        </section>
      )}
      {originals.length > 0 && (
        <section className="mt-12">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <SectionHeading kicker="Catalog" title={dupes.length ? `Original creations (${originals.length})` : `Fragrances (${originals.length})`} />
            {dupes.length === 0 && <SortSelect id="sort-originals" value={sort} onChange={setSort} />}
          </div>
          <div className="stagger grid grid-cols-2 gap-4 lg:grid-cols-4">
            {sortedOriginals.map((p) => <PerfumeCard key={p.slug} perfume={p} />)}
          </div>
        </section>
      )}
    </>
  );
}
