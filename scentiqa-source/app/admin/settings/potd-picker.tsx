'use client';
// Perfume search + select for the Perfume-of-the-Day override.
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { inputCls, AdminButton } from '../components';

type Hit = { slug: string; name: string; house: string };

export function PotdPicker({ currentSlug, saveAction }: {
  currentSlug: string;
  saveAction: (value: Record<string, unknown>) => Promise<void>;
}) {
  const [q, setQ] = useState('');
  const [hits, setHits] = useState<Hit[]>([]);
  const [picked, setPicked] = useState<Hit | null>(null);
  const [saving, setSaving] = useState(false);
  const router = useRouter();
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    if (!q.trim()) { setHits([]); return; }
    timer.current = setTimeout(async () => {
      try {
        const r = await fetch(`/api/search?q=${encodeURIComponent(q.trim())}`);
        const j = await r.json();
        setHits((j.results ?? []) as Hit[]);
      } catch { setHits([]); }
    }, 250);
    return () => { if (timer.current) clearTimeout(timer.current); };
  }, [q]);

  return (
    <div>
      <div className="relative max-w-md">
        <input
          value={q}
          onChange={(e) => { setQ(e.target.value); setPicked(null); }}
          placeholder="Search perfumes…"
          className={inputCls}
        />
        {hits.length > 0 && !picked && (
          <div className="absolute inset-x-0 top-full z-10 mt-1 max-h-64 overflow-auto rounded-xl border border-stone-200 bg-white shadow-lg dark:border-white/10 dark:bg-stone-900">
            {hits.map((h) => (
              <button
                key={h.slug}
                type="button"
                onClick={() => { setPicked(h); setHits([]); setQ(h.name); }}
                className="block w-full px-3 py-2 text-left text-sm hover:bg-stone-50 dark:hover:bg-white/5"
              >
                <span className="font-semibold">{h.name}</span>
                <span className="ml-2 text-xs text-stone-400">{h.house}</span>
              </button>
            ))}
          </div>
        )}
      </div>
      {picked && (
        <form
          className="mt-3 flex items-center gap-3"
          action={async () => {
            setSaving(true);
            try { await saveAction({ perfume_slug: picked.slug }); } finally { setSaving(false); }
            router.refresh();
          }}
        >
          <span className="text-sm">Selected: <strong>{picked.name}</strong> <span className="text-stone-400">({picked.house})</span></span>
          <AdminButton>{saving ? 'Saving…' : 'Set as Perfume of the Day'}</AdminButton>
        </form>
      )}
      {!picked && currentSlug && (
        <p className="mt-2 text-xs text-stone-400">Search above to pick a different perfume, or clear the override below.</p>
      )}
    </div>
  );
}
