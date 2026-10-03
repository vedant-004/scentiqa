// /search/accords — AI-powered accord finder with ML match scoring.
// Trained on 24k Fragrantica perfumes for intelligent similarity ranking.
'use client';
import { useEffect, useMemo, useState } from 'react';
import { inr } from '@/lib/utils';
import { Button, Card, EmptyState, SectionHeading, Select, Skeleton } from '@/components';
import { PerfumeCard } from '@/components/domain';
import { loadML, isMLReady, accordMatchScore } from '@/lib/ml/engine';

interface P {
  id: string; slug: string; name: string; house: string; gender: string; isDupe: boolean;
  ratingAvg: number; lowestPriceInr: number | null;
  accords: Array<{ name: string; strength: number }>; summerRating: number;
}

const ACCORDS = ['Ambery', 'Woody', 'Citrus', 'Fresh', 'Floral', 'Sweet', 'Gourmand', 'Smoky', 'Musky', 'Warm Spicy', 'Tobacco', 'Aquatic', 'Green', 'Leathery'];

export default function AccordsPage() {
  const [perfumes, setPerfumes] = useState<P[]>([]);
  const [mlReady, setMlReady] = useState(false);
  const [wanted, setWanted] = useState<Record<string, number>>({ Ambery: 70, Woody: 60 });
  const [maxPrice, setMaxPrice] = useState(10000);
  const [minSummer, setMinSummer] = useState(0);
  const [gender, setGender] = useState('any');

  useEffect(() => {
    fetch('/api/perfumes').then((r) => r.json()).then((j) => setPerfumes(j.perfumes ?? [])).catch(() => {});
    loadML().then(() => setMlReady(true)).catch(() => {});
  }, []);

  const results = useMemo(() => {
    const keys = Object.keys(wanted);
    if (keys.length === 0) return [];

    return perfumes
      .filter((p) => {
        if (gender !== 'any' && p.gender !== gender) return false;
        if ((p.lowestPriceInr ?? Infinity) > maxPrice) return false;
        if (p.summerRating < minSummer) return false;
        return true;
      })
      .map((p) => {
        if (mlReady && isMLReady() && p.id) {
          // ML-powered cosine similarity scoring
          const { score, explanation } = accordMatchScore(wanted, p.id);
          return { p, match: score, matched: explanation.length, explanation };
        }
        // Fallback: simple threshold matching
        let score = 0, matched = 0;
        for (const k of keys) {
          const a = p.accords.find((x) => x.name.toLowerCase() === k.toLowerCase());
          if (a && a.strength >= wanted[k]) { matched++; score += a.strength; }
        }
        return { p, match: matched ? Math.round((score / keys.length) * (matched / keys.length)) : 0, matched, explanation: [] as string[] };
      })
      .filter((x) => x.match > 5)
      .sort((a, b) => b.match - a.match)
      .slice(0, 24);
  }, [perfumes, wanted, maxPrice, minSummer, gender, mlReady]);

  const setAccord = (name: string, v: number) => {
    setWanted((w) => {
      const next = { ...w };
      if (v <= 0) delete next[name]; else next[name] = v;
      return next;
    });
  };

  return (
    <div className="mx-auto max-w-7xl px-4 pt-8 sm:px-6">
      <SectionHeading kicker="Discovery · AI-Powered" title="Accord finder" />
      <p className="mb-6 max-w-2xl text-[15px] text-stone-500 dark:text-stone-400">
        Describe the vibe you want — slide each accord&rsquo;s intensity. Our AI, trained on 24,000+ perfumes,
        ranks every fragrance by how strongly it matches your desired profile.
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
              <Select value={String(minSummer)} onChange={(e) => setMinSummer(Number(e.target.value))} aria-label="Minimum summer rating">
                <option value="0">Any summer score</option><option value="3">Summer 3+</option><option value="4">Summer 4+</option><option value="5">Summer 5</option>
              </Select>
            </div>
            <Button variant="ghost" size="sm" className="w-full" onClick={() => { setWanted({}); setMaxPrice(10000); setMinSummer(0); setGender('any'); }}>Reset all</Button>
          </Card>
        </div>
        <div>
          <h2 className="mb-4 font-display text-2xl font-semibold tracking-tight">
            AI Matches <span className="text-base font-normal text-stone-400">({results.length})</span>
            {mlReady && <span className="ml-2 rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-xs font-bold text-emerald-600 dark:text-emerald-300">ML Active</span>}
          </h2>
          {perfumes.length === 0 ? (
            <div className="grid grid-cols-2 gap-4">{[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-64" />)}</div>
          ) : results.length === 0 ? (
            <EmptyState icon="🎚️" title="No matches" body="Lower an accord intensity or widen the India filters." />
          ) : (
            <div className="grid grid-cols-2 gap-4 xl:grid-cols-3">
              {results.map(({ p, match, explanation }) => (
                <div key={p.slug} className="relative">
                  <span className="absolute right-2.5 top-2.5 z-10 rounded-full bg-stone-900/85 px-2 py-0.5 text-[11px] font-bold text-white backdrop-blur dark:bg-white/90 dark:text-stone-900" title={explanation.length > 0 ? `Strong in: ${explanation.join(', ')}` : 'AI match score'}>
                    {match}%
                  </span>
                  <PerfumeCard perfume={p} />
                  {explanation.length > 0 && (
                    <p className="mt-1 px-1 text-[11px] text-stone-500 dark:text-stone-400">
                      Matches your {explanation.join(' + ')}
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
