'use client';
import { useEffect, useState } from 'react';

/**
 * The kill switch. Shows the live site status and flips it.
 * Taking the site OFFLINE asks for confirmation; bringing it back LIVE is
 * one click, no confirm — speed matters in that direction.
 */
export default function MaintenanceToggle() {
  const [enabled, setEnabled] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetch('/api/admin/maintenance')
      .then((r) => r.json())
      .then((d) => setEnabled(d.enabled === true))
      .catch(() => setEnabled(false));
  }, []);

  async function flip(next: boolean) {
    if (next && !window.confirm('Take the whole public site offline? Visitors will see a maintenance page. /admin stays up.'))
      return;
    setBusy(true);
    try {
      const r = await fetch('/api/admin/maintenance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: next }),
      });
      const d = await r.json();
      if (r.ok) {
        setEnabled(d.enabled === true);
      } else {
        window.alert(d.error || 'Could not change site status. The site was NOT changed.');
      }
    } catch {
      window.alert('Network error. The site was NOT changed.');
    } finally {
      setBusy(false);
    }
  }

  const label = enabled === null ? '…' : enabled ? 'OFFLINE' : 'LIVE';
  const dot = enabled ? 'bg-red-500' : 'bg-emerald-500';

  return (
    <div className="flex items-center gap-3 rounded-2xl border border-stone-200/70 bg-white/60 px-4 py-2.5 dark:border-white/10 dark:bg-white/[0.03]">
      <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-stone-500 dark:text-stone-400">
        <span className={`inline-block h-2.5 w-2.5 rounded-full ${dot}`} aria-hidden />
        Site {label}
      </span>
      <button
        type="button"
        disabled={busy || enabled === null}
        onClick={() => flip(!enabled)}
        className={`rounded-xl px-4 py-2 text-sm font-bold text-white transition disabled:opacity-50 ${
          enabled
            ? 'bg-emerald-600 hover:bg-emerald-500'
            : 'bg-red-700 hover:bg-red-600'
        }`}
      >
        {busy ? 'Working…' : enabled ? 'Bring site live' : 'Take site offline'}
      </button>
    </div>
  );
}
