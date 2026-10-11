'use client';
import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui';

interface Note { slug: string; name: string; category: string; count: number }

export function NotesIndexClient({ notes, catLabel, images }: { notes: Note[]; catLabel: Record<string, string>; images?: Record<string, string | null> }) {
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('all');
  const cats = useMemo(() => ['all', ...Array.from(new Set(notes.map((n) => n.category))).sort()], [notes]);
  const filtered = useMemo(() => {
    const needle = q.toLowerCase().trim();
    return notes.filter((n) =>
      (cat === 'all' || n.category === cat) &&
      (!needle || n.name.toLowerCase().includes(needle)),
    ).slice(0, 400);
  }, [notes, q, cat]);

  return (
    <div>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <input
          value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search notes… e.g. oud, vetiver, yuzu"
          className="w-full rounded-xl border border-stone-200 bg-white px-4 py-2.5 text-sm shadow-sm focus:border-gold-500 focus:outline-none dark:border-white/10 dark:bg-white/[0.05]"
        />
        <div className="flex flex-wrap gap-1.5">
          {cats.map((c) => (
            <button key={c} onClick={() => setCat(c)}
              className={`rounded-full px-3 py-1.5 text-xs font-bold transition ${cat === c ? 'bg-stone-900 text-white dark:bg-white dark:text-stone-900' : 'bg-stone-100 text-stone-500 hover:bg-stone-200 dark:bg-white/[0.06] dark:text-stone-400'}`}>
              {c === 'all' ? 'All' : (catLabel[c] ?? c)}
            </button>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {filtered.map((n) => {
          const img = images?.[n.slug] ?? null;
          return (
            <Link key={n.slug} href={`/notes/${n.slug}`}>
              <Card className="group overflow-hidden p-0 transition hover:-translate-y-0.5 hover:shadow-md">
                {img ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={img} alt={n.name} loading="lazy" className="h-28 w-full object-cover transition-transform duration-300 group-hover:scale-105" />
                ) : (
                  <div className="flex h-28 w-full items-center justify-center bg-gradient-to-br from-gold-200 via-amber-100 to-stone-200 text-3xl font-black text-stone-400 dark:from-gold-700/40 dark:via-ink-700 dark:to-ink-800 dark:text-gold-300/60" aria-hidden="true">
                    {n.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="p-4">
                  <p className="font-display text-base font-bold group-hover:text-gold-700 dark:group-hover:text-gold-300">{n.name}</p>
                  <p className="mt-1 text-xs text-stone-400">{catLabel[n.category] ?? n.category} · {n.count.toLocaleString('en-IN')} perfumes</p>
                </div>
              </Card>
            </Link>
          );
        })}
      </div>
      {filtered.length === 0 && <p className="py-10 text-center text-sm text-stone-400">No notes match “{q}”.</p>}
    </div>
  );
}
