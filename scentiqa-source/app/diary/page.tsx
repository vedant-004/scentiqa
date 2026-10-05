// SOTD Wear Diary — one-tap daily scent logging with streaks and calendar history.
'use client';
import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Button, Card, SectionHeading, Skeleton } from '@/components';
import { useAuth } from '@/components/auth';

interface LogEntry {
  id: string; worn_on: string; notes: string | null;
  perfumes: { id: string; slug: string; name: string; bottle_image_url: string | null; houses: { name: string } | { name: string }[] | null };
}
interface SearchHit { id: string; slug: string; name: string; house: string }

function houseName(h: { name: string } | { name: string }[] | null): string {
  if (!h) return '';
  return Array.isArray(h) ? (h[0]?.name ?? '') : h.name;
}

export default function DiaryPage() {
  const { user, loading } = useAuth();
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [streak, setStreak] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const [q, setQ] = useState('');
  const [hits, setHits] = useState<SearchHit[]>([]);
  const [showHits, setShowHits] = useState(false);

  const refresh = useCallback(async () => {
    const [h, s] = await Promise.all([
      fetch('/api/diary/history?limit=120').then((r) => r.json()).catch(() => ({})),
      fetch('/api/diary/streak').then((r) => r.json()).catch(() => ({})),
    ]);
    setLogs(h.logs ?? []);
    setStreak(typeof s.streak === 'number' ? s.streak : null);
  }, []);

  useEffect(() => { if (user) refresh(); }, [user, refresh]);

  useEffect(() => {
    if (q.trim().length < 2) { setHits([]); setShowHits(false); return; }
    const t = setTimeout(async () => {
      try {
        const r = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
        const j = await r.json();
        setHits((j.results ?? []).slice(0, 6));
        setShowHits(true);
      } catch { /* offline */ }
    }, 250);
    return () => clearTimeout(t);
  }, [q]);

  const logScent = async (perfume_id: string, name: string) => {
    setBusy(true); setMsg('');
    try {
      const r = await fetch('/api/diary/log', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ perfume_id }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error ?? 'Failed to log');
      setMsg(`Logged — you're wearing ${name} today.`);
      setQ(''); setHits([]); setShowHits(false);
      await refresh();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'Failed to log');
    } finally { setBusy(false); }
  };

  // Group logs by month for the calendar-ish view
  const byMonth = useMemo(() => {
    const m = new Map<string, LogEntry[]>();
    for (const l of logs) {
      const key = l.worn_on.slice(0, 7);
      if (!m.has(key)) m.set(key, []);
      m.get(key)!.push(l);
    }
    return [...m.entries()].sort((a, b) => b[0].localeCompare(a[0]));
  }, [logs]);

  const todayKey = new Date().toISOString().slice(0, 10);
  const loggedToday = logs.some((l) => l.worn_on === todayKey);

  if (loading) return <div className="mx-auto max-w-4xl px-4 py-10"><Skeleton className="h-64" /></div>;
  if (!user) return (
    <div className="mx-auto max-w-2xl px-4 py-16 text-center">
      <SectionHeading kicker="Wear Diary" title="Log your scent of the day" />
      <p className="mt-4 text-stone-500">Sign in to start your wear diary and build a streak.</p>
      <Link href="/login" className="mt-6 inline-block"><Button>Sign in</Button></Link>
    </div>
  );

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <SectionHeading kicker="SOTD Wear Diary" title="What are you wearing today?" />

      {/* Streak banner */}
      <Card className="mt-6 flex items-center justify-between p-5">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-stone-400">Current streak</p>
          <p className="font-display text-4xl font-bold text-stone-900 dark:text-white">
            {streak === null ? '—' : `${streak} 🔥`}
          </p>
          <p className="mt-1 text-sm text-stone-500">{streak === 1 ? 'day in a row' : 'days in a row'}</p>
        </div>
        <div className="text-right">
          <p className="text-xs font-bold uppercase tracking-wider text-stone-400">Today</p>
          <p className="mt-1 text-sm font-semibold text-stone-700 dark:text-stone-200">
            {loggedToday ? '✅ Logged' : 'Not logged yet'}
          </p>
        </div>
      </Card>

      {/* One-tap log */}
      <div className="relative mt-6">
        <label className="text-sm font-bold text-stone-700 dark:text-stone-200">Log today&apos;s scent</label>
        <input
          value={q} onChange={(e) => setQ(e.target.value)} onFocus={() => q.trim().length >= 2 && setShowHits(true)}
          placeholder="Search perfumes…"
          className="mt-2 w-full rounded-2xl border border-stone-300/80 bg-white/80 px-4 py-3 text-[15px] outline-none focus:border-gold-600 dark:border-ink-700 dark:bg-ink-800/80"
        />
        {showHits && hits.length > 0 && (
          <div className="absolute inset-x-0 top-full z-30 mt-2 overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-lift dark:border-ink-700 dark:bg-ink-900">
            {hits.map((h) => (
              <button key={h.id} disabled={busy} onClick={() => logScent(h.id, h.name)}
                className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-cream-100 disabled:opacity-60 dark:hover:bg-white/5">
                <span><span className="block text-sm font-semibold">{h.name}</span>
                <span className="block text-xs text-stone-400">{h.house}</span></span>
                <span className="text-xs font-bold text-gold-700 dark:text-gold-300">+ Log</span>
              </button>
            ))}
          </div>
        )}
      </div>
      {msg && <p className="mt-3 text-sm font-semibold text-emerald-700 dark:text-emerald-300">{msg}</p>}

      {/* History by month */}
      <div className="mt-10 space-y-8">
        {byMonth.length === 0 && (
          <p className="text-sm text-stone-500">No logs yet — your wear history will appear here.</p>
        )}
        {byMonth.map(([month, entries]) => (
          <section key={month}>
            <h2 className="font-display text-xl font-bold text-stone-900 dark:text-white">
              {new Date(month + '-02').toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
              <span className="ml-2 text-sm font-semibold text-stone-400">{entries.length} wear{entries.length === 1 ? '' : 's'}</span>
            </h2>
            <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {entries.map((l) => (
                <Link key={l.id} href={`/perfume/${l.perfumes.slug}`}>
                  <Card className="p-3 transition hover:shadow-card">
                    <p className="text-xs font-bold text-stone-400">
                      {new Date(l.worn_on + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    </p>
                    <p className="mt-1 truncate text-sm font-bold">{l.perfumes.name}</p>
                    <p className="truncate text-xs text-stone-400">{houseName(l.perfumes.houses)}</p>
                  </Card>
                </Link>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
