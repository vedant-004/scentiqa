// /search/notes — AI-powered note search with 400 notes and ML match scoring.
// Trained on 24k Fragrantica perfumes.
'use client';
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Button, Card, Chip, EmptyState, SectionHeading, Select, Skeleton } from '@/components';
import { PerfumeCard } from '@/components/domain';
import { loadML, isMLReady, noteMatchScore, suggestNotes } from '@/lib/ml/engine';

interface P {
  id: string; slug: string; name: string; house: string; gender: string; isDupe: boolean;
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
  const [mlReady, setMlReady] = useState(false);
  const [inc, setInc] = useState<string[]>([]);
  const [exc, setExc] = useState<string[]>([]);
  const [gender, setGender] = useState('any');
  const [noteQuery, setNoteQuery] = useState('');

  useEffect(() => {
    Promise.all([fetch('/api/notes').then((r) => r.json()), fetch('/api/perfumes').then((r) => r.json())])
      .then(([n, p]) => { setNotes(n.notes ?? []); setPerfumes(p.perfumes ?? []); })
      .catch(() => {});
    loadML().then(() => setMlReady(true)).catch(() => {});
  }, []);

  const cycle = (name: string) => {
    if (inc.includes(name)) { setInc(inc.filter((x) => x !== name)); setExc([...exc, name]); }
    else if (exc.includes(name)) setExc(exc.filter((x) => x !== name));
    else setInc([...inc, name]);
  };

  // AI smart suggestions based on selected notes
  const suggestions = useMemo(() => {
    if (!mlReady || inc.length === 0) return [];
    const sug = suggestNotes(inc, 6);
    // Map to display names (match against notes list)
    return sug.map((s) => {
      const found = notes.find((n) => n.name.toLowerCase() === s || n.slug === s.replace(/ /g, '-'));
      return found ? found.name : s.split(' ').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    }).filter((s) => !inc.includes(s) && !exc.includes(s));
  }, [inc, exc, mlReady, notes]);

  const results = useMemo(() => {
    const filtered = perfumes.filter((p) => {
      if (gender !== 'any' && p.gender !== gender) return false;
      return true;
    });

    if (mlReady && isMLReady() && (inc.length > 0 || exc.length > 0)) {
      // ML-powered scoring
      return filtered
        .map((p) => {
          const { score, matchedNotes } = noteMatchScore(inc, exc, p.id);
          return { p, score, matchedNotes };
        })
        .filter((x) => x.score > 10)
        .sort((a, b) => b.score - a.score)
        .slice(0, 24);
    }

    // Fallback: simple include/exclude
    const il = inc.map((s) => s.toLowerCase()), el = exc.map((s) => s.toLowerCase());
    return filtered.filter((p) => {
      const all = [...p.topNotes, ...p.heartNotes, ...p.baseNotes].map((n) => n.toLowerCase());
      if (el.some((e) => all.some((n) => n.includes(e)))) return false;
      return il.every((i) => all.some((n) => n.includes(i)));
    }).map((p) => ({ p, score: 80, matchedNotes: [] as string[] }))
      .sort((a, b) => b.p.ratingCount - a.p.ratingCount).slice(0, 24);
  }, [perfumes, inc, exc, gender, mlReady]);

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
      <SectionHeading kicker="Discovery · AI-Powered" title="Search by notes" />
      <p className="mb-6 max-w-2xl text-[15px] text-stone-500 dark:text-stone-400">
        Tap a note once to <strong className="text-emerald-600">include</strong> it, again to <strong className="text-red-500">exclude</strong> it, a third time to clear.
        Choose from <strong>{notes.length} notes</strong> — our AI scores every perfume by note harmony.
      </p>

      {/* AI Smart Suggestions */}
      {suggestions.length > 0 && (
        <Card className="mb-6 p-4">
          <h3 className="mb-2 text-sm font-bold text-stone-700 dark:text-stone-200">
            🤖 AI suggests — pairs well with your picks:
          </h3>
          <div className="flex flex-wrap gap-2">
            {suggestions.map((s) => (
              <button key={s} onClick={() => cycle(s)}
                className="rounded-full border border-violet-400 bg-violet-500/10 px-3.5 py-1.5 text-sm font-medium text-violet-700 transition-all hover:bg-violet-500/20 dark:text-violet-300">
                + {s}
              </button>
            ))}
          </div>
        </Card>
      )}

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
              <option value="any">Any gender</option><option value="men">For men</option>
              <option value="women">For women</option><option value="unisex">Unisex</option>
            </Select>
            {(inc.length > 0 || exc.length > 0) && (
              <div className="mt-4 flex flex-wrap gap-2">
                {inc.map((n) => <Chip key={'i' + n} active onClick={() => cycle(n)}>+ {n}</Chip>)}
                {exc.map((n) => <Chip key={'e' + n} onClick={() => cycle(n)} className="border-red-400 text-red-500">− {n}</Chip>)}
              </div>
            )}
            {mlReady && (
              <p className="mt-4 text-xs text-emerald-600 dark:text-emerald-400">✓ AI scoring active</p>
            )}
          </Card>
        </aside>
      </div>

      <div className="mt-10">
        <h2 className="mb-4 font-display text-2xl font-semibold tracking-tight">AI Results <span className="text-base font-normal text-stone-400">({results.length})</span></h2>
        {results.length === 0 ? (
          <EmptyState icon="🌿" title="No matches" body="Try fewer required notes — or remove an exclusion." />
        ) : (
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {results.map(({ p, score, matchedNotes }) => (
              <div key={p.slug} className="relative">
                {score > 0 && (
                  <span className="absolute right-2.5 top-2.5 z-10 rounded-full bg-stone-900/85 px-2 py-0.5 text-[11px] font-bold text-white backdrop-blur dark:bg-white/90 dark:text-stone-900" title={matchedNotes.length > 0 ? `Contains: ${matchedNotes.join(', ')}` : 'AI note harmony score'}>
                    {score}%
                  </span>
                )}
                <PerfumeCard perfume={p} />
              </div>
            ))}
          </div>
        )}
        <p className="mt-6 text-center"><Link href="/search/accords" className="text-sm font-semibold text-gold-700 hover:underline dark:text-gold-300">Prefer vibes over notes? Try the AI accord finder →</Link></p>
      </div>
    </div>
  );
}
