'use client';
import { useEffect, useState } from 'react';

/**
 * The kill switch. Three states:
 *   live         site normal
 *   maintenance  visitors see the branded maintenance page
 *   ghost        visitors get a blank 503 error (site looks dead)
 * Leaving "live" asks for confirmation; returning to live is one click.
 */
type Mode = 'live' | 'maintenance' | 'ghost';

const META: Record<Mode, { label: string; dot: string; btn: string }> = {
  live: { label: 'LIVE', dot: 'bg-emerald-500', btn: '' },
  maintenance: { label: 'MAINTENANCE', dot: 'bg-amber-500', btn: '' },
  ghost: { label: 'GHOST', dot: 'bg-red-500', btn: '' },
};

export default function MaintenanceToggle() {
  const [mode, setMode] = useState<Mode | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetch('/api/admin/maintenance')
      .then((r) => r.json())
      .then((d) => setMode(d.mode === 'maintenance' || d.mode === 'ghost' ? d.mode : 'live'))
      .catch(() => setMode('live'));
  }, []);

  async function apply(next: Mode) {
    if (next === mode || busy) return;
    if (next !== 'live' && !window.confirm(
      next === 'ghost'
        ? 'Ghost mode: every public page will return a blank error, the site will look dead. /admin stays up. Continue?'
        : 'Take the whole public site offline? Visitors will see a maintenance page. /admin stays up.'
    )) return;
    setBusy(true);
    try {
      const r = await fetch('/api/admin/maintenance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: next }),
      });
      const d = await r.json();
      if (r.ok) {
        setMode(d.mode === 'maintenance' || d.mode === 'ghost' ? d.mode : 'live');
      } else {
        window.alert(d.error || 'Could not change site status. The site was NOT changed.');
      }
    } catch {
      window.alert('Network error. The site was NOT changed.');
    } finally {
      setBusy(false);
    }
  }

  const m = mode ?? 'live';
  return (
    <div className="flex items-center gap-2 rounded-2xl border border-stone-200/70 bg-white/60 px-4 py-2.5 dark:border-white/10 dark:bg-white/[0.03]">
      <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-stone-500 dark:text-stone-400">
        <span className={`inline-block h-2.5 w-2.5 rounded-full ${META[m].dot}`} aria-hidden />
        Site {mode === null ? '…' : META[m].label}
      </span>
      <div className="flex gap-1.5">
        {(['live', 'maintenance', 'ghost'] as Mode[]).map((v) => (
          <button
            key={v}
            type="button"
            disabled={busy || mode === null || v === mode}
            onClick={() => apply(v)}
            className={`rounded-lg px-3 py-1.5 text-xs font-bold transition disabled:opacity-40 ${
              v === mode
                ? 'bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900'
                : v === 'live'
                  ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-300'
                  : v === 'maintenance'
                    ? 'bg-amber-100 text-amber-800 hover:bg-amber-200 dark:bg-amber-900/40 dark:text-amber-300'
                    : 'bg-red-100 text-red-800 hover:bg-red-200 dark:bg-red-900/40 dark:text-red-300'
            }`}
          >
            {busy && v !== mode ? '…' : v === 'live' ? 'Live' : v === 'maintenance' ? 'Maintenance' : 'Ghost'}
          </button>
        ))}
      </div>
    </div>
  );
}
