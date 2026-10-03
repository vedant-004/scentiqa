// /finder — pick 3 perfumes you like, get recommendations with reasons.
'use client';
import { useState } from 'react';
import Link from 'next/link';
import { Button, Card, EmptyState, SectionHeading, Skeleton } from '@/components';
import { PerfumeCard } from '@/components/domain';
import { SearchBar } from '@/components/layout';

interface Rec { perfume: { slug: string; name: string; house: string; ratingAvg: number; lowestPriceInr: number | null; isDupe: boolean }; reason: string }

export default function FinderPage() {
  const [liked, setLiked] = useState<Array<{ slug: string; name: string }>>([]);
  const [recs, setRecs] = useState<Rec[]>([]);
  const [loading, setLoading] = useState(false);

  const add = (slug: string, name: string) => {
    if (!liked.some((l) => l.slug === slug) && liked.length < 5) setLiked([...liked, { slug, name }]);
  };

  const find = async () => {
    setLoading(true);
    try {
      const r = await fetch(`/api/finder?liked=${liked.map((l) => l.slug).join(',')}`);
      const j = await r.json();
      setRecs(j.recs ?? []);
    } catch { setRecs([]); }
    setLoading(false);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 pt-8 sm:px-6">
      <div className="mx-auto max-w-2xl text-center">
        <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.16em] text-gold-600 dark:text-gold-400">Scentiqa finder</p>
        <h1 className="font-display text-4xl font-bold tracking-tight sm:text-5xl">Not sure what you&rsquo;d like?</h1>
        <p className="mt-3 text-[15px] text-stone-500 dark:text-stone-400">
          Tell us up to 5 perfumes you already love. We&rsquo;ll recommend new ones and explain <em>why</em> each one fits your taste.
        </p>
      </div>

      <div className="mx-auto mt-8 max-w-xl">
        <SearchBar onPick={add} />
        <div className="mt-3 flex flex-wrap gap-2">
          {liked.map((l) => (
            <span key={l.slug} className="flex items-center gap-1.5 rounded-full bg-gold-600/15 py-1.5 pl-4 pr-2 text-sm font-semibold text-gold-800 dark:text-gold-200">
              {l.name}
              <button onClick={() => setLiked(liked.filter((x) => x.slug !== l.slug))} aria-label={`Remove ${l.name}`}
                className="rounded-full p-1 text-xs hover:bg-black/10">✕</button>
            </span>
          ))}
        </div>
        <Button className="mt-4 w-full" size="lg" disabled={liked.length === 0 || loading} onClick={find}>
          {loading ? 'Finding your matches…' : `Find my matches${liked.length ? ` (${liked.length})` : ''}`}
        </Button>
      </div>

      <div className="mx-auto mt-10 max-w-3xl">
        {loading ? (
          <div className="space-y-4">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-40" />)}</div>
        ) : recs.length > 0 ? (
          <div className="space-y-4">
            <h2 className="font-display text-2xl font-semibold tracking-tight">Your matches</h2>
            {recs.map((r, i) => (
              <Card key={r.perfume.slug} className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-gold-600 dark:text-gold-400">Match #{i + 1}</span>
                    <Link href={`/perfume/${r.perfume.slug}`} className="mt-0.5 block font-display text-xl font-semibold hover:text-gold-700 dark:hover:text-gold-300">
                      {r.perfume.name} <span className="text-sm font-normal text-stone-400">by {r.perfume.house}</span>
                    </Link>
                  </div>
                  <Link href={`/perfume/${r.perfume.slug}`}><Button size="sm" variant="outline">View</Button></Link>
                </div>
                <p className="mt-3 flex gap-2 text-sm text-stone-600 dark:text-stone-300">
                  <span className="text-emerald-500">✓</span>{r.reason}
                </p>
              </Card>
            ))}
          </div>
        ) : (
          liked.length === 0 && (
            <EmptyState icon="🧭" title="Add some perfumes you love" body="The more you add, the sharper your recommendations." />
          )
        )}
      </div>

      <div className="mx-auto mt-14 max-w-4xl">
        <SectionHeading kicker="Popular starting points" title="Trending now" />
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {['aventus', 'khamrah', 'baccarat-rouge-540', 'hawas-for-him'].map((s) => (
            <button key={s} onClick={() => add(s, s.replace(/-/g, ' '))} className="text-left">
              <PerfumeCard perfume={{ slug: s, name: s.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()), house: '—', ratingAvg: 4.3, lowestPriceInr: null, isDupe: false }} />
            </button>
          ))}
        </div>
        <p className="mt-6 text-center text-sm text-stone-400">
          Want a cheaper alternative to something specific? <Link href="/find-alternative" className="font-semibold text-gold-700 hover:underline dark:text-gold-300">Use the dupe finder →</Link>
        </p>
      </div>
    </div>
  );
}
