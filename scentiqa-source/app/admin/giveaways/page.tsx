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
  const realCount = Number(g.entry_count ?? 0);
  const displayCount = g.display_entry_count != null ? Number(g.display_entry_count) : null;
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
            {' · '}<strong className="text-stone-700 dark:text-stone-200">{realCount} real entries</strong>
            {displayCount != null && <span className="ml-1 text-gold-700 dark:text-gold-300">(showing {displayCount} to users)</span>}
            {g.winner_user_id && <span className="ml-1 font-bold text-gold-600">· Winner announced</span>}
          </p>
          <DisplayCountForm slug={slug} current={displayCount} />
        </div>
        <GiveawayActions slug={slug} active={!!g.is_active} hasWinner={!!g.winner_user_id} />
      </div>
      <details className="mt-3">
        <summary className="cursor-pointer text-sm font-semibold text-stone-500 hover:text-stone-800 dark:hover:text-stone-200">Edit details</summary>
        <div className="mt-3">
          <GiveawayForm existing={g} />
        </div>
      </details>
      <details className="mt-3">
        <summary className="cursor-pointer text-sm font-semibold text-stone-500 hover:text-stone-800 dark:hover:text-stone-200">
          Entrants ({Number(g.entry_count ?? 0)}) — view emails
        </summary>
        <div className="mt-3">
          <GiveawayEntrants slug={slug} />
        </div>
      </details>
      <details className="mt-3">
        <summary className="cursor-pointer text-sm font-semibold text-stone-500 hover:text-stone-800 dark:hover:text-stone-200">
          🏆 Announce winner {g.winner_name ? `— ${String(g.winner_name)}` : '(not announced)'}
        </summary>
        <div className="mt-3">
          <WinnerForm slug={slug} currentName={g.winner_name != null ? String(g.winner_name) : ''} currentEmail={g.winner_email != null ? String(g.winner_email) : ''} />
        </div>
      </details>
    </div>
  );
}

function WinnerForm({ slug, currentName, currentEmail }: { slug: string; currentName: string; currentEmail: string }) {
  return (
    <form
      action={async (fd: FormData) => {
        'use server';
        const { getSupabaseServer } = await import('@/lib/supabase');
        const { requireAdmin } = await import('@/lib/admin');
        await requireAdmin();
        const c = getSupabaseServer(true)!;
        const name = String(fd.get('winner_name') || '').trim().slice(0, 100) || null;
        const email = String(fd.get('winner_email') || '').trim().slice(0, 200) || null;
        await c.from('giveaways').update({
          winner_name: name,
          winner_email: email,
          winner_announced_at: name ? new Date().toISOString() : null,
        }).eq('slug', slug);
      }}
      className="grid gap-3 rounded-xl border border-gold-500/30 bg-gold-500/5 p-4"
    >
      <p className="text-xs text-stone-500">
        The winner's <strong>name</strong> will be shown publicly on the giveaway page.
        The <strong>email</strong> stays private — only you see it here, so you can contact them for shipping address and phone number.
      </p>
      <label className="block text-sm font-semibold">Winner name (public)
        <input name="winner_name" defaultValue={currentName} placeholder="e.g. Priya Sharma" maxLength={100}
          className="mt-1 w-full rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-ink-900" />
      </label>
      <label className="block text-sm font-semibold">Winner email (private — only you see this)
        <input name="winner_email" type="email" defaultValue={currentEmail} placeholder="winner@example.com" maxLength={200}
          className="mt-1 w-full rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-ink-900" />
      </label>
      <div className="flex gap-2">
        <button type="submit" className="rounded-xl bg-gold-600 px-4 py-2 text-sm font-bold text-white hover:brightness-110">
          {currentName ? 'Update winner' : 'Announce winner'}
        </button>
        {currentName && (
          <button type="submit" formAction={async () => {
            'use server';
            const { getSupabaseServer } = await import('@/lib/supabase');
            const { requireAdmin } = await import('@/lib/admin');
            await requireAdmin();
            const c = getSupabaseServer(true)!;
            await c.from('giveaways').update({ winner_name: null, winner_email: null, winner_announced_at: null }).eq('slug', slug);
          }} className="rounded-xl border border-stone-300 px-4 py-2 text-sm font-semibold text-stone-500 hover:text-stone-700">
            Clear winner
          </button>
        )}
      </div>
    </form>
  );
}

function DisplayCountForm({ slug, current }: { slug: string; current: number | null }) {
  return (
    <form
      action={async (fd: FormData) => {
        'use server';
        const { getSupabaseServer } = await import('@/lib/supabase');
        const { requireAdmin } = await import('@/lib/admin');
        await requireAdmin();
        const c = getSupabaseServer(true)!;
        const v = fd.get('display_count');
        const num = v ? Number(v) : null;
        await c.from('giveaways').update({
          display_entry_count: num && num > 0 ? num : null,
        }).eq('slug', slug);
      }}
      className="mt-2 flex items-center gap-2"
    >
      <label className="text-xs font-semibold text-stone-500">
        Show to users:
        <input
          name="display_count"
          type="number"
          min="0"
          defaultValue={current ?? ''}
          placeholder="Real count"
          className="ml-2 w-24 rounded-lg border border-stone-200 bg-white px-2 py-1 text-xs dark:border-white/10 dark:bg-ink-900"
        />
      </label>
      <button type="submit" className="rounded-lg bg-gold-700 px-3 py-1 text-xs font-bold text-white hover:brightness-110">
        Set
      </button>
      {current != null && (
        <button
          type="submit"
          formAction={async () => {
            'use server';
            const { getSupabaseServer } = await import('@/lib/supabase');
            const { requireAdmin } = await import('@/lib/admin');
            await requireAdmin();
            const c = getSupabaseServer(true)!;
            await c.from('giveaways').update({ display_entry_count: null }).eq('slug', slug);
          }}
          className="text-xs font-semibold text-stone-400 hover:text-stone-600"
        >
          Clear
        </button>
      )}
    </form>
  );
}

/* Entrant list with emails, resolved via the Supabase admin API.
   One bad lookup must never break the admin page. */
async function GiveawayEntrants({ slug }: { slug: string }) {
  try {
    const c = getSupabaseServer(true);
    if (!c) return <p className="text-sm text-stone-400">Database not configured.</p>;
    const { data: entries, error } = await c
      .from('giveaway_entries')
      .select('user_id, created_at')
      .eq('giveaway_slug', slug)
      .order('created_at', { ascending: false })
      .limit(500);
    if (error) return <p className="text-sm text-red-600 dark:text-red-400">Could not load entrants: {error.message}</p>;
    if (!entries || entries.length === 0) return <p className="text-sm text-stone-400">No entries yet.</p>;

    const emailById: Record<string, string> = {};
    try {
      for (let page = 1; page <= 20; page++) {
        const { data } = await c.auth.admin.listUsers({ page, perPage: 100 });
        for (const u of data.users) emailById[u.id] = u.email ?? '(no email)';
        if (data.users.length < 100) break;
      }
    } catch { /* fall back to user ids */ }

    return (
      <div className="overflow-x-auto rounded-xl border border-stone-200 dark:border-white/10">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-stone-200 bg-stone-50 dark:border-white/10 dark:bg-white/[0.03]">
              <th className="px-3 py-2 font-bold text-stone-500">#</th>
              <th className="px-3 py-2 font-bold text-stone-500">Email</th>
              <th className="px-3 py-2 font-bold text-stone-500">Entered</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((e, i) => (
              <tr key={String(e.user_id)} className="border-b border-stone-100 last:border-0 dark:border-white/5">
                <td className="px-3 py-2 text-stone-400">{i + 1}</td>
                <td className="px-3 py-2 font-medium text-stone-800 dark:text-stone-100">
                  {emailById[String(e.user_id)] ?? <span className="text-stone-400">{String(e.user_id)}</span>}
                </td>
                <td className="px-3 py-2 text-stone-500">
                  {e.created_at ? new Date(String(e.created_at)).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' }) : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  } catch (e) {
    return <p className="text-sm text-red-600 dark:text-red-400">Could not load entrants.</p>;
  }
}
