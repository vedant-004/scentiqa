// Client-side forms for admin battle management.
'use client';
import { useState } from 'react';
import {
  createBattle, updateBattleStatus, addBattleEntry, removeBattleEntry,
  generateBracket, setMatchupWinner, advanceRound,
} from './actions';

const inputCls = 'rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-white/[0.05]';
const btnCls = 'rounded-xl bg-stone-900 px-4 py-2 text-sm font-bold text-white hover:bg-stone-700 dark:bg-white dark:text-stone-900';
const smallBtn = 'rounded-lg bg-stone-900 px-2.5 py-1 text-xs font-bold text-white hover:bg-stone-700 dark:bg-white dark:text-stone-900';

export function BattleForms(props: {
  battleId?: string; status?: string; addEntry?: boolean; genBracket?: boolean;
  advance?: boolean; setWinner?: boolean; matchupId?: string; removePerfumeId?: string;
}) {
  const { battleId } = props;
  const [err, setErr] = useState('');

  const run = async (fn: () => Promise<unknown>) => {
    setErr('');
    try { await fn(); } catch (e) { setErr(e instanceof Error ? e.message : 'Failed'); }
  };

  if (props.removePerfumeId) {
    return <button className={smallBtn} onClick={() => run(() => removeBattleEntry(battleId!, props.removePerfumeId!))}>Remove</button>;
  }

  if (props.setWinner) {
    return (
      <form className="mt-1 flex gap-1" action={(fd) => run(() => setMatchupWinner(battleId!, props.matchupId!, String(fd.get('winner') ?? '')))}>
        <input name="winner" placeholder="winner perfume_id" className={inputCls + ' w-40'} required />
        <button className={smallBtn}>Set winner</button>
      </form>
    );
  }

  if (props.genBracket) {
    return <button className={smallBtn} onClick={() => run(() => generateBracket(battleId!))}>⚙ Generate round-1 bracket</button>;
  }

  if (props.advance) {
    return (
      <form className="flex gap-1" action={(fd) => run(() => advanceRound(battleId!, Number(fd.get('round') ?? 1)))}>
        <input name="round" type="number" defaultValue={1} min={1} className={inputCls + ' w-16'} />
        <button className={smallBtn}>Advance round →</button>
      </form>
    );
  }

  if (props.addEntry) {
    return (
      <form className="mt-3 flex flex-wrap gap-2" action={(fd) => run(() => addBattleEntry(battleId!, fd))}>
        <input name="perfume_id" placeholder="perfume id" className={inputCls + ' w-48'} required />
        <input name="seed" type="number" placeholder="seed" className={inputCls + ' w-20'} />
        <button className={smallBtn}>+ Add entry</button>
        {err && <p className="w-full text-xs text-red-600">{err}</p>}
      </form>
    );
  }

  if (battleId) {
    return (
      <form className="flex items-center gap-2" action={(fd) => run(() => updateBattleStatus(battleId, String(fd.get('status'))))}>
        <select name="status" defaultValue={props.status} className={inputCls}>
          <option value="upcoming">upcoming</option>
          <option value="active">active</option>
          <option value="completed">completed</option>
        </select>
        <button className={smallBtn}>Set status</button>
        {err && <p className="text-xs text-red-600">{err}</p>}
      </form>
    );
  }

  // Create battle form
  return (
    <form className="rounded-2xl border border-stone-200 bg-white p-5 dark:border-white/10 dark:bg-white/[0.03]"
      action={(fd) => run(() => createBattle(fd))}>
      <p className="text-sm font-bold">+ New battle</p>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        <input name="title" placeholder="Title (e.g. Monsoon Madness 2026)" className={inputCls} required />
        <input name="theme" placeholder="Theme / description" className={inputCls} />
        <input name="starts_at" type="datetime-local" className={inputCls} />
        <input name="ends_at" type="datetime-local" className={inputCls} />
      </div>
      <button className={btnCls + ' mt-3'}>Create battle</button>
      {err && <p className="mt-2 text-xs text-red-600">{err}</p>}
    </form>
  );
}
