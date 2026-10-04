'use client';
import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui';

interface Note { slug: string; name: string; category: string; count: number }

export function NotesIndexClient({ notes, catLabel }: { notes: Note[]; catLabel: Record<string, string> }) {
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
        {filtered.map((n) => (
          <Link key={n.slug} href={`/notes/${n.slug}`}>
            <Card className="group p-4 transition hover:-translate-y-0.5 hover:shadow-md">
              <p className="font-display text-base font-bold group-hover:text-gold-700 dark:group-hover:text-gold-300">{n.name}</p>
              <p className="mt-1 text-xs text-stone-400">{catLabel[n.category] ?? n.category} · {n.count.toLocaleString('en-IN')} perfumes</p>
            </Card>
          </Link>
        ))}
      </div>
      {filtered.length === 0 && <p className="py-10 text-center text-sm text-stone-400">No notes match “{q}”.</p>}
    </div>
  );
}
