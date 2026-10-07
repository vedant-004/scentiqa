// Complete Your Collection — real wardrobe-gap recommendations.
// Finds the scent families your wardrobe under-covers (from real accord data)
// and suggests highly-rated perfumes prominent in those families.
'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Button, Card, SectionHeading } from '@/components';

interface Owned { id: string; slug: string; name: string; house: string }
interface Reco { id: string; slug: string; name: string; house: string; score: number; reason: string; gap: string }

export default function CollectionPage() {
  const [owned, setOwned] = useState<Owned[]>([]);
  const [search, setSearch] = useState('');
  const [hits, setHits] = useState<Owned[]>([]);
  const [showHits, setShowHits] = useState(false);
  const [gaps, setGaps] = useState<string[]>([]);
  const [recos, setRecos] = useState<Reco[]>([]);
  const [analyzing, setAnalyzing] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [error, setError] = useState('');
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('scentiqa-collection');
      if (saved) setOwned(JSON.parse(saved));
    } catch { /* noop */ }
  }, []);

  useEffect(() => {
    try { localStorage.setItem('scentiqa-collection', JSON.stringify(owned)); } catch { /* noop */ }
  }, [owned]);

  // Server-side search — no full-catalog download.
  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    const q = search.trim();
    if (q.length < 2) { setHits([]); setShowHits(false); return; }
    timer.current = setTimeout(async () => {
      try {
        const r = await fetch(`/api/search?q=${encodeURIComponent(q)}&limit=8`);
        const j = await r.json();
        setHits((j.results ?? []).filter((h: Owned) => !owned.some((o) => o.id === h.id)));
        setShowHits(true);
      } catch { /* offline */ }
    }, 250);
    return () => { if (timer.current) clearTimeout(timer.current); };
  }, [search, owned]);

  const toggle = (p: Owned) => {
    setOwned((o) => (o.some((x) => x.id === p.id) ? o.filter((x) => x.id !== p.id) : [...o, p]));
  };

  const analyze = async () => {
    if (owned.length === 0) return;
    setAnalyzing(true); setError('');
    try {
      const r = await fetch(`/api/collection/recommend?owned=${owned.map((o) => o.id).join(',')}`);
      const j = await r.json();
      if (!r.ok) throw new Error(j.error ?? 'Analysis failed');
      setGaps(j.gaps ?? []);
      setRecos(j.recommendations ?? []);
      setShowResults(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Analysis failed');
    } finally { setAnalyzing(false); }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 pt-8 sm:px-6">
      <SectionHeading kicker="Wardrobe analysis" title="Complete your collection" />
      <p className="mb-8 max-w-2xl text-[15px] text-stone-500 dark:text-stone-400">
        Tell us what you own. We map your wardrobe&apos;s scent families from real accord data
        and find the missing pieces — complementary fragrances for every occasion.
      </p>

      {!showResults ? (
        <>
          <Card className="mb-6 p-6">
            <h3 className="mb-3 font-display text-lg font-semibold">What do you own?</h3>
            <div className="relative">
              <input
                type="text" value={search} onChange={(e) => setSearch(e.target.value)}
                onFocus={() => search.trim().length >= 2 && setShowHits(true)}
                placeholder="Search perfumes you own... (e.g. Aventus, Sauvage)"
                className="w-full rounded-full border border-stone-300 bg-white px-4 py-2.5 text-sm outline-none focus:border-gold-500 dark:border-ink-700 dark:bg-ink-800"
              />
              {showHits && hits.length > 0 && (
                <div className="absolute inset-x-0 top-full z-30 mt-2 overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-lift dark:border-ink-700 dark:bg-ink-900">
                  {hits.map((p) => (
                    <button
                      key={p.id} onClick={() => { toggle(p); setSearch(''); setHits([]); setShowHits(false); }}
                      className="flex w-full items-center justify-between px-4 py-2.5 text-left hover:bg-cream-100 dark:hover:bg-white/5"
                    >
                      <span>
                        <span className="font-medium">{p.name}</span>
                        <span className="ml-2 text-sm text-stone-500">{p.house}</span>
                      </span>
                      <span className="text-gold-600">+ Add</span>
                    </button>
                  ))}
                </div>
              )}
              {showHits && search.trim().length >= 2 && hits.length === 0 && (
                <p className="mt-2 text-sm text-stone-400">No matches — try a different spelling.</p>
              )}
            </div>
          </Card>

          {owned.length > 0 && (
            <Card className="mb-6 p-6">
              <h3 className="mb-3 font-display text-lg font-semibold">
                Your collection ({owned.length})
              </h3>
              <div className="flex flex-wrap gap-2">
                {owned.map((p) => (
                  <button
                    key={p.id} onClick={() => toggle(p)}
                    className="rounded-full bg-stone-900 px-4 py-1.5 text-sm font-medium text-white hover:bg-red-600 dark:bg-white dark:text-stone-900"
                    title="Click to remove"
                  >
                    {p.name} ✕
                  </button>
                ))}
              </div>
              <Button onClick={analyze} className="mt-6" disabled={analyzing}>
                {analyzing ? 'Analyzing…' : '🔍 Analyze my collection'}
              </Button>
              {error && <p className="mt-3 text-sm font-semibold text-red-600">{error}</p>}
            </Card>
          )}

          {owned.length === 0 && (
            <Card className="p-8 text-center">
              <p className="mb-3 text-4xl">🪹</p>
              <p className="text-stone-500">Search above to add perfumes you own, and we&apos;ll find your missing pieces.</p>
            </Card>
          )}
        </>
      ) : (
        <>
          <Button variant="ghost" size="sm" onClick={() => setShowResults(false)} className="mb-6">
            ← Edit collection
          </Button>

          <div className="mb-8 grid gap-4 sm:grid-cols-3">
            <Card className="p-5 text-center">
              <p className="text-3xl font-bold text-violet-600">{owned.length}</p>
              <p className="text-sm text-stone-500">Perfumes owned</p>
            </Card>
            <Card className="p-5 text-center">
              <p className="text-3xl font-bold text-gold-600">{recos.length}</p>
              <p className="text-sm text-stone-500">Recommendations</p>
            </Card>
            <Card className="p-5 text-center">
              <p className="text-3xl">🎯</p>
              <p className="mt-1 text-sm text-stone-500">
                {gaps.length > 0 ? `Light on: ${gaps.join(', ')}` : 'Gaps identified'}
              </p>
            </Card>
          </div>

          {recos.length === 0 ? (
            <Card className="p-8 text-center">
              <p className="font-display text-xl font-bold">A well-rounded wardrobe!</p>
              <p className="mt-2 text-sm text-stone-500">Your collection already covers every scent family — nothing missing.</p>
            </Card>
          ) : (
            <>
              <h3 className="mb-4 font-display text-xl font-semibold">Recommended to complete your wardrobe</h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {recos.map((r) => (
                  <Link key={r.id} href={`/perfume/${r.slug}`}>
                    <Card className="flex h-full items-center gap-4 p-4 transition hover:shadow-card">
                      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-violet-600/15 font-display text-sm font-bold text-violet-700 dark:text-violet-300">
                        {r.score}
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate font-bold">{r.name}</span>
                        <span className="block truncate text-xs text-stone-400">{r.house}</span>
                        <span className="mt-1 block text-xs text-violet-600 dark:text-violet-300">✨ {r.reason}</span>
                      </span>
                    </Card>
                  </Link>
                ))}
              </div>
            </>
          )}

          <Card className="mt-8 p-6">
            <h3 className="mb-2 font-display text-lg font-semibold">💡 Wardrobe Tips</h3>
            <ul className="space-y-2 text-sm text-stone-600 dark:text-stone-300">
              <li>• A complete wardrobe has: 1 fresh daily, 1 warm evening, 1 formal office, 1 bold statement</li>
              <li>• Rotate seasonally — citrus shines in summer, amber/oud in winter</li>
              <li>• Your collection is saved in this browser</li>
            </ul>
          </Card>
        </>
      )}
    </div>
  );
}
