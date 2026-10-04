import Link from 'next/link';
import { getSupabaseServer } from '@/lib/supabase';
import { createDupe, deleteDupe } from '../actions';
import { SectionTitle, Field, inputCls, AdminButton, EmptyState } from '../components';

export const metadata = { title: 'Dupe mappings · Admin' };

export default async function AdminDupes() {
  const c = getSupabaseServer(true)!;
  const { data: rels, count } = await c.from('dupe_relationships')
    .select('id,similarity_score,tested_by,original_perfume_id,dupe_perfume_id', { count: 'exact' })
    .order('created_at', { ascending: false }).limit(100);
  const { data: perfumes } = await c.from('perfumes').select('id,name').order('name').limit(3000);

  const nameOf = (id: string) => (perfumes ?? []).find((p: { id: string }) => p.id === id)?.name ?? id;

  return (
    <div className="space-y-8">
      <div>
        <SectionTitle>Dupe mappings <span className="text-sm font-normal text-stone-400">({count} total, latest 100)</span></SectionTitle>
        {!rels?.length ? <EmptyState>No mappings.</EmptyState> : (
          <div className="space-y-2">
            {rels.map((r: { id: string; similarity_score: number; tested_by: string; original_perfume_id: string; dupe_perfume_id: string }) => (
              <div key={r.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-stone-200/70 bg-white/60 px-4 py-2.5 text-sm dark:border-white/10 dark:bg-white/[0.03]">
                <span>
                  <Link href={`/admin/perfumes/${r.dupe_perfume_id}`} className="font-semibold hover:text-gold-700">{nameOf(r.dupe_perfume_id)}</Link>
                  <span className="text-stone-400"> → dupe of </span>
                  <Link href={`/admin/perfumes/${r.original_perfume_id}`} className="font-semibold hover:text-gold-700">{nameOf(r.original_perfume_id)}</Link>{' '}
                  <span className="rounded-full bg-stone-200 px-2 py-0.5 text-xs dark:bg-white/10">{r.tested_by}</span>
                  {r.similarity_score != null && <span className="text-xs text-stone-400"> · {r.similarity_score}%</span>}
                </span>
                <form action={deleteDupe.bind(null, r.id)}><button className="text-xs font-bold text-red-600 hover:underline">delete</button></form>
              </div>
            ))}
          </div>
        )}
      </div>
      <div>
        <SectionTitle>Add a mapping</SectionTitle>
        <form action={createDupe} className="grid gap-4 rounded-2xl border border-stone-200/70 bg-white/60 p-6 dark:border-white/10 dark:bg-white/[0.03]">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Dupe (clone) perfume">
              <select name="dupe_perfume_id" required className={inputCls}>
                {(perfumes ?? []).map((p: { id: string; name: string }) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </Field>
            <Field label="Original (designer) perfume">
              <select name="original_perfume_id" required className={inputCls}>
                {(perfumes ?? []).map((p: { id: string; name: string }) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Similarity % (lab only)"><input name="similarity_score" inputMode="numeric" className={inputCls} /></Field>
            <Field label="Source">
              <select name="tested_by" className={inputCls}><option value="community">community / brand claim</option><option value="lab">lab tested</option></select>
            </Field>
          </div>
          <Field label="Claim / provenance note"><input name="claimed_accuracy_text" placeholder='Brand&apos;s stated inspiration… + source URL' className={inputCls} /></Field>
          <Field label="Verdict"><textarea name="verdict_text" rows={2} className={inputCls} /></Field>
          <div><AdminButton>Add mapping</AdminButton></div>
        </form>
      </div>
    </div>
  );
}
