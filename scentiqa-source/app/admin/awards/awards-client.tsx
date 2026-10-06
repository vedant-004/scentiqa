// Client-side forms for admin awards management.
'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  createCategory, updateCategory, deleteCategory, cloneEdition,
  addNominee, removeNominee, setWinner, searchPerfumes, searchHouses,
} from './actions';
import type { AwardCategory } from '@/lib/types';

const inputCls = 'rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-white/[0.05]';
const btnCls = 'rounded-xl bg-stone-900 px-4 py-2 text-sm font-bold text-white hover:bg-stone-700 dark:bg-white dark:text-stone-900';
const smallBtn = 'rounded-lg bg-stone-900 px-2.5 py-1 text-xs font-bold text-white hover:bg-stone-700 dark:bg-white dark:text-stone-900';
const dangerBtn = 'rounded-lg bg-red-600 px-2.5 py-1 text-xs font-bold text-white hover:bg-red-700';
const goldBtn = 'rounded-lg bg-gold-600 px-2.5 py-1 text-xs font-bold text-white hover:bg-gold-700';

function Err({ msg }: { msg: string }) {
  if (!msg) return null;
  return <p className="w-full text-xs text-red-600">{msg}</p>;
}

export function EditionTools({ years, currentYear }: { years: number[]; currentYear: number }) {
  const [err, setErr] = useState('');
  const router = useRouter();
  const run = async (fn: () => Promise<unknown>) => {
    setErr('');
    try { await fn(); router.refresh(); } catch (e) { setErr(e instanceof Error ? e.message : 'Failed'); }
  };
  return (
    <div className="mb-6 flex flex-wrap items-end gap-6 rounded-2xl border border-stone-200 bg-white p-5 dark:border-white/10 dark:bg-white/[0.03]">
      <form className="flex flex-wrap items-end gap-2" action={(fd) => run(() => cloneEdition(Number(fd.get('fromYear')), Number(fd.get('toYear'))))}>
        <div>
          <p className="mb-1 text-xs font-bold uppercase tracking-wider text-stone-400">New edition</p>
          <div className="flex gap-2">
            <select name="fromYear" defaultValue={currentYear} className={inputCls}>
              {years.map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
            <span className="self-center text-stone-400">→</span>
            <input name="toYear" type="number" placeholder="2027" className={inputCls + ' w-24'} required />
            <button className={btnCls}>Clone categories</button>
          </div>
          <p className="mt-1 text-xs text-stone-400">Copies categories (no nominees) into the new year.</p>
        </div>
        <Err msg={err} />
      </form>
      <AddCategoryForm year={currentYear} />
    </div>
  );
}

function AddCategoryForm({ year }: { year: number }) {
  const [err, setErr] = useState('');
  const router = useRouter();
  return (
    <form className="flex flex-wrap items-end gap-2"
      action={(fd) => { setErr(''); createCategory(year, fd).then(() => router.refresh()).catch((e) => setErr(e instanceof Error ? e.message : 'Failed')); }}>
      <div>
        <p className="mb-1 text-xs font-bold uppercase tracking-wider text-stone-400">Add category</p>
        <div className="flex flex-wrap gap-2">
          <input name="name" placeholder="Category name" className={inputCls + ' w-52'} required />
          <input name="icon" placeholder="🏆" className={inputCls + ' w-16'} maxLength={8} />
          <select name="section" className={inputCls} defaultValue="indian">
            <option value="indian">Indian</option>
            <option value="global">Global</option>
          </select>
          <select name="nominee_type" className={inputCls} defaultValue="perfume">
            <option value="perfume">Perfumes</option>
            <option value="house">Houses</option>
          </select>
          <input name="sort_order" type="number" placeholder="order" className={inputCls + ' w-20'} />
          <button className={btnCls}>+ Add</button>
        </div>
        <input name="description" placeholder="Short description (optional)" className={inputCls + ' mt-2 w-full'} />
      </div>
      <Err msg={err} />
    </form>
  );
}

export function CategoryManager({ category }: { category: AwardCategory }) {
  const [err, setErr] = useState('');
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const router = useRouter();
  const run = async (fn: () => Promise<unknown>) => {
    setErr('');
    try { await fn(); router.refresh(); } catch (e) { setErr(e instanceof Error ? e.message : 'Failed'); }
  };
  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-5 dark:border-white/10 dark:bg-white/[0.03]">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <form className="flex flex-1 flex-wrap items-end gap-2"
          action={(fd) => run(() => updateCategory(category.id, fd))}>
          <input name="icon" defaultValue={category.icon} className={inputCls + ' w-16'} maxLength={8} />
          <input name="name" defaultValue={category.name} className={inputCls + ' w-56'} required />
          <select name="section" defaultValue={category.section} className={inputCls}>
            <option value="indian">Indian</option>
            <option value="global">Global</option>
          </select>
          <input name="sort_order" type="number" defaultValue={category.sortOrder} className={inputCls + ' w-20'} />
          <button className={smallBtn}>Save</button>
          <input name="description" defaultValue={category.description} placeholder="Description" className={inputCls + ' w-full'} />
        </form>
        <div className="flex gap-2">
          <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-bold text-stone-500 dark:bg-white/10">
            {category.nomineeType === 'house' ? '⌂ Houses' : '⚗ Perfumes'} · {category.nominees.length} nominees
          </span>
          {confirmingDelete ? (
            <>
              <button className={dangerBtn} onClick={() => run(() => deleteCategory(category.id))}>Confirm delete</button>
              <button className={smallBtn} onClick={() => setConfirmingDelete(false)}>Cancel</button>
            </>
          ) : (
            <button className={dangerBtn} onClick={() => setConfirmingDelete(true)}>Delete</button>
          )}
        </div>
      </div>
      <Err msg={err} />

      <div className="mt-4">
        <p className="text-xs font-bold uppercase tracking-wider text-stone-400">Nominees</p>
        {category.nominees.length === 0 && (
          <p className="mt-2 text-sm text-stone-400">No nominees yet — add some below.</p>
        )}
        <ul className="mt-2 space-y-2">
          {category.nominees.map((n) => (
            <li key={n.rowId} className={`flex items-center gap-3 rounded-xl border px-3 py-2 ${n.isWinner ? 'border-gold-500 bg-gold-500/10' : 'border-stone-200 dark:border-white/10'}`}>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">
                  {n.isWinner && <span className="mr-1">👑</span>}
                  {n.name}
                  {n.houseName && <span className="ml-1 font-normal text-stone-400">· {n.houseName}</span>}
                </p>
              </div>
              {n.isWinner ? (
                <button className={smallBtn} onClick={() => run(() => setWinner(category.id, null))}>Clear winner</button>
              ) : (
                <button className={goldBtn} onClick={() => run(() => setWinner(category.id, n.rowId))}>Make winner</button>
              )}
              <button className={dangerBtn} onClick={() => run(() => removeNominee(n.rowId))}>Remove</button>
            </li>
          ))}
        </ul>
        <NomineePicker categoryId={category.id} kind={category.nomineeType} />
      </div>
    </div>
  );
}

function NomineePicker({ categoryId, kind }: { categoryId: number; kind: 'perfume' | 'house' }) {
  const [q, setQ] = useState('');
  const [results, setResults] = useState<Array<{ id: string; name: string; house?: string }>>([]);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  const search = async (v: string) => {
    setQ(v);
    if (v.trim().length < 2) { setResults([]); return; }
    const r = kind === 'house' ? await searchHouses(v) : await searchPerfumes(v);
    setResults(r);
  };

  const add = async (id: string) => {
    setErr(''); setBusy(true);
    try {
      await addNominee(categoryId, kind, id);
      setResults([]); setQ('');
      router.refresh();
    } catch (e) { setErr(e instanceof Error ? e.message : 'Failed'); }
    setBusy(false);
  };

  return (
    <div className="mt-3">
      <div className="flex flex-wrap items-center gap-2">
        <input value={q} onChange={(e) => search(e.target.value)} placeholder={`Search ${kind === 'house' ? 'houses' : 'perfumes'} to nominate…`} className={inputCls + ' w-64'} />
        {busy && <span className="text-xs text-stone-400">Adding…</span>}
      </div>
      <Err msg={err} />
      {results.length > 0 && (
        <ul className="mt-2 max-h-56 overflow-auto rounded-xl border border-stone-200 dark:border-white/10">
          {results.map((r) => (
            <li key={r.id} className="flex items-center justify-between gap-2 border-b border-stone-100 px-3 py-2 text-sm last:border-0 dark:border-white/5">
              <span className="truncate">{r.name}{r.house ? <span className="text-stone-400"> · {r.house}</span> : null}</span>
              <button className={smallBtn} onClick={() => add(r.id)}>+ Nominate</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
