// /find-alternative — Scentiqa's signature dupe-finder tool.
'use client';
import { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { cn, HOUSE_TYPE_LABEL, inr } from '@/lib/utils';
import { isSupabaseConfigured } from '@/lib/supabase';
import { Button, Card, Chip, EmptyState, SectionHeading, Skeleton } from '@/components';
import { ScoreBadge } from '@/components/domain';
import { SearchBar } from '@/components/layout';

interface ApiDupe {
  id: string; originalSlug: string; dupeSlug: string;
  similarityScore: number | null; testedBy: 'lab' | 'community';
  claimedAccuracy: string | null; verdict: string;
  dupe: { slug: string; name: string; house: string; houseSlug: string; ratingAvg: number; ratingCount: number; lowestPriceInr: number | null };
  dupeHouse: { slug: string; name: string; type: string };
  lowestPrice: { priceInr: number; seller?: string } | null;
}

const POPULAR = ['aventus', 'sauvage-eau-de-toilette', 'baccarat-rouge-540', 'tobacco-vanille', 'khamrah', 'hawas-for-him', 'naxos', 'ombre-nomade'];

function FinderInner() {
  const sp = useSearchParams();
  const [original, setOriginal] = useState<{ slug: string; name: string } | null>(null);
  const [dupes, setDupes] = useState<ApiDupe[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  // filters
  const [maxPrice, setMaxPrice] = useState(2000);
  const [minSim, setMinSim] = useState(0);
  const [types, setTypes] = useState<string[]>([]);
  const [labOnly, setLabOnly] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const demo = !isSupabaseConfigured();

  const load = useCallback(async (slug: string, name: string) => {
    setOriginal({ slug, name });
    setLoading(true); setSearched(true);
    try {
      const r = await fetch(`/api/dupes?original=${encodeURIComponent(slug)}`);
      const j = await r.json();
      setDupes(j.dupes ?? []);
    } catch { setDupes([]); }
    setLoading(false);
  }, []);

  // deep-link: /find-alternative?for=aventus
  const initial = sp.get('for');
  const done = useRef(false);
  useEffect(() => {
    if (initial && !done.current) {
      done.current = true;
      fetch(`/api/search?q=${encodeURIComponent(initial)}`).then((r) => r.json()).then((j) => {
        const hit = (j.results ?? [])[0];
        if (hit) load(hit.slug, hit.name);
      }).catch(() => {});
    }
  }, [initial, load]);

  const filtered = dupes.filter((d) => {
    const price = d.lowestPrice?.priceInr ?? d.dupe.lowestPriceInr ?? Infinity;
    if (price > maxPrice) return false;
    if ((d.similarityScore ?? 0) < minSim) return false;
    if (types.length && !types.includes(d.dupeHouse.type)) return false;
    if (labOnly && d.testedBy !== 'lab') return false;
    return true;
  });

  const toggleType = (t: string) => setTypes((ts) => ts.includes(t) ? ts.filter((x) => x !== t) : [...ts, t]);

  return (
    <div className="mx-auto max-w-7xl px-4 pt-8 sm:px-6">
      <div className="mx-auto max-w-2xl text-center">
        <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.16em] text-gold-600 dark:text-gold-400">Scentiqa dupe lab</p>
        <h1 className="font-display text-4xl font-bold tracking-tight sm:text-5xl">Find a cheaper alternative</h1>
        <p className="mt-3 text-[15px] text-stone-500 dark:text-stone-400">Pick any luxury perfume — we&rsquo;ll show its Indian alternatives, ranked by our lab-tested similarity scores.</p>
        <div className="mt-6"><SearchBar big onPick={(slug, name) => load(slug, name)} /></div>
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          {POPULAR.map((s) => (
            <button key={s} onClick={() => load(s, s.replace(/-/g, ' '))}
              className="rounded-full border border-stone-300/70 px-3.5 py-1.5 text-sm font-medium capitalize text-stone-600 transition-all hover:-translate-y-0.5 hover:border-gold-600 hover:text-gold-700 dark:border-ink-700 dark:text-stone-300">
              {s.replace(/-/g, ' ')}
            </button>
          ))}
        </div>
      </div>

      {searched && (
        <div className="mt-10">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-display text-2xl font-semibold tracking-tight">
              {loading ? 'Searching the lab…' : <>Alternatives to <span className="capitalize text-gold-700 dark:text-gold-300">{original?.name.replace(/-/g, ' ')}</span> <span className="text-base font-normal text-stone-400">({filtered.length})</span></>}
            </h2>
            <Button variant="outline" size="sm" onClick={() => setShowFilters((s) => !s)} className="md:hidden">
              {showFilters ? 'Hide filters' : 'Filters'}
            </Button>
          </div>

          <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
            {/* Filters */}
            <aside className={cn('lg:block', showFilters ? 'block' : 'hidden')}>
              <Card className="space-y-6 p-6 lg:sticky lg:top-24">
                <div>
                  <div className="mb-2 flex justify-between text-sm"><span className="font-semibold">Max budget</span><span className="font-bold text-gold-700 dark:text-gold-300">{inr(maxPrice)}</span></div>
                  <input type="range" min={200} max={10000} step={100} value={maxPrice}
                    onChange={(e) => setMaxPrice(Number(e.target.value))} className="slider-gold w-full"
                    style={{ ['--fill' as string]: `${((maxPrice - 200) / 9800) * 100}%` }} aria-label="Maximum budget" />
                </div>
                <div>
                  <div className="mb-2 flex justify-between text-sm"><span className="font-semibold">Min. similarity</span><span className="font-bold text-gold-700 dark:text-gold-300">{minSim}%</span></div>
                  <input type="range" min={0} max={95} step={5} value={minSim}
                    onChange={(e) => setMinSim(Number(e.target.value))} className="slider-gold w-full"
                    style={{ ['--fill' as string]: `${(minSim / 95) * 100}%` }} aria-label="Minimum similarity score" />
                </div>
                <div>
                  <p className="mb-2 text-sm font-semibold">House type</p>
                  <div className="flex flex-wrap gap-2">
                    {['indian_clone', 'middle_eastern', 'attar_maker'].map((t) => (
                      <Chip key={t} active={types.includes(t)} onClick={() => toggleType(t)}>{HOUSE_TYPE_LABEL[t]}</Chip>
                    ))}
                  </div>
                </div>
                <label className="flex cursor-pointer items-center gap-2.5 text-sm font-medium">
                  <input type="checkbox" checked={labOnly} onChange={(e) => setLabOnly(e.target.checked)} className="h-4 w-4 accent-amber-600" />
                  Lab-tested only
                </label>
                <Button variant="ghost" size="sm" className="w-full" onClick={() => { setMaxPrice(2000); setMinSim(0); setTypes([]); setLabOnly(false); }}>Reset filters</Button>
              </Card>
            </aside>

            {/* Results */}
            <div>
              {loading ? (
                <div className="space-y-4">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-44" />)}</div>
              ) : filtered.length === 0 ? (
                <EmptyState icon="🔬" title="No alternatives match"
                  body={dupes.length === 0 ? 'Our lab hasn\u2019t mapped an alternative for this one yet. Try another perfume — or loosen the filters.' : 'Try raising the budget or lowering the minimum similarity.'}
                  action={<Button variant="outline" size="sm" onClick={() => { setMaxPrice(10000); setMinSim(0); setTypes([]); setLabOnly(false); }}>Clear filters</Button>} />
              ) : (
                <div className="space-y-4">
                  {filtered.map((d) => (
                    <Card key={d.id} hover className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
                      <ScoreBadge score={d.similarityScore} size="md" label={d.testedBy === 'lab' ? (demo ? 'Lab match · sample' : 'Lab match') : 'Untested'} />
                      <div className="min-w-0 flex-1">
                        <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-gold-600 dark:text-gold-400">{d.dupeHouse.name}</p>
                        <Link href={`/perfume/${d.dupeSlug}`} className="font-display text-xl font-semibold tracking-tight hover:text-gold-700 dark:hover:text-gold-300">{d.dupe.name}</Link>
                        <p className="mt-1 line-clamp-2 text-sm text-stone-500 dark:text-stone-400">{d.verdict}</p>
                        {d.claimedAccuracy && d.testedBy === 'lab' && (
                          <p className="mt-2 text-xs"><span className="text-stone-400">House claims {d.claimedAccuracy} · </span><span className="font-bold text-gold-700 dark:text-gold-300">Scentiqa lab{demo ? ' (sample)' : ''}: {d.similarityScore}%</span></p>
                        )}
                      </div>
                      <div className="flex items-center gap-3 sm:flex-col sm:items-end">
                        <p className="text-lg font-bold">{d.lowestPrice ? inr(d.lowestPrice.priceInr) : '—'}</p>
                        <div className="flex gap-2">
                          <Link href={`/compare?ids=${d.originalSlug},${d.dupeSlug}`}><Button size="sm" variant="outline">Compare</Button></Link>
                          <Link href={`/perfume/${d.dupeSlug}`}><Button size="sm">View</Button></Link>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {!searched && (
        <div className="mx-auto mt-14 max-w-3xl">
          <SectionHeading kicker="How it works" title="Lab-tested, not marketing" />
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              ['1', 'Pick a perfume', 'Search any designer or niche fragrance.'],
              ['2', 'We rank the dupes', 'Indian alternatives sorted by blind-panel lab scores.'],
              ['3', 'Buy verified', 'INR prices only from vetted Indian sellers.'],
            ].map(([n, t, b]) => (
              <Card key={n} className="p-5">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gold-600/15 font-display text-lg font-bold text-gold-700 dark:text-gold-300">{n}</span>
                <h3 className="mt-3 font-display text-lg font-semibold">{t}</h3>
                <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">{b}</p>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function FindAlternativePage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-7xl px-4 pt-8"><Skeleton className="h-96" /></div>}>
      <FinderInner />
    </Suspense>
  );
}
