'use client';
import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui';

interface Accord { slug: string; name: string; count: number; avgStrength: number }

export function AccordsIndexClient({ accords }: { accords: Accord[] }) {
  const [q, setQ] = useState('');
  const filtered = useMemo(() => {
    const needle = q.toLowerCase().trim();
    return accords.filter((a) => !needle || a.name.toLowerCase().includes(needle)).slice(0, 200);
  }, [accords, q]);

  return (
    <div>
      <input
        value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search accords… e.g. smoky, gourmand, aquatic"
        className="mb-4 w-full rounded-xl border border-stone-200 bg-white px-4 py-2.5 text-sm shadow-sm focus:border-gold-500 focus:outline-none dark:border-white/10 dark:bg-white/[0.05]"
      />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {filtered.map((a) => (
          <Link key={a.slug} href={`/accords/${a.slug}`}>
            <Card className="group p-4 transition hover:-translate-y-0.5 hover:shadow-md">
              <p className="font-display text-base font-bold capitalize group-hover:text-gold-700 dark:group-hover:text-gold-300">{a.name}</p>
              <p className="mt-1 text-xs text-stone-400">{a.count.toLocaleString('en-IN')} perfumes · avg strength {a.avgStrength}</p>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-stone-100 dark:bg-white/10">
                <div className="h-full rounded-full bg-gold-500" style={{ width: `${Math.min(100, a.avgStrength)}%` }} />
              </div>
            </Card>
          </Link>
        ))}
      </div>
      {filtered.length === 0 && <p className="py-10 text-center text-sm text-stone-400">No accords match “{q}”.</p>}
    </div>
  );
}
