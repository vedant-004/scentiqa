// /search/notes — find perfumes by including / excluding notes.
'use client';
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Button, Card, Chip, EmptyState, SectionHeading, Select, Skeleton } from '@/components';
import { PerfumeCard } from '@/components/domain';

interface P {
  slug: string; name: string; house: string; gender: string; isDupe: boolean;
  ratingAvg: number; ratingCount: number; lowestPriceInr: number | null;
  topNotes: string[]; heartNotes: string[]; baseNotes: string[];
}
interface N { slug: string; name: string; category: string }

const CAT_LABEL: Record<string, string> = {
  citrus: 'Citrus', floral: 'Floral', white_floral: 'White Floral', woody: 'Woody',
  oriental: 'Oriental', musk: 'Musk', gourmand: 'Gourmand', green: 'Green',
  aquatic: 'Aquatic', spicy: 'Spicy', leather: 'Leather', chypre: 'Chypre', fougere: 'Fougère',
};

export default function NotesSearchPage() {
  const [notes, setNotes] = useState<N[]>([]);
  const [perfumes, setPerfumes] = useState<P[]>([]);
  const [inc, setInc] = useState<string[]>([]);
  const [exc, setExc] = useState<string[]>([]);
  const [gender, setGender] = useState('any');

  useEffect(() => {
    Promise.all([fetch('/api/notes').then((r) => r.json()), fetch('/api/perfumes').then((r) => r.json())])
      .then(([n, p]) => { setNotes(n.notes ?? []); setPerfumes(p.perfumes ?? []); })
      .catch(() => {});
  }, []);

  const cycle = (name: string) => {
    if (inc.includes(name)) { setInc(inc.filter((x) => x !== name)); setExc([...exc, name]); }
    else if (exc.includes(name)) setExc(exc.filter((x) => x !== name));
    else setInc([...inc, name]);
  };

  const results = useMemo(() => {
    const il = inc.map((s) => s.toLowerCase()), el = exc.map((s) => s.toLowerCase());
    return perfumes.filter((p) => {
      if (gender !== 'any' && p.gender !== gender) return false;
      const all = [...p.topNotes, ...p.heartNotes, ...p.baseNotes].map((n) => n.toLowerCase());
      if (el.some((e) => all.some((n) => n.includes(e)))) return false;
      return il.every((i) => all.some((n) => n.includes(i)));
    }).sort((a, b) => b.ratingCount - a.ratingCount).slice(0, 24);
  }, [perfumes, inc, exc, gender]);

  const grouped = useMemo(() => {
    const m = new Map<string, N[]>();
    for (const n of notes) {
      if (!m.has(n.category)) m.set(n.category, []);
      m.get(n.category)!.push(n);
    }
    return [...m.entries()];
  }, [notes]);

  return (
    <div className="mx-auto max-w-7xl px-4 pt-8 sm:px-6">
      <SectionHeading kicker="Discovery" title="Search by notes" />
      <p className="mb-6 max-w-2xl text-[15px] text-stone-500 dark:text-stone-400">
        Tap a note once to <strong className="text-emerald-600">include</strong> it, again to <strong className="text-red-500">exclude</strong> it, a third time to clear.
      </p>
      <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
        <div className="space-y-7">
          {notes.length === 0 ? <Skeleton className="h-64" /> : grouped.map(([cat, ns]) => (
            <div key={cat}>
              <h3 className="mb-2.5 text-[12px] font-bold uppercase tracking-[0.14em] text-stone-400">{CAT_LABEL[cat] ?? cat}</h3>
              <div className="flex flex-wrap gap-2">
                {ns.map((n) => {
                  const state = inc.includes(n.name) ? 'inc' : exc.includes(n.name) ? 'exc' : 'none';
                  return (
                    <button key={n.slug} onClick={() => cycle(n.name)} title={state === 'none' ? 'Include' : state === 'inc' ? 'Exclude' : 'Clear'}
                      className={cn('rounded-full border px-3.5 py-1.5 text-sm font-medium transition-all duration-150 active:scale-95',
                        state === 'inc' && 'border-emerald-500 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300',
                        state === 'exc' && 'border-red-400 bg-red-500/10 text-red-600 line-through dark:text-red-400',
                        state === 'none' && 'border-stone-300 text-stone-600 hover:border-stone-500 dark:border-ink-700 dark:text-stone-300')}>
                      {n.name}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <Card className="p-5">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h3 className="font-display text-lg font-semibold">Filters</h3>
              <Button variant="ghost" size="sm" onClick={() => { setInc([]); setExc([]); setGender('any'); }}>Clear</Button>
            </div>
            <Select value={gender} onChange={(e) => setGender(e.target.value)} aria-label="Gender">
              <option value="any">Any gender</option><option value="men">For men</option>
              <option value="women">For women</option><option value="unisex">Unisex</option>
            </Select>
            {(inc.length > 0 || exc.length > 0) && (
              <div className="mt-4 flex flex-wrap gap-2">
                {inc.map((n) => <Chip key={'i' + n} active onClick={() => cycle(n)}>+ {n}</Chip>)}
                {exc.map((n) => <Chip key={'e' + n} onClick={() => cycle(n)} className="border-red-400 text-red-500">− {n}</Chip>)}
              </div>
            )}
          </Card>
        </aside>
      </div>

      <div className="mt-10">
        <h2 className="mb-4 font-display text-2xl font-semibold tracking-tight">Results <span className="text-base font-normal text-stone-400">({results.length})</span></h2>
        {results.length === 0 ? (
          <EmptyState icon="🌿" title="No matches" body="Try fewer required notes — or remove an exclusion." />
        ) : (
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {results.map((p) => <PerfumeCard key={p.slug} perfume={p} />)}
          </div>
        )}
        <p className="mt-6 text-center"><Link href="/search/accords" className="text-sm font-semibold text-gold-700 hover:underline dark:text-gold-300">Prefer vibes over notes? Try the accord finder →</Link></p>
      </div>
    </div>
  );
}
