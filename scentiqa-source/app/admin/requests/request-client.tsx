'use client';
import { useState } from 'react';
import { setRequestStatus, deleteRequest } from '../actions';

export function RequestActions({ id, status }: { id: string; status: string }) {
  const [busy, setBusy] = useState(false);
  const run = async (fn: () => Promise<void>) => {
    if (!confirm('Are you sure?')) return;
    setBusy(true);
    try { await fn(); } finally { setBusy(false); }
  };
  return (
    <div className="flex flex-wrap gap-2">
      {status === 'open' && (
        <>
          <button disabled={busy} onClick={() => run(() => setRequestStatus(id, 'added'))}
            className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-50">
            Mark added
          </button>
          <button disabled={busy} onClick={() => run(() => setRequestStatus(id, 'declined'))}
            className="rounded-lg bg-stone-500 px-3 py-1.5 text-xs font-bold text-white hover:bg-stone-600 disabled:opacity-50">
            Decline
          </button>
        </>
      )}
      {status !== 'open' && (
        <button disabled={busy} onClick={() => run(() => setRequestStatus(id, 'open'))}
          className="rounded-lg bg-sky-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-sky-700 disabled:opacity-50">
          Reopen
        </button>
      )}
      <button disabled={busy} onClick={() => run(() => deleteRequest(id))}
        className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-red-700 disabled:opacity-50">
        Delete
      </button>
    </div>
  );
}
