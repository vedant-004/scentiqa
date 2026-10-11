'use client';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  createGiveaway, updateGiveaway, toggleGiveaway,
  announceGiveawayWinner, deleteGiveaway,
} from '../actions';

function field(cls: string) {
  return cls;
}

const inputCls = 'w-full rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm text-stone-900 dark:border-white/10 dark:bg-ink-900 dark:text-white';

export function GiveawayForm({ existing }: { existing?: Record<string, unknown> }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);
  const isEdit = !!existing;

  const dt = (v: unknown) => {
    if (!v) return '';
    try { return new Date(String(v)).toISOString().slice(0, 16); } catch { return ''; }
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        setErr(null);
        const fd = new FormData(e.currentTarget);
        start(async () => {
          try {
            if (isEdit) await updateGiveaway(String(existing!.slug), fd);
            else await createGiveaway(fd);
            router.refresh();
            if (!isEdit) (e.target as HTMLFormElement).reset();
          } catch (ex) {
            setErr(ex instanceof Error ? ex.message : 'Failed to save');
          }
        });
      }}
      className="grid gap-3 sm:grid-cols-2"
    >
      {!isEdit && (
        <label className="block text-sm font-semibold">Slug (URL)
          <input name="slug" required className={inputCls} placeholder="diwali-2026-giveaway" />
        </label>
      )}
      <label className="block text-sm font-semibold">Title
        <input name="title" required defaultValue={isEdit ? String(existing!.title ?? '') : ''} className={inputCls} placeholder="Diwali Mega Giveaway" />
      </label>
      <label className="block text-sm font-semibold">Prize
        <input name="prize" defaultValue={isEdit ? String(existing!.prize ?? '') : ''} className={inputCls} placeholder="3 x 100ml designer bottles" />
      </label>
      <label className="block text-sm font-semibold sm:col-span-2">Description
        <textarea name="description" rows={2} defaultValue={isEdit ? String(existing!.description ?? '') : ''} className={inputCls} placeholder="What is up for grabs and how winners are picked" />
      </label>
      <label className="block text-sm font-semibold">Starts
        <input name="starts_at" type="datetime-local" defaultValue={isEdit ? dt(existing!.starts_at) : ''} className={inputCls} />
      </label>
      <label className="block text-sm font-semibold">Ends
        <input name="ends_at" type="datetime-local" defaultValue={isEdit ? dt(existing!.ends_at) : ''} className={inputCls} />
      </label>
      <label className="flex items-center gap-2 text-sm font-semibold">
        <input name="is_active" type="checkbox" defaultChecked={isEdit ? !!existing!.is_active : true} className="h-4 w-4" />
        Live (visible on homepage)
      </label>
      {isEdit && (
        <label className="block text-sm font-semibold">Winner user ID
          <input name="winner_user_id" defaultValue={String(existing!.winner_user_id ?? '')} className={inputCls} placeholder="paste winner's user id to announce" />
        </label>
      )}
      {err && <p className="text-sm font-semibold text-red-600 sm:col-span-2">{err}</p>}
      <div className="sm:col-span-2">
        <button
          type="submit" disabled={pending}
          className="rounded-xl bg-gold-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-gold-500 disabled:opacity-50"
        >
          {pending ? 'Saving…' : isEdit ? 'Save changes' : 'Create giveaway'}
        </button>
      </div>
    </form>
  );
}

export function GiveawayActions({ slug, active, hasWinner }: { slug: string; active: boolean; hasWinner: boolean }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [announcing, setAnnouncing] = useState(false);
  const [winnerId, setWinnerId] = useState('');

  const run = (fn: () => Promise<void>) => start(async () => { await fn(); router.refresh(); });

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        disabled={pending}
        onClick={() => run(() => toggleGiveaway(slug, !active))}
        className={`rounded-xl px-4 py-2 text-sm font-bold transition disabled:opacity-50 ${active ? 'bg-stone-500/15 text-stone-600 hover:bg-stone-500/25 dark:text-stone-300' : 'bg-emerald-500/15 text-emerald-700 hover:bg-emerald-500/25 dark:text-emerald-300'}`}
      >
        {active ? 'Close' : 'Go live'}
      </button>
      {!announcing ? (
        <button
          disabled={pending}
          onClick={() => setAnnouncing(true)}
          className="rounded-xl bg-gold-600/15 px-4 py-2 text-sm font-bold text-gold-700 hover:bg-gold-600/25 dark:text-gold-300"
        >
          {hasWinner ? 'Change winner' : 'Announce winner'}
        </button>
      ) : (
        <span className="flex items-center gap-2">
          <input
            value={winnerId} onChange={(e) => setWinnerId(e.target.value)}
            placeholder="winner user id"
            className="w-40 rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-ink-900 dark:text-white"
          />
          <button
            disabled={pending || !winnerId.trim()}
            onClick={() => run(async () => { await announceGiveawayWinner(slug, winnerId.trim()); setAnnouncing(false); })}
            className="rounded-xl bg-gold-600 px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
          >
            Confirm
          </button>
          <button onClick={() => setAnnouncing(false)} className="text-sm font-semibold text-stone-500">Cancel</button>
        </span>
      )}
      <button
        disabled={pending}
        onClick={() => { if (confirm('Delete this giveaway permanently?')) run(() => deleteGiveaway(slug)); }}
        className="rounded-xl bg-red-500/10 px-4 py-2 text-sm font-bold text-red-600 hover:bg-red-500/20 dark:text-red-400"
      >
        Delete
      </button>
    </div>
  );
}
