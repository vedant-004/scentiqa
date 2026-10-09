import { getSupabaseServer } from '@/lib/supabase';
import { requireAdminPage } from '@/lib/admin';
import { SectionTitle, EmptyState } from '../components';
import { SniffStoreForm, SniffStoreDelete } from './sniff-client';

export const metadata = { title: 'Sniff Guide · Admin' };
export const dynamic = 'force-dynamic';

export default async function AdminSniff() {
  await requireAdminPage();
  const c = getSupabaseServer(true)!;
  const { data } = await c.from('sniff_stores').select('*').order('city').order('name').limit(200);

  return (
    <div>
      <SectionTitle>Sniff Guide ({data?.length ?? 0} stores)</SectionTitle>
      <SniffStoreForm />

      <div className="mt-8 space-y-3">
        {(!data || data.length === 0) && <EmptyState>No stores yet — add the first above.</EmptyState>}
        {(data ?? []).map((s) => (
          <div key={s.id} className="rounded-2xl border border-stone-200 bg-white p-4 dark:border-white/10 dark:bg-white/[0.03]">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-display text-base font-bold">{s.name}
                  <span className="ml-2 text-sm font-semibold text-stone-500">· {s.city}{s.area ? `, ${s.area}` : ''}</span>
                  {s.verified && <span className="ml-2 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">✓ verified</span>}
                </p>
                <p className="mt-0.5 text-xs uppercase tracking-wider text-stone-400">{s.store_type}</p>
                {s.brands_text && <p className="mt-1 text-sm text-stone-600 dark:text-stone-300">{s.brands_text}</p>}
              </div>
              <div className="flex gap-2">
                <SniffStoreForm store={s} />
                <SniffStoreDelete id={s.id} name={s.name} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
