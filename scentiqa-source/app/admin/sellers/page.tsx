import Link from 'next/link';
import { getSupabaseServer } from '@/lib/supabase';
import { createSeller, updateSeller, createPrice, deletePrice } from '../actions';
import { SectionTitle, Field, inputCls, AdminButton, EmptyState } from '../components';

export const metadata = { title: 'Sellers & Prices · Admin' };

export default async function AdminSellers({ searchParams }: { searchParams: Promise<{ seller?: string }> }) {
  const { seller: sellerId } = await searchParams;
  const c = getSupabaseServer(true)!;
  const { data: sellers } = await c.from('sellers').select('*').order('name').limit(200);
  const active = sellers?.find((s: { id: string }) => s.id === sellerId) ?? sellers?.[0];
  const { data: prices } = active
    ? await c.from('prices').select('id,price_inr,mrp_inr,size_ml,in_stock,product_url,price_provenance,perfumes(id,name)').eq('seller_id', active.id).order('created_at', { ascending: false }).limit(100)
    : { data: [] };
  const { data: perfumes } = await c.from('perfumes').select('id,name').order('name').limit(2000);

  return (
    <div className="space-y-8">
      <div>
        <SectionTitle>Sellers <span className="text-sm font-normal text-stone-400">({sellers?.length ?? 0})</span></SectionTitle>
        <div className="grid gap-3 lg:grid-cols-2">
          {(sellers ?? []).map((s: { id: string; name: string; website_url: string; verified: boolean; seller_type: string }) => (
            <details key={s.id} open={s.id === active?.id} className="rounded-2xl border border-stone-200/70 bg-white/60 p-4 dark:border-white/10 dark:bg-white/[0.03]">
              <summary className="cursor-pointer text-sm font-bold">
                {s.name}{' '}
                <span className={`rounded-full px-2 py-0.5 text-xs ${s.verified ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300' : 'bg-stone-200 text-stone-500 dark:bg-white/10'}`}>
                  {s.verified ? 'verified' : 'unverified'}
                </span>
              </summary>
              <form action={updateSeller.bind(null, s.id)} className="mt-3 grid gap-3">
                <Field label="Name"><input name="name" defaultValue={s.name} className={inputCls} /></Field>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Website"><input name="website_url" defaultValue={s.website_url ?? ''} className={inputCls} /></Field>
                  <Field label="Type"><input name="seller_type" defaultValue={s.seller_type ?? ''} className={inputCls} placeholder="official / retailer / marketplace…" /></Field>
                </div>
                <Field label="Trust notes"><textarea name="trust_notes" rows={2} className={inputCls} /></Field>
                <label className="flex items-center gap-2 text-sm font-semibold">
                  <input type="checkbox" name="verified" defaultChecked={s.verified} className="h-4 w-4 accent-gold-700" /> Verified seller
                </label>
                <div className="flex gap-3">
                  <AdminButton>Save</AdminButton>
                  <Link href={`/admin/sellers?seller=${s.id}`} className="rounded-xl border border-stone-300 px-4 py-2 text-sm font-bold dark:border-white/15">View prices</Link>
                </div>
              </form>
            </details>
          ))}
        </div>
      </div>

      {active && (
        <div>
          <SectionTitle>Prices · {active.name} <span className="text-sm font-normal text-stone-400">({prices?.length ?? 0})</span></SectionTitle>
          {!prices?.length ? <EmptyState>No prices for this seller yet.</EmptyState> : (
            <div className="space-y-2">
              {prices.map((pr: { id: string; price_inr: number; size_ml: number; in_stock: boolean; product_url: string; price_provenance: string; perfumes: { id: string; name: string } | { id: string; name: string }[] | null }) => (
                <div key={pr.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-stone-200/70 bg-white/60 px-4 py-2.5 text-sm dark:border-white/10 dark:bg-white/[0.03]">
                  <span>
                    <Link href={`/admin/perfumes/${Array.isArray(pr.perfumes) ? pr.perfumes[0]?.id : pr.perfumes?.id}`} className="font-semibold hover:text-gold-700">{(Array.isArray(pr.perfumes) ? pr.perfumes[0]?.name : pr.perfumes?.name) ?? '?'}</Link>{' '}
                    <span className="text-stone-400">{pr.size_ml ? `${pr.size_ml}ml` : ''} · {pr.price_inr ? `₹${pr.price_inr.toLocaleString('en-IN')}` : 'no price'} · {pr.in_stock ? 'in stock' : 'out of stock'}</span>
                  </span>
                  <span className="flex gap-2">
                    {pr.product_url && <a href={pr.product_url} target="_blank" rel="noopener" className="text-xs font-bold text-gold-700 hover:underline">open →</a>}
                    <form action={deletePrice.bind(null, pr.id)}><button className="text-xs font-bold text-red-600 hover:underline">delete</button></form>
                  </span>
                </div>
              ))}
            </div>
          )}
          <details className="mt-4 rounded-2xl border border-stone-200/70 bg-white/60 p-5 dark:border-white/10 dark:bg-white/[0.03]">
            <summary className="cursor-pointer text-sm font-bold">+ Add a price</summary>
            <form action={createPrice} className="mt-3 grid gap-3 sm:grid-cols-2">
              <input type="hidden" name="seller_id" value={active.id} />
              <Field label="Perfume">
                <select name="perfume_id" required className={inputCls}>
                  {(perfumes ?? []).map((p: { id: string; name: string }) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </Field>
              <Field label="Product URL"><input name="product_url" placeholder="https://…" className={inputCls} /></Field>
              <Field label="Price (₹)"><input name="price_inr" inputMode="numeric" className={inputCls} /></Field>
              <Field label="MRP (₹)"><input name="mrp_inr" inputMode="numeric" className={inputCls} /></Field>
              <Field label="Size (ml)"><input name="size_ml" inputMode="numeric" className={inputCls} /></Field>
              <label className="flex items-center gap-2 self-end pb-2 text-sm font-semibold">
                <input type="checkbox" name="in_stock" className="h-4 w-4 accent-gold-700" /> In stock
              </label>
              <div className="sm:col-span-2"><AdminButton>Add price</AdminButton></div>
            </form>
          </details>
        </div>
      )}

      <div>
        <SectionTitle>Add a seller</SectionTitle>
        <form action={createSeller} className="grid gap-4 rounded-2xl border border-stone-200/70 bg-white/60 p-6 dark:border-white/10 dark:bg-white/[0.03]">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Name"><input name="name" required className={inputCls} /></Field>
            <Field label="Website"><input name="website_url" placeholder="https://…" className={inputCls} /></Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Type"><input name="seller_type" placeholder="official / retailer / marketplace…" className={inputCls} /></Field>
            <label className="flex items-center gap-2 self-end pb-2 text-sm font-semibold">
              <input type="checkbox" name="verified" className="h-4 w-4 accent-gold-700" /> Verified seller
            </label>
          </div>
          <Field label="Trust notes"><textarea name="trust_notes" rows={2} className={inputCls} /></Field>
          <div><AdminButton>Create seller</AdminButton></div>
        </form>
      </div>
    </div>
  );
}
