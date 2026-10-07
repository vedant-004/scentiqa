// /search/notes — note include/exclude search, scored against live note pyramids.
'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Button, Card, Chip, EmptyState, SectionHeading, Select, Skeleton } from '@/components';
import { PerfumeCard } from '@/components/domain';

interface Hit {
  id: string; slug: string; name: string; house: string; match: number; matchedNotes: string[];
  ratingAvg: number; lowestPriceInr: number | null; isDupe: boolean; bottleImage: string | null;
}
interface N { slug: string; name: string; category: string }

const CAT_LABEL: Record<string, string> = {
  citrus: 'Citrus', floral: 'Floral', white_floral: 'White Floral', woody: 'Woody',
  oriental: 'Oriental', musk: 'Musk', gourmand: 'Gourmand', green: 'Green',
  aquatic: 'Aquatic', spicy: 'Spicy', leather: 'Leather', chypre: 'Chypre', fougere: 'Fougère',
};

export default function NotesSearchPage() {
  const [notes, setNotes] = useState<N[]>([]);
  const [hits, setHits] = useState<Hit[]>([]);
  const [loading, setLoading] = useState(false);
  const [inc, setInc] = useState<string[]>([]);
  const [exc, setExc] = useState<string[]>([]);
  const [gender, setGender] = useState('any');
  const [noteQuery, setNoteQuery] = useState('');
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    fetch('/api/notes').then((r) => r.json()).then((j) => setNotes(j.notes ?? [])).catch(() => {});
  }, []);

  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    if (inc.length === 0 && exc.length === 0) { setHits([]); return; }
    setLoading(true);
    timer.current = setTimeout(async () => {
      try {
        const r = await fetch(`/api/search/notes?inc=${encodeURIComponent(inc.join(','))}&exc=${encodeURIComponent(exc.join(','))}&gender=${gender}&limit=24`);
        const j = await r.json();
        setHits(j.results ?? []);
      } catch { /* offline */ }
      setLoading(false);
    }, 350);
    return () => { if (timer.current) clearTimeout(timer.current); };
  }, [inc, exc, gender]);

  const cycle = (name: string) => {
    if (inc.includes(name)) { setInc(inc.filter((x) => x !== name)); setExc([...exc, name]); }
    else if (exc.includes(name)) setExc(exc.filter((x) => x !== name));
    else setInc([...inc, name]);
  };

  const grouped = useMemo(() => {
    const m = new Map<string, N[]>();
    const q = noteQuery.toLowerCase();
    for (const n of notes) {
      if (q && !n.name.toLowerCase().includes(q)) continue;
      if (!m.has(n.category)) m.set(n.category, []);
      m.get(n.category)!.push(n);
    }
    return [...m.entries()];
  }, [notes, noteQuery]);

  return (
    <div className="mx-auto max-w-7xl px-4 pt-8 sm:px-6">
      <SectionHeading kicker="Discovery" title="Search by notes" />
      <p className="mb-6 max-w-2xl text-[15px] text-stone-500 dark:text-stone-400">
        Tap a note once to <strong className="text-emerald-600">include</strong> it, again to <strong className="text-red-500">exclude</strong> it, a third time to clear.
        Choose from <strong>{notes.length} notes</strong> — we score every perfume by note harmony against live pyramids.
      </p>

      <div className="mb-6">
        <input
          type="text" value={noteQuery} onChange={(e) => setNoteQuery(e.target.value)}
          placeholder={`Search ${notes.length} notes... (e.g. oud, bergamot, vanilla)`}
          className="w-full max-w-md rounded-full border border-stone-300 bg-white px-4 py-2.5 text-sm outline-none focus:border-gold-500 dark:border-ink-700 dark:bg-ink-800"
        />
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
        <div className="space-y-7">
          {notes.length === 0 ? <Skeleton className="h-64" /> : grouped.map(([cat, ns]) => (
            <div key={cat}>
              <h3 className="mb-2.5 text-[12px] font-bold uppercase tracking-[0.14em] text-stone-400">{CAT_LABEL[cat] ?? cat} <span className="normal-case font-normal">({ns.length})</span></h3>
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
              <option value="any">Any gender</option><option value="for men">For men</option>
              <option value="women">For women</option><option value="unisex">Unisex</option>
            </Select>
            {(inc.length > 0 || exc.length > 0) && (
              <div className="mt-4 flex flex-wrap gap-2">
                {inc.map((n) => <Chip key={'i' + n} active onClick={() => cycle(n)}>+ {n}</Chip>)}
                {exc.map((n) => <Chip key={'e' + n} onClick={() => cycle(n)} className="border-red-400 text-red-500">− {n}</Chip>)}
              </div>
            )}
            <p className="mt-4 text-xs text-emerald-600 dark:text-emerald-400">✓ Live pyramid scoring</p>
          </Card>
        </aside>
      </div>

      <div className="mt-10">
        <h2 className="mb-4 font-display text-2xl font-semibold tracking-tight">Results <span className="text-base font-normal text-stone-400">({hits.length})</span></h2>
        {loading ? (
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">{[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-64" />)}</div>
        ) : hits.length === 0 ? (
          <EmptyState icon="🌿" title={inc.length || exc.length ? 'No matches' : 'Pick some notes'} body={inc.length || exc.length ? 'Try fewer required notes — or remove an exclusion.' : 'Tap notes above to include or exclude them.'} />
        ) : (
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {hits.map((h) => (
              <div key={h.slug} className="relative">
                {h.match > 0 && (
                  <span className="absolute right-2.5 top-2.5 z-10 rounded-full bg-stone-900/85 px-2 py-0.5 text-[11px] font-bold text-white backdrop-blur dark:bg-white/90 dark:text-stone-900" title={h.matchedNotes.length > 0 ? `Contains: ${h.matchedNotes.join(', ')}` : 'Note harmony score'}>
                    {h.match}%
                  </span>
                )}
                <PerfumeCard perfume={{ slug: h.slug, name: h.name, house: h.house, ratingAvg: h.ratingAvg, lowestPriceInr: h.lowestPriceInr, isDupe: h.isDupe, bottleImage: h.bottleImage }} />
              </div>
            ))}
          </div>
        )}
        <p className="mt-6 text-center"><Link href="/search/accords" className="text-sm font-semibold text-gold-700 hover:underline dark:text-gold-300">Prefer vibes over notes? Try the accord finder →</Link></p>
      </div>
    </div>
  );
}
