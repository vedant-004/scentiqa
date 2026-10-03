// Functional admin console (Supabase mode only). Gated by the
// NEXT_PUBLIC_ADMIN_EMAILS allowlist — set to the emails of your moderators.
'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getSupabaseBrowser } from '@/lib/supabase';
import { Button, Card, Chip, EmptyState, useToast } from '@/components/ui';
import { timeAgo } from '@/lib/utils';

const ADMIN_EMAILS = (process.env.NEXT_PUBLIC_ADMIN_EMAILS ?? '')
  .split(',').map((s) => s.trim().toLowerCase()).filter(Boolean);

interface Report { id: number; target_type: string; target_id: string; reason: string; created_at: string }
interface ReviewRow { id: string; rating: number; title: string; body: string; created_at: string; users: { username: string } | null; perfumes: { name: string; slug: string } | null }

export function AdminConsole() {
  const { toast } = useToast();
  const [state, setState] = useState<'loading' | 'noauth' | 'denied' | 'ready'>('loading');
  const [tab, setTab] = useState<'overview' | 'reports' | 'reviews'>('overview');
  const [stats, setStats] = useState<Record<string, number>>({});
  const [reports, setReports] = useState<Report[]>([]);
  const [reviews, setReviews] = useState<ReviewRow[]>([]);

  useEffect(() => {
    (async () => {
      const sb = getSupabaseBrowser();
      if (!sb) { setState('denied'); return; }
      const { data } = await sb.auth.getUser();
      const email = data.user?.email?.toLowerCase() ?? '';
      if (!email) { setState('noauth'); return; }
      if (!ADMIN_EMAILS.includes(email)) { setState('denied'); return; }
      setState('ready');
      const counts = await Promise.all([
        sb.from('perfumes').select('id', { count: 'exact', head: true }),
        sb.from('houses').select('id', { count: 'exact', head: true }),
        sb.from('reviews').select('id', { count: 'exact', head: true }),
        sb.from('reports').select('id', { count: 'exact', head: true }).eq('resolved', false),
        sb.from('prices').select('id', { count: 'exact', head: true }),
      ]);
      setStats({
        perfumes: counts[0].count ?? 0, houses: counts[1].count ?? 0,
        reviews: counts[2].count ?? 0, pendingReports: counts[3].count ?? 0,
        prices: counts[4].count ?? 0,
      });
      const { data: reps } = await sb.from('reports').select('*').eq('resolved', false).order('created_at', { ascending: false }).limit(50);
      setReports((reps as Report[]) ?? []);
      const { data: revs } = await sb.from('reviews').select('id, rating, title, body, created_at, users(username), perfumes(name, slug)').order('created_at', { ascending: false }).limit(20);
      setReviews((revs as unknown as ReviewRow[]) ?? []);
    })();
  }, []);

  const resolve = async (id: number) => {
    const sb = getSupabaseBrowser(); if (!sb) return;
    const { error } = await sb.rpc('resolve_report', { report_id: id });
    if (error) { toast(error.message, 'err'); return; }
    setReports((r) => r.filter((x) => x.id !== id));
    setStats((s) => ({ ...s, pendingReports: Math.max(0, (s.pendingReports ?? 1) - 1) }));
    toast('Report resolved');
  };

  if (state === 'loading') return <p className="py-10 text-center text-sm text-stone-400">Checking access…</p>;
  if (state === 'noauth') return (
    <Card className="p-8 text-center">
      <h2 className="font-display text-xl font-semibold">Sign in to continue</h2>
      <p className="mt-2 text-sm text-stone-500">Admin access requires a Supabase account on the allowlist.</p>
      <Link href="/login" className="mt-5 inline-block rounded-xl bg-gold-600 px-6 py-3 text-sm font-bold text-white hover:bg-gold-700">Go to sign-in</Link>
    </Card>
  );
  if (state === 'denied') return (
    <Card className="p-8 text-center">
      <h2 className="font-display text-xl font-semibold">Not authorized</h2>
      <p className="mt-2 text-sm text-stone-500">This account is not on the admin allowlist (<code className="font-mono text-xs">NEXT_PUBLIC_ADMIN_EMAILS</code>).</p>
    </Card>
  );

  return (
    <div>
      <div className="mb-6 flex gap-2">
        {(['overview', 'reports', 'reviews'] as const).map((t) => (
          <Chip key={t} active={tab === t} onClick={() => setTab(t)} className="capitalize">{t === 'overview' ? 'Overview' : t === 'reports' ? `Reports (${stats.pendingReports ?? 0})` : 'Recent reviews'}</Chip>
        ))}
      </div>

      {tab === 'overview' && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {[
            ['Perfumes', stats.perfumes], ['Houses', stats.houses], ['Reviews', stats.reviews],
            ['Prices tracked', stats.prices], ['Pending reports', stats.pendingReports],
          ].map(([label, v]) => (
            <Card key={label as string} className="p-6 text-center">
              <p className="font-display text-3xl font-bold">{(v as number)?.toLocaleString('en-IN') ?? '—'}</p>
              <p className="mt-1 text-xs font-medium uppercase tracking-wider text-stone-400">{label}</p>
            </Card>
          ))}
        </div>
      )}

      {tab === 'reports' && (
        <div className="space-y-3">
          {reports.length === 0 && <EmptyState title="Queue is clear" body="No unresolved reports. New price-error reports and dupe suggestions land here." />}
          {reports.map((r) => (
            <Card key={r.id} className="p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-gold-600/10 px-2.5 py-0.5 text-xs font-bold text-gold-700 dark:text-gold-300">{r.target_type}</span>
                    <span className="font-mono text-xs text-stone-400">{r.target_id}</span>
                    <span className="text-xs text-stone-400">{timeAgo(r.created_at)}</span>
                  </div>
                  <p className="mt-2 text-sm">{r.reason}</p>
                </div>
                <Button size="sm" variant="outline" onClick={() => resolve(r.id)}>Resolve</Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {tab === 'reviews' && (
        <div className="space-y-3">
          {reviews.map((r) => (
            <Card key={r.id} className="p-5">
              <div className="flex items-center gap-2 text-xs text-stone-400">
                <span className="font-bold text-stone-600 dark:text-stone-300">{r.users?.username ?? 'member'}</span>
                <span>·</span>
                <Link href={`/perfume/${r.perfumes?.slug}`} className="text-gold-600 hover:underline dark:text-gold-300">{r.perfumes?.name}</Link>
                <span>·</span><span>{'★'.repeat(r.rating)}</span>
                <span>·</span><span>{timeAgo(r.created_at)}</span>
              </div>
              <p className="mt-1.5 font-semibold">{r.title}</p>
              <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">{r.body.slice(0, 220)}{r.body.length > 220 ? '…' : ''}</p>
            </Card>
          ))}
          <p className="text-xs text-stone-400">Review removal is done in the Supabase dashboard (Table Editor → reviews) for a full audit trail.</p>
        </div>
      )}
    </div>
  );
}
