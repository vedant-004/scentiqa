import { getSupabaseServer } from '@/lib/supabase';
import { requireAdminPage } from '@/lib/admin';
import { SectionTitle, EmptyState } from '../components';
import { GiveawayActions, GiveawayForm } from './giveaway-client';

export const metadata = { title: 'Giveaways · Admin' };
export const dynamic = 'force-dynamic';

export default async function AdminGiveaways() {
  await requireAdminPage();
  const c = getSupabaseServer(true)!;
  const { data } = await c.from('giveaways').select('*')
    .order('ends_at', { ascending: false }).limit(100);

  const now = Date.now();
  const live = (data ?? []).filter((g) => g.is_active && new Date(g.ends_at).getTime() > now);
  const ended = (data ?? []).filter((g) => !g.is_active || new Date(g.ends_at).getTime() <= now);

  return (
    <div>
      <SectionTitle>Giveaways ({live.length} live)</SectionTitle>
      <p className="mb-6 max-w-2xl text-sm text-stone-500 dark:text-stone-400">
        Create, edit, close, or announce winners. Changes appear on the homepage banner and the giveaways page immediately.
      </p>

      <div className="mb-10 rounded-2xl border border-stone-200 bg-white p-5 dark:border-white/10 dark:bg-white/[0.03]">
        <h2 className="mb-4 font-display text-lg font-bold">New giveaway</h2>
        <GiveawayForm />
      </div>

      {live.length > 0 && (
        <div className="mb-8">
          <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Live ({live.length})</h2>
          <div className="space-y-3">
            {live.map((g) => (
              <GiveawayCard key={g.slug} g={g} />
            ))}
          </div>
        </div>
      )}

      {ended.length > 0 && (
        <div>
          <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-stone-400">Ended / inactive ({ended.length})</h2>
          <div className="space-y-3 opacity-90">
            {ended.map((g) => (
              <GiveawayCard key={g.slug} g={g} />
            ))}
          </div>
        </div>
      )}

      {(!data || data.length === 0) && <EmptyState>No giveaways yet — create one above.</EmptyState>}
    </div>
  );
}

function GiveawayCard({ g }: { g: Record<string, string | number | boolean | null> }) {
  const slug = String(g.slug);
  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-4 dark:border-white/10 dark:bg-white/[0.03]">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-display text-base font-bold">
            {String(g.title)}
            <span className={`ml-2 rounded-full px-2 py-0.5 text-[11px] font-bold ${g.is_active ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-300' : 'bg-stone-500/15 text-stone-500'}`}>
              {g.is_active ? 'LIVE' : 'CLOSED'}
            </span>
          </p>
          {g.prize && <p className="mt-1 text-sm font-semibold text-gold-700 dark:text-gold-300">Prize: {String(g.prize)}</p>}
          {g.description && <p className="mt-1 text-sm text-stone-600 dark:text-stone-300">{String(g.description)}</p>}
          <p className="mt-1 text-xs text-stone-400">
            {new Date(String(g.starts_at)).toLocaleDateString('en-IN')} → {new Date(String(g.ends_at)).toLocaleDateString('en-IN')}
            {' · '}{Number(g.entry_count ?? 0)} entries
            {g.winner_user_id && <span className="ml-1 font-bold text-gold-600">· Winner announced</span>}
          </p>
        </div>
        <GiveawayActions slug={slug} active={!!g.is_active} hasWinner={!!g.winner_user_id} />
      </div>
      <details className="mt-3">
        <summary className="cursor-pointer text-sm font-semibold text-stone-500 hover:text-stone-800 dark:hover:text-stone-200">Edit details</summary>
        <div className="mt-3">
          <GiveawayForm existing={g} />
        </div>
      </details>
    </div>
  );
}
