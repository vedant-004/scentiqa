// Scent Battles hub — active battle, bracket, voting.
'use client';
import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Button, Card, SectionHeading, Skeleton } from '@/components';
import { useAuth } from '@/components/auth';

interface PerfumeRef {
  id: string; slug: string; name: string; bottle_image_url: string | null;
  houses: { name: string } | { name: string }[] | null;
}
interface Matchup {
  id: string; round: number; perfume_a_id: string; perfume_b_id: string;
  votes_a: number; votes_b: number; winner_id: string | null;
}
interface Entry { seed: number | null; perfumes: PerfumeRef | null }

function houseName(h: PerfumeRef['houses']): string {
  if (!h) return '';
  return Array.isArray(h) ? (h[0]?.name ?? '') : h.name;
}

const ROUND_LABEL: Record<number, string> = { 1: 'Quarter-finals', 2: 'Semi-finals', 3: 'Final' };

export default function BattlesPage() {
  const { user, loading } = useAuth();
  const [battle, setBattle] = useState<{ id: string; title: string; theme: string | null; status: string } | null>(null);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [matchups, setMatchups] = useState<Matchup[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [myVotes, setMyVotes] = useState<Record<string, string>>({});
  const [voteError, setVoteError] = useState('');

  const load = useCallback(async () => {
    try {
      const j = await fetch('/api/battles/current').then((r) => r.json());
      setBattle(j.battle ?? null);
      setEntries(j.entries ?? []);
      setMatchups(j.matchups ?? []);
    } catch { /* offline */ }
  }, []);

  useEffect(() => { load(); }, [load]);

  const vote = async (matchup: Matchup, perfume_id: string) => {
    if (!user) { window.location.href = '/login?next=/battles'; return; }
    setBusy(matchup.id);
    setVoteError('');
    try {
      const r = await fetch(`/api/battles/${battle!.id}/vote`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ matchup_id: matchup.id, perfume_id }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error ?? 'Vote failed');
      setMyVotes((v) => ({ ...v, [matchup.id]: perfume_id }));
      await load();
    } catch (e) {
      setVoteError(e instanceof Error ? e.message : 'Vote failed');
    } finally { setBusy(null); }
  };

  const perfumesById = new Map<string, PerfumeRef>();
  for (const e of entries) if (e.perfumes) perfumesById.set(e.perfumes.id, e.perfumes);

  const rounds = [...new Set(matchups.map((m) => m.round))].sort((a, b) => a - b);

  if (loading) return <div className="mx-auto max-w-5xl px-4 py-10"><Skeleton className="h-64" /></div>;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <SectionHeading kicker="Scent Battles" title="Head-to-head tournaments" />
      {voteError && (
        <div className="mb-4 rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm font-medium text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
          {voteError}
        </div>
      )}
      <p className="mt-3 max-w-2xl text-sm text-stone-500 dark:text-stone-400">
        Weekly fragrance showdowns voted by the community. Indian themes, single elimination, one champion.
      </p>

      {!battle ? (
        <Card className="mt-8 p-8 text-center">
          <p className="font-display text-xl font-bold">No battle yet</p>
          <p className="mt-2 text-sm text-stone-500">The first tournament is being set up — check back soon.</p>
        </Card>
      ) : (
        <div className="mt-8">
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="font-display text-2xl font-bold">{battle.title}</h2>
            <span className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide ${
              battle.status === 'active' ? 'bg-emerald-600/15 text-emerald-700 dark:text-emerald-300'
              : battle.status === 'completed' ? 'bg-gold-600/15 text-gold-700 dark:text-gold-300'
              : 'bg-stone-500/15 text-stone-500'}`}>
              {battle.status}
            </span>
          </div>
          {battle.theme && <p className="mt-1 text-sm text-stone-500">{battle.theme}</p>}

          {rounds.map((round) => (
            <section key={round} className="mt-8">
              <h3 className="font-display text-lg font-bold text-stone-700 dark:text-stone-200">
                {ROUND_LABEL[round] ?? `Round ${round}`}
              </h3>
              <div className="mt-3 grid gap-4 md:grid-cols-2">
                {matchups.filter((m) => m.round === round).map((m) => {
                  const a = perfumesById.get(m.perfume_a_id);
                  const b = perfumesById.get(m.perfume_b_id);
                  const total = m.votes_a + m.votes_b;
                  const pctA = total ? Math.round((m.votes_a / total) * 100) : 50;
                  const mine = myVotes[m.id];
                  return (
                    <Card key={m.id} className="overflow-hidden p-0">
                      <div className="grid grid-cols-2">
                        {[
                          { p: a, votes: m.votes_a, id: m.perfume_a_id },
                          { p: b, votes: m.votes_b, id: m.perfume_b_id },
                        ].map(({ p, votes, id }) => {
                          const isWinner = m.winner_id === id;
                          const isMine = mine === id;
                          return (
                            <div key={id} className={`p-4 ${isWinner ? 'bg-gold-600/10' : ''}`}>
                              <Link href={p ? `/perfume/${p.slug}` : '#'}>
                                <p className="truncate text-sm font-bold hover:underline">{p?.name ?? 'TBD'}</p>
                              </Link>
                              <p className="truncate text-xs text-stone-400">{p ? houseName(p.houses) : ''}</p>
                              {isWinner && <p className="mt-1 text-lg">🏆</p>}
                              {!m.winner_id && battle.status === 'active' && (
                                <Button size="sm" className="mt-2" disabled={busy === m.id || isMine}
                                  onClick={() => vote(m, id)}>
                                  {busy === m.id ? 'Voting…' : isMine ? '✓ Voted' : 'Vote'}
                                </Button>
                              )}
                              <p className="mt-1 text-xs font-bold text-stone-500">{votes} votes</p>
                            </div>
                          );
                        })}
                      </div>
                      {/* Vote bar */}
                      <div className="flex h-2">
                        <div className="bg-gold-600 transition-all" style={{ width: `${pctA}%` }} />
                        <div className="flex-1 bg-stone-200 dark:bg-white/10" />
                      </div>
                      <p className="px-4 py-2 text-center text-xs font-bold text-stone-400">
                        {total} total vote{total === 1 ? '' : 's'}
                      </p>
                    </Card>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
