'use client';

import { useMemo, useState } from 'react';
import { HOUSE_TYPE_LABEL } from '@/lib/utils';
import { HouseCard } from '@/components';
import { SectionHeading } from '@/components/ui';
import type { House } from '@/lib/types';

const TYPE_ORDER = ['indian_clone', 'designer', 'niche', 'middle_eastern', 'attar_maker', 'artisan', 'mass'];

export default function HousesExplorer({ houses }: { houses: House[] }) {
  const [q, setQ] = useState('');
  const query = q.trim().toLowerCase();

  const filtered = useMemo(() => {
    if (!query) return houses;
    return houses.filter(
      (h) =>
        h.name.toLowerCase().includes(query) ||
        h.slug.toLowerCase().includes(query)
    );
  }, [houses, query]);

  const groups = useMemo(() => {
    const gs = TYPE_ORDER
      .map((type) => ({
        type,
        label: HOUSE_TYPE_LABEL[type] ?? type,
        houses: filtered.filter((h) => h.type === type),
      }))
      .filter((g) => g.houses.length > 0);
    const ungrouped = filtered.filter((h) => !TYPE_ORDER.includes(h.type));
    if (ungrouped.length) gs.push({ type: 'other', label: 'Other', houses: ungrouped });
    return gs;
  }, [filtered]);

  return (
    <>
      <div className="relative mt-6 max-w-xl">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-stone-400">
          <circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" />
        </svg>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search houses by name…"
          aria-label="Search houses"
          className="h-12 w-full rounded-2xl border border-stone-300 bg-white pl-11 pr-10 text-[15px] text-stone-900 outline-none transition-all placeholder:text-stone-400 focus:border-gold-600 focus:shadow-glow dark:border-ink-700 dark:bg-ink-800 dark:text-white dark:placeholder:text-stone-500"
        />
        {q && (
          <button
            onClick={() => setQ('')}
            aria-label="Clear house search"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200"
          >
            ✕
          </button>
        )}
      </div>
      {query && (
        <p className="mt-3 text-sm text-stone-500 dark:text-stone-400">
          {filtered.length} {filtered.length === 1 ? 'house' : 'houses'} matching “{q.trim()}”
        </p>
      )}

      <div className="mt-8 space-y-10">
        {groups.map((g) => (
          <section key={g.type}>
            <SectionHeading
              kicker={`${g.houses.length} ${g.houses.length === 1 ? 'house' : 'houses'}`}
              title={g.label}
            />
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {g.houses.map((h: House) => (
                <HouseCard key={h.slug} house={h} />
              ))}
            </div>
          </section>
        ))}
      </div>

      {filtered.length === 0 && (
        <p className="mt-12 text-center text-sm text-stone-500 dark:text-stone-400">
          No houses match “{q.trim()}”. Try a different name.
        </p>
      )}
    </>
  );
}
