import { getSupabaseServer } from '@/lib/supabase';
import { SectionTitle, EmptyState, AdminButton } from '../components';

async function resolveReport(id: number) {
  'use server';
  const { getSupabaseServer: srv } = await import('@/lib/supabase');
  const { requireAdmin: req } = await import('@/lib/admin');
  await req();
  const { error } = await srv(true)!.rpc('resolve_report', { report_id: id });
  if (error) throw new Error(error.message);
  const { revalidatePath } = await import('next/cache');
  revalidatePath('/admin/reports');
}

export const metadata = { title: 'Reports · Admin' };

export default async function AdminReports() {
  const c = getSupabaseServer(true)!;
  const { data: reports } = await c.from('reports').select('*').eq('resolved', false).order('created_at', { ascending: false }).limit(100);

  return (
    <div>
      <SectionTitle>Report queue <span className="text-sm font-normal text-stone-400">({reports?.length ?? 0} open)</span></SectionTitle>
      <p className="mb-4 text-sm text-stone-500">Price-error reports and dupe suggestions from the community land here.</p>
      {!reports?.length ? <EmptyState>Queue is clear. 🎉</EmptyState> : (
        <div className="space-y-3">
          {reports.map((r: { id: number; target_type: string; target_id: string; reason: string; created_at: string }) => (
            <div key={r.id} className="rounded-2xl border border-stone-200/70 bg-white/60 p-4 dark:border-white/10 dark:bg-white/[0.03]">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="rounded-full bg-gold-600/10 px-2.5 py-0.5 font-bold text-gold-700 dark:text-gold-300">{r.target_type}</span>
                    <span className="font-mono text-stone-400">{r.target_id}</span>
                    <span className="text-stone-400">{r.created_at?.slice(0, 10)}</span>
                  </div>
                  <p className="mt-2 text-sm">{r.reason}</p>
                </div>
                <form action={resolveReport.bind(null, r.id)}><AdminButton>Resolve</AdminButton></form>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
