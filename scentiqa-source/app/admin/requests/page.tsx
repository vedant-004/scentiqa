import { getSupabaseServer } from '@/lib/supabase';
import { requireAdminPage } from '@/lib/admin';
import { SectionTitle, EmptyState } from '../components';
import { RequestActions } from './request-client';

export const metadata = { title: 'Perfume Requests · Admin' };
export const dynamic = 'force-dynamic';

export default async function AdminRequests() {
  await requireAdminPage();
  const c = getSupabaseServer(true)!;
  const { data } = await c.from('perfume_requests').select('*')
    .order('vote_count', { ascending: false }).order('created_at', { ascending: false }).limit(200);

  const open = (data ?? []).filter((r) => r.status === 'open');
  const done = (data ?? []).filter((r) => r.status !== 'open');

  return (
    <div>
      <SectionTitle>Perfume Requests ({open.length} open)</SectionTitle>
      {(!data || data.length === 0) && <EmptyState>No requests yet.</EmptyState>}

      <div className="space-y-3">
        {open.map((r) => (
          <div key={r.id} className="rounded-2xl border border-stone-200 bg-white p-4 dark:border-white/10 dark:bg-white/[0.03]">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-display text-base font-bold">{r.perfume_name}
                  {r.house_name && <span className="ml-2 text-sm font-semibold text-stone-500">· {r.house_name}</span>}
                </p>
                {r.reason && <p className="mt-1 text-sm text-stone-600 dark:text-stone-300">{r.reason}</p>}
                <p className="mt-1 text-xs text-stone-400">
                  {r.vote_count} votes · by {r.requester_name || 'member'}
                  {r.team_created && ' · team-created seed'}
                </p>
              </div>
              <RequestActions id={r.id} status={r.status} />
            </div>
          </div>
        ))}
      </div>

      {done.length > 0 && (
        <div className="mt-8">
          <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-stone-400">Resolved ({done.length})</h2>
          <div className="space-y-3 opacity-75">
            {done.map((r) => (
              <div key={r.id} className="rounded-2xl border border-stone-200 bg-white p-4 dark:border-white/10 dark:bg-white/[0.03]">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-display text-base font-bold">{r.perfume_name}
                      <span className="ml-2 rounded-full bg-stone-500/15 px-2 py-0.5 text-[11px] font-semibold">{r.status}</span>
                    </p>
                    <p className="mt-1 text-xs text-stone-400">{r.vote_count} votes</p>
                  </div>
                  <RequestActions id={r.id} status={r.status} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
