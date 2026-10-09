'use client';
import { useState } from 'react';
import { createSniffStore, updateSniffStore, deleteSniffStore } from '../actions';

const TYPES = ['niche', 'designer', 'attar', 'department', 'multi'];

interface Store {
  id: string; name: string; city: string; area: string; address: string;
  store_type: string; brands_text: string; samples_info: string; website: string; verified: boolean;
}

function StoreFields({ store }: { store?: Store }) {
  const v = (k: keyof Store) => (store ? String(store[k] ?? '') : '');
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      <input name="name" required placeholder="Store name *" defaultValue={v('name')}
        className="rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-white/5" />
      <input name="city" required placeholder="City *" defaultValue={v('city')}
        className="rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-white/5" />
      <input name="area" placeholder="Area / neighborhood" defaultValue={v('area')}
        className="rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-white/5" />
      <input name="address" placeholder="Full address" defaultValue={v('address')}
        className="rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-white/5" />
      <select name="store_type" defaultValue={store?.store_type ?? 'niche'}
        className="rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-white/5">
        {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
      </select>
      <input name="website" placeholder="Website URL" defaultValue={v('website')}
        className="rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-white/5" />
      <input name="brands_text" placeholder="Brands stocked (one line)" defaultValue={v('brands_text')}
        className="rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm sm:col-span-2 dark:border-white/10 dark:bg-white/5" />
      <input name="samples_info" placeholder="Samples info (e.g. discovery sets available)" defaultValue={v('samples_info')}
        className="rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm sm:col-span-2 dark:border-white/10 dark:bg-white/5" />
      <label className="flex items-center gap-2 text-sm font-medium sm:col-span-2">
        <input type="checkbox" name="verified" defaultChecked={store?.verified ?? true} className="h-4 w-4" />
        Verified (researched, real store)
      </label>
    </div>
  );
}

export function SniffStoreForm({ store }: { store?: Store }) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  if (!open) {
    return (
      <button onClick={() => setOpen(true)}
        className="rounded-lg bg-stone-900 px-3 py-1.5 text-xs font-bold text-white hover:bg-stone-700 dark:bg-white dark:text-stone-900">
        {store ? 'Edit' : '+ Add store'}
      </button>
    );
  }
  return (
    <form
      className="rounded-2xl border border-stone-200 bg-white p-5 dark:border-white/10 dark:bg-white/[0.03]"
      action={(fd) => { setBusy(true); (store ? updateSniffStore(store.id, fd) : createSniffStore(fd)).finally(() => setBusy(false)); }}>
      <StoreFields store={store} />
      <div className="mt-3 flex gap-2">
        <button type="submit" disabled={busy}
          className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-50">
          {busy ? 'Saving…' : store ? 'Save changes' : 'Add store'}
        </button>
        <button type="button" onClick={() => setOpen(false)}
          className="rounded-lg bg-stone-200 px-4 py-2 text-sm font-bold dark:bg-white/10">
          Cancel
        </button>
      </div>
    </form>
  );
}

export function SniffStoreDelete({ id, name }: { id: string; name: string }) {
  const [busy, setBusy] = useState(false);
  return (
    <button disabled={busy}
      onClick={() => { if (confirm(`Delete ${name}?`)) { setBusy(true); deleteSniffStore(id).finally(() => setBusy(false)); } }}
      className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-red-700 disabled:opacity-50">
      Delete
    </button>
  );
}
