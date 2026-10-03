// /compare — side-by-side comparison of up to 3 perfumes.
'use client';
import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { cn, inr } from '@/lib/utils';
import { isSupabaseConfigured } from '@/lib/supabase';
import { Button, Card, EmptyState, SectionHeading, Skeleton } from '@/components';
import { AccordBars, BottleVisual, MeterBar, ScoreBadge, StarRating } from '@/components/domain';
import { SearchBar } from '@/components/layout';
import type { PerfumeFull } from '@/lib/types';

function CompareInner() {
  const sp = useSearchParams();
  const [ids, setIds] = useState<string[]>(() => (sp.get('ids') ?? '').split(',').filter(Boolean).slice(0, 3));
  const key = ids.join(',');
  const [state, setState] = useState<{ key: string; items: Array<PerfumeFull | null> }>({ key: '', items: [] });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!key) {
        if (!cancelled) setState({ key: '', items: [] });
        return;
      }
      const rs = await Promise.all(ids.map((s) => fetch(`/api/perfume/${s}`).then((r) => (r.ok ? r.json() : null)).catch(() => null)));
      if (!cancelled) setState({ key, items: rs.map((r) => r?.perfume ?? null) });
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const loading = state.key !== key;
  const items = state.key === key ? state.items : [];

  const add = (slug: string) => { if (!ids.includes(slug) && ids.length < 3) setIds([...ids, slug]); };
  const remove = (slug: string) => setIds(ids.filter((s) => s !== slug));

  const relBetween = (a: PerfumeFull, b: PerfumeFull) =>
    a.dupes.find((d) => d.dupeSlug === b.slug) ?? b.dupes.find((d) => d.dupeSlug === a.slug) ?? null;

  const rows: Array<{ label: string; render: (p: PerfumeFull) => React.ReactNode }> = [
    { label: 'Best price (India)', render: (p) => <span className="text-lg font-bold">{inr(p.lowestPriceInr)}</span> },
    { label: 'Community rating', render: (p) => <StarRating value={p.ratingAvg} count={p.ratingCount} size={13} /> },
    { label: 'House', render: (p) => <Link href={`/house/${p.houseInfo.slug}`} className="font-semibold text-gold-700 hover:underline dark:text-gold-300">{p.houseInfo.name}</Link> },
    { label: 'Concentration', render: (p) => <span className="text-sm">{p.concentration.toUpperCase()}</span> },
    { label: 'Top notes', render: (p) => <span className="text-sm text-stone-600 dark:text-stone-300">{p.topNotes.join(', ')}</span> },
    { label: 'Heart notes', render: (p) => <span className="text-sm text-stone-600 dark:text-stone-300">{p.heartNotes.join(', ')}</span> },
    { label: 'Base notes', render: (p) => <span className="text-sm text-stone-600 dark:text-stone-300">{p.baseNotes.join(', ')}</span> },
    { label: 'Heat longevity', render: (p) => (p.climate ? <MeterBar label="" value={p.climate.heatLongevity} /> : '—') },
    { label: 'Summer rating', render: (p) => (p.climate ? <MeterBar label="" value={p.climate.summerRating} /> : '—') },
    { label: 'Accords', render: (p) => <AccordBars accords={p.accords} compact /> },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 pt-8 sm:px-6">
      <SectionHeading kicker="Side by side" title="Compare fragrances" />
      <div className="mb-6 max-w-xl">
        <p className="mb-2 text-sm text-stone-500">Add up to 3 perfumes to compare{ids.length < 3 ? ` (${3 - ids.length} slot${3 - ids.length > 1 ? 's' : ''} left)` : ''}:</p>
        {ids.length < 3 && <SearchBar onPick={(slug) => add(slug)} />}
      </div>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-96" />)}</div>
      ) : items.length === 0 ? (
        <EmptyState icon="⚖️" title="Nothing to compare yet" body="Search and add perfumes above — or start from any perfume page's Compare button." />
      ) : (
        <div className="overflow-x-auto">
          <div className={cn('grid min-w-[640px] gap-4', items.length === 3 ? 'md:grid-cols-3' : items.length === 2 ? 'md:grid-cols-2' : 'md:grid-cols-1')}>
            {items.map((p) => p && (
              <Card key={p.slug} className="p-6">
                <div className="mb-4 flex items-start justify-between">
                  <Link href={`/perfume/${p.slug}`} className="flex items-center gap-3">
                    <BottleVisual name={p.name} house={p.houseInfo.name} size="sm" />
                    <span>
                      <span className="block text-[11px] font-bold uppercase tracking-wider text-gold-600 dark:text-gold-400">{p.houseInfo.name}</span>
                      <span className="font-display text-xl font-semibold hover:text-gold-700 dark:hover:text-gold-300">{p.name}</span>
                    </span>
                  </Link>
                  <button onClick={() => remove(p.slug)} aria-label={`Remove ${p.name}`} className="rounded-lg p-1.5 text-stone-400 hover:bg-red-500/10 hover:text-red-600">✕</button>
                </div>
                <dl className="space-y-4">
                  {rows.map((r) => (
                    <div key={r.label} className="border-t border-stone-200/60 pt-3 dark:border-ink-700/50">
                      <dt className="mb-1.5 text-[11px] font-bold uppercase tracking-wider text-stone-400">{r.label}</dt>
                      <dd>{r.render(p)}</dd>
                    </div>
                  ))}
                </dl>
                <Link href={`/perfume/${p.slug}`} className="mt-5 block"><Button className="w-full" size="sm">Full details</Button></Link>
              </Card>
            ))}
          </div>

          {items.length === 2 && items[0] && items[1] && (() => {
            const rel = relBetween(items[0]!, items[1]!);
            return rel ? (
              <Card className="mt-6 flex flex-col items-center gap-4 p-6 text-center sm:flex-row sm:text-left">
                <ScoreBadge score={rel.similarityScore} size="lg" label={!isSupabaseConfigured() ? "Lab match · sample" : "Lab match"} />
                <div>
                  <h3 className="font-display text-xl font-semibold">Lab verdict</h3>
                  <p className="mt-1 max-w-2xl text-sm leading-relaxed text-stone-600 dark:text-stone-300">{rel.verdict}</p>
                  {rel.claimedAccuracy && <p className="mt-2 text-xs text-stone-400">House claims {rel.claimedAccuracy} · Scentiqa lab{!isSupabaseConfigured() ? ' (sample)' : ''} measured {rel.similarityScore}%</p>}
                </div>
              </Card>
            ) : (
              <p className="mt-6 text-center text-sm text-stone-400">Our lab hasn&rsquo;t directly compared these two yet.</p>
            );
          })()}
        </div>
      )}
    </div>
  );
}

export default function ComparePage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-7xl px-4 pt-8"><Skeleton className="h-96" /></div>}>
      <CompareInner />
    </Suspense>
  );
}
