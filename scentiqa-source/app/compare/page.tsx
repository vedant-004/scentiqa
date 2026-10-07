// /compare — true side-by-side comparison table (up to 3 perfumes).
// Sticky attribute column + horizontal scroll keeps columns side by side on mobile.
'use client';
import { Suspense, useEffect, useMemo, useState } from 'react';
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
  const items = useMemo(() => (state.key === key ? state.items.filter((p): p is PerfumeFull => !!p) : []), [state, key]);

  const add = (slug: string) => { if (!ids.includes(slug) && ids.length < 3) setIds([...ids, slug]); };
  const remove = (slug: string) => setIds(ids.filter((s) => s !== slug));

  const relBetween = (a: PerfumeFull, b: PerfumeFull) =>
    a.dupes.find((d) => d.dupeSlug === b.slug) ?? b.dupes.find((d) => d.dupeSlug === a.slug) ?? null;

  // Winner highlights
  const prices = items.map((p) => p.lowestPriceInr);
  const bestPriceIdx = prices.some((v) => v !== null) ? prices.indexOf(Math.min(...prices.filter((v): v is number => v !== null))) : -1;
  const ratings = items.map((p) => p.ratingCount > 0 ? p.ratingAvg : -1);
  const bestRatingIdx = ratings.some((v) => v >= 0) ? ratings.indexOf(Math.max(...ratings)) : -1;

  const sharedAccords = useMemo(() => {
    if (items.length !== 2) return [];
    const a = new Set(items[0].accords.map((x) => x.name.toLowerCase()));
    return items[1].accords.filter((x) => a.has(x.name.toLowerCase()));
  }, [items]);

  const verdict = useMemo(() => {
    if (items.length < 2) return null;
    const bits: string[] = [];
    if (bestPriceIdx >= 0) {
      const cheapest = items[bestPriceIdx];
      const others = items.filter((_, i) => i !== bestPriceIdx && items[i].lowestPriceInr !== null);
      if (others.length > 0) {
        const maxSaving = Math.max(...others.map((p) => (p.lowestPriceInr as number) - (cheapest.lowestPriceInr as number)));
        bits.push(`${cheapest.name} is the cheapest — save up to ${inr(maxSaving)} vs the priciest here.`);
      }
    }
    if (bestRatingIdx >= 0 && items[bestRatingIdx].ratingCount > 0) {
      bits.push(`${items[bestRatingIdx].name} is the community favorite (${items[bestRatingIdx].ratingAvg.toFixed(1)}★ from ${items[bestRatingIdx].ratingCount} ratings).`);
    }
    if (sharedAccords.length > 0) {
      bits.push(`They share ${sharedAccords.length} accord${sharedAccords.length === 1 ? '' : 's'}: ${sharedAccords.slice(0, 4).map((a) => a.name).join(', ')}${sharedAccords.length > 4 ? '…' : ''} — expect a similar dry-down.`);
    } else if (items.length === 2) {
      bits.push('No shared accords in the top pyramid — these smell distinctly different.');
    }
    const heats = items.map((p) => p.climate?.heatLongevity).filter((v): v is number => typeof v === 'number');
    if (heats.length === items.length && heats.length > 1) {
      const hi = heats.indexOf(Math.max(...heats));
      bits.push(`${items[hi].name} lasts longest in Indian heat.`);
    }
    return bits;
  }, [items, bestPriceIdx, bestRatingIdx, sharedAccords]);

  const rows: Array<{ label: string; render: (p: PerfumeFull, i: number) => React.ReactNode }> = [
    {
      label: 'Best price (India)',
      render: (p, i) => (
        <span className={cn('inline-flex items-center gap-1.5 text-lg font-bold', i === bestPriceIdx && 'text-emerald-600 dark:text-emerald-400')}>
          {inr(p.lowestPriceInr)}
          {i === bestPriceIdx && <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold uppercase">Best</span>}
        </span>
      ),
    },
    {
      label: 'Community rating',
      render: (p, i) => (
        <span className="inline-flex flex-col gap-1">
          <StarRating value={p.ratingAvg} count={p.ratingCount} size={13} />
          {i === bestRatingIdx && <span className="w-fit rounded-full bg-gold-600/15 px-2 py-0.5 text-[10px] font-bold uppercase text-gold-700 dark:text-gold-300">Top rated</span>}
        </span>
      ),
    },
    { label: 'House', render: (p) => <Link href={`/house/${p.houseInfo.slug}`} className="font-semibold text-gold-700 hover:underline dark:text-gold-300">{p.houseInfo.name}</Link> },
    { label: 'Concentration', render: (p) => <span className="text-sm">{p.concentration.toUpperCase()}</span> },
    {
      label: 'Scent profile',
      render: (p) => <span className="text-sm font-semibold">{p.accords.slice(0, 3).map((a) => a.name).join(' · ') || '—'}</span>,
    },
    { label: 'Top notes', render: (p) => <span className="text-sm text-stone-600 dark:text-stone-300">{p.topNotes.join(', ') || '—'}</span> },
    { label: 'Heart notes', render: (p) => <span className="text-sm text-stone-600 dark:text-stone-300">{p.heartNotes.join(', ') || '—'}</span> },
    { label: 'Base notes', render: (p) => <span className="text-sm text-stone-600 dark:text-stone-300">{p.baseNotes.join(', ') || '—'}</span> },
    { label: 'Heat longevity', render: (p) => (p.climate ? <MeterBar label="" value={p.climate.heatLongevity} /> : '—') },
    { label: 'Summer rating', render: (p) => (p.climate ? <MeterBar label="" value={p.climate.summerRating} /> : '—') },
    { label: 'All accords', render: (p) => <AccordBars accords={p.accords} compact /> },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 pt-8 sm:px-6">
      <SectionHeading kicker="Side by side" title="Compare fragrances" />
      <div className="mb-6 max-w-xl">
        <p className="mb-2 text-sm text-stone-500">Add up to 3 perfumes to compare{ids.length < 3 ? ` (${3 - ids.length} slot${3 - ids.length > 1 ? 's' : ''} left)` : ''}:</p>
        {ids.length < 3 && <SearchBar onPick={(slug) => add(slug)} />}
      </div>

      {loading ? (
        <Skeleton className="h-96" />
      ) : items.length === 0 ? (
        <EmptyState icon="⚖️" title="Nothing to compare yet" body="Search and add perfumes above — or start from any perfume page's Compare button." />
      ) : (
        <>
          {verdict && verdict.length > 0 && (
            <Card className="mb-6 border-gold-600/30 p-5 dark:border-gold-400/30">
              <h3 className="font-display text-lg font-bold">Quick verdict</h3>
              <ul className="mt-2 space-y-1.5">
                {verdict.map((v, i) => (
                  <li key={i} className="flex gap-2 text-sm text-stone-600 dark:text-stone-300">
                    <span className="text-gold-600 dark:text-gold-400">✓</span>{v}
                  </li>
                ))}
              </ul>
            </Card>
          )}

          <div className="overflow-x-auto rounded-3xl border border-stone-200/70 dark:border-ink-700/50">
            <table className="w-full min-w-[620px] border-collapse bg-white dark:bg-ink-900">
              <thead>
                <tr>
                  <th className="sticky left-0 z-10 w-32 bg-cream-50 p-4 text-left align-bottom dark:bg-ink-800" />
                  {items.map((p) => (
                    <th key={p.slug} className="min-w-[190px] p-4 text-left align-top">
                      <div className="flex items-start justify-between gap-2">
                        <Link href={`/perfume/${p.slug}`} className="flex items-center gap-3">
                          <BottleVisual name={p.name} house={p.houseInfo.name} size="sm" />
                          <span>
                            <span className="block text-[11px] font-bold uppercase tracking-wider text-gold-600 dark:text-gold-400">{p.houseInfo.name}</span>
                            <span className="font-display text-lg font-semibold leading-tight hover:text-gold-700 dark:hover:text-gold-300">{p.name}</span>
                          </span>
                        </Link>
                        <button onClick={() => remove(p.slug)} aria-label={`Remove ${p.name}`} className="shrink-0 rounded-lg p-1.5 text-stone-400 hover:bg-red-500/10 hover:text-red-600">✕</button>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.label} className="border-t border-stone-200/60 dark:border-ink-700/50">
                    <th className="sticky left-0 z-10 bg-cream-50 p-4 text-left align-top text-[11px] font-bold uppercase tracking-wider text-stone-400 dark:bg-ink-800">
                      {r.label}
                    </th>
                    {items.map((p, i) => (
                      <td key={p.slug} className="p-4 align-top">{r.render(p, i)}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-2 text-xs text-stone-400 sm:hidden">← Scroll sideways to see all columns</p>

          <div className={cn('mt-6 grid gap-4', items.length > 1 && 'sm:grid-cols-2', items.length > 2 && 'lg:grid-cols-3')}>
            {items.map((p) => (
              <Link key={p.slug} href={`/perfume/${p.slug}`}><Button className="w-full" size="sm">Full details: {p.name}</Button></Link>
            ))}
          </div>

          {items.length === 2 && (() => {
            const rel = relBetween(items[0], items[1]);
            return rel ? (
              <Card className="mt-6 flex flex-col items-center gap-4 p-6 text-center sm:flex-row sm:text-left">
                <ScoreBadge score={rel.similarityScore} size="lg" label={!isSupabaseConfigured() ? 'Lab match · sample' : 'Lab match'} />
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
        </>
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
