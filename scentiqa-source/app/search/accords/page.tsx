// /search/accords — accord profile finder, scored against live accord data.
'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { inr } from '@/lib/utils';
import { Button, Card, EmptyState, SectionHeading, Select, Skeleton } from '@/components';
import { PerfumeCard } from '@/components/domain';

interface Hit { id: string; slug: string; name: string; house: string; match: number; explanation: string[]; ratingAvg: number; lowestPriceInr: number | null; isDupe: boolean; bottleImage: string | null }

const ACCORDS = ['Ambery', 'Woody', 'Citrus', 'Fresh', 'Floral', 'Sweet', 'Gourmand', 'Smoky', 'Musky', 'Warm Spicy', 'Tobacco', 'Aquatic', 'Green', 'Leathery'];

export default function AccordsPage() {
  const [hits, setHits] = useState<Hit[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [wanted, setWanted] = useState<Record<string, number>>({ Ambery: 70, Woody: 60 });
  const [maxPrice, setMaxPrice] = useState(10000);
  const [gender, setGender] = useState('any');
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const wantedParam = useMemo(() => {
    const parts = Object.entries(wanted).filter(([, v]) => v > 0).map(([k, v]) => `${k}:${v}`);
    return parts.join(',');
  }, [wanted]);

  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    if (!wantedParam) { setHits([]); setSearched(false); return; }
    setLoading(true);
    timer.current = setTimeout(async () => {
      try {
        const r = await fetch(`/api/search/accords?wanted=${encodeURIComponent(wantedParam)}&maxPrice=${maxPrice}&gender=${gender}&limit=24`);
        const j = await r.json();
        setHits(j.results ?? []);
        setSearched(true);
      } catch { /* offline */ }
      setLoading(false);
    }, 350);
    return () => { if (timer.current) clearTimeout(timer.current); };
  }, [wantedParam, maxPrice, gender]);

  const setAccord = (name: string, v: number) => {
    setWanted((w) => {
      const next = { ...w };
      if (v <= 0) delete next[name]; else next[name] = v;
      return next;
    });
  };

  return (
    <div className="mx-auto max-w-7xl px-4 pt-8 sm:px-6">
      <SectionHeading kicker="Discovery" title="Accord finder" />
      <p className="mb-6 max-w-2xl text-[15px] text-stone-500 dark:text-stone-400">
        Describe the vibe you want — slide each accord&rsquo;s intensity. We rank every fragrance
        against your profile using live accord data from the full catalog.
      </p>
      <div className="grid gap-8 lg:grid-cols-[380px_1fr]">
        <div className="lg:sticky lg:top-24 lg:self-start">
          <Card className="space-y-5 p-6">
            {ACCORDS.map((a) => {
              const v = wanted[a] ?? 0;
              return (
                <div key={a}>
                  <div className="mb-1.5 flex justify-between text-sm">
                    <span className="font-medium">{a}</span>
                    <span className={v > 0 ? 'font-bold text-gold-700 dark:text-gold-300' : 'text-stone-400'}>{v > 0 ? `${v}+` : 'off'}</span>
                  </div>
                  <input type="range" min={0} max={100} step={5} value={v}
                    onChange={(e) => setAccord(a, Number(e.target.value))}
                    className="slider-gold w-full" style={{ ['--fill' as string]: `${v}%` }} aria-label={`${a} intensity`} />
                </div>
              );
            })}
            <div className="grid grid-cols-2 gap-3 border-t border-stone-200/70 pt-5 dark:border-ink-700/50">
              <div className="col-span-2">
                <div className="mb-1.5 flex justify-between text-sm"><span className="font-medium">Max price</span><span className="font-bold text-gold-700 dark:text-gold-300">{maxPrice >= 10000 ? 'Any' : inr(maxPrice)}</span></div>
                <input type="range" min={500} max={10000} step={500} value={maxPrice} onChange={(e) => setMaxPrice(Number(e.target.value))}
                  className="slider-gold w-full" style={{ ['--fill' as string]: `${((maxPrice - 500) / 9500) * 100}%` }} aria-label="Maximum price" />
              </div>
              <Select value={gender} onChange={(e) => setGender(e.target.value)} aria-label="Gender">
                <option value="any">Any gender</option><option value="men">Men</option><option value="women">Women</option><option value="unisex">Unisex</option>
              </Select>
            </div>
            <Button variant="ghost" size="sm" className="w-full" onClick={() => { setWanted({}); setMaxPrice(10000); setGender('any'); }}>Reset all</Button>
          </Card>
        </div>
        <div>
          <h2 className="mb-4 font-display text-2xl font-semibold tracking-tight">
            Matches <span className="text-base font-normal text-stone-400">({hits.length})</span>
            <span className="ml-2 rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-xs font-bold text-emerald-600 dark:text-emerald-300">Live accord data</span>
          </h2>
          {loading && !searched ? (
            <div className="grid grid-cols-2 gap-4">{[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-64" />)}</div>
          ) : hits.length === 0 ? (
            <EmptyState icon="🎚️" title="No matches" body={wantedParam ? 'Lower an accord intensity or widen the price filter.' : 'Slide an accord intensity to start matching.'} />
          ) : (
            <div className="grid grid-cols-2 gap-4 xl:grid-cols-3">
              {hits.map((h) => (
                <div key={h.slug} className="relative">
                  <span className="absolute right-2.5 top-2.5 z-10 rounded-full bg-stone-900/85 px-2 py-0.5 text-[11px] font-bold text-white backdrop-blur dark:bg-white/90 dark:text-stone-900" title={h.explanation.length > 0 ? `Strong in: ${h.explanation.join(', ')}` : 'Accord match score'}>
                    {h.match}%
                  </span>
                  <PerfumeCard perfume={{ slug: h.slug, name: h.name, house: h.house, ratingAvg: h.ratingAvg, lowestPriceInr: h.lowestPriceInr, isDupe: h.isDupe, bottleImage: h.bottleImage }} />
                  {h.explanation.length > 0 && (
                    <p className="mt-1 px-1 text-[11px] text-stone-500 dark:text-stone-400">
                      Matches your {h.explanation.join(' + ')}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
