import { getSupabaseServer } from '@/lib/supabase';
import { createHouse, updateHouse } from '../actions';
import { SectionTitle, Field, inputCls, AdminButton, EmptyState } from '../components';

export const metadata = { title: 'Houses · Admin' };

export default async function AdminHouses() {
  const c = getSupabaseServer(true)!;
  const { data: houses } = await c.from('houses').select('id,name,slug,country,house_type').order('name').limit(500);
  const { count } = await c.from('houses').select('id', { count: 'exact', head: true });

  return (
    <div className="space-y-8">
      <div>
        <SectionTitle>Houses <span className="text-sm font-normal text-stone-400">({count})</span></SectionTitle>
        {!houses?.length ? <EmptyState>No houses.</EmptyState> : (
          <div className="grid gap-3 sm:grid-cols-2">
            {houses.map((h: { id: string; name: string; slug: string; country: string; house_type: string }) => (
              <details key={h.id} className="rounded-2xl border border-stone-200/70 bg-white/60 p-4 dark:border-white/10 dark:bg-white/[0.03]">
                <summary className="cursor-pointer text-sm font-bold">{h.name} <span className="font-normal text-stone-400">· {h.country || '—'}</span></summary>
                <form action={updateHouse.bind(null, h.id)} className="mt-3 grid gap-3">
                  <Field label="Name"><input name="name" defaultValue={h.name} className={inputCls} /></Field>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Country"><input name="country" defaultValue={h.country ?? ''} className={inputCls} /></Field>
                    <Field label="Type"><input name="house_type" defaultValue={h.house_type ?? ''} className={inputCls} placeholder="designer / niche / indian_clone…" /></Field>
                  </div>
                  <Field label="Website"><input name="website_url" className={inputCls} placeholder="https://…" /></Field>
                  <Field label="Description"><textarea name="description" rows={2} className={inputCls} /></Field>
                  <div><AdminButton>Save</AdminButton></div>
                </form>
              </details>
            ))}
          </div>
        )}
      </div>
      <div>
        <SectionTitle>Add a house</SectionTitle>
        <form action={createHouse} className="grid gap-4 rounded-2xl border border-stone-200/70 bg-white/60 p-6 dark:border-white/10 dark:bg-white/[0.03]">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Name"><input name="name" required className={inputCls} /></Field>
            <Field label="Country"><input name="country" className={inputCls} /></Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Website"><input name="website_url" placeholder="https://…" className={inputCls} /></Field>
            <Field label="Type"><input name="house_type" placeholder="designer / niche / indian_clone…" className={inputCls} /></Field>
          </div>
          <Field label="Description"><textarea name="description" rows={3} className={inputCls} /></Field>
          <div><AdminButton>Create house</AdminButton></div>
        </form>
      </div>
    </div>
  );
}
