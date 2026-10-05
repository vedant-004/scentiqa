import Link from 'next/link';
import { getSupabaseServer } from '@/lib/supabase';
import { requireAdminPage } from '@/lib/admin';
import { SectionTitle, EmptyState } from '../components';
import { BattleForms } from './battle-client';

export const metadata = { title: 'Battles · Admin' };
export const dynamic = 'force-dynamic';

export default async function AdminBattles() {
  await requireAdminPage();
  const c = getSupabaseServer(true)!;

  const { data: battles } = await c.from('battles').select('*').order('starts_at', { ascending: false, nullsFirst: false });

  return (
    <div>
      <SectionTitle>Scent Battles</SectionTitle>
      <BattleForms />

      <div className="mt-8 space-y-6">
        {(!battles || battles.length === 0) && <EmptyState>No battles yet — create one above.</EmptyState>}
        {(battles ?? []).map((b) => (
          <BattleCard key={b.id} battle={b} />
        ))}
      </div>
    </div>
  );
}

async function BattleCard({ battle }: { battle: { id: string; title: string; theme: string | null; status: string; starts_at: string | null; ends_at: string | null } }) {
  const c = getSupabaseServer(true)!;
  const [{ data: entries }, { data: matchups }] = await Promise.all([
    c.from('battle_entries').select('seed, perfumes(id, name)').eq('battle_id', battle.id).order('seed', { ascending: true }),
    c.from('battle_matchups').select('id, round, votes_a, votes_b, winner_id, perfume_a_id, perfume_b_id').eq('battle_id', battle.id).order('round'),
  ]);

  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-5 dark:border-white/10 dark:bg-white/[0.03]">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="font-display text-lg font-bold">{battle.title}</h3>
          {battle.theme && <p className="text-xs text-stone-500">{battle.theme}</p>}
        </div>
        <BattleForms battleId={battle.id} status={battle.status} />
      </div>
      <div className="mt-4 grid gap-6 md:grid-cols-2">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-stone-400">Entries ({entries?.length ?? 0})</p>
          <ul className="mt-2 space-y-1">
            {(entries ?? []).map((e: { seed: number | null; perfumes: { id: string; name: string } | { id: string; name: string }[] | null }) => {
              const p = Array.isArray(e.perfumes) ? e.perfumes[0] : e.perfumes;
              return (
                <li key={p?.id} className="flex items-center justify-between text-sm">
                  <span>#{e.seed ?? '?'} {p?.name}</span>
                  <BattleForms battleId={battle.id} removePerfumeId={p?.id} />
                </li>
              );
            })}
          </ul>
          <BattleForms battleId={battle.id} addEntry />
        </div>
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-stone-400">Matchups ({matchups?.length ?? 0})</p>
          <ul className="mt-2 space-y-2">
            {(matchups ?? []).map((m: { id: string; round: number; votes_a: number; votes_b: number; winner_id: string | null }) => (
              <li key={m.id} className="rounded-xl bg-stone-50 p-2 text-xs dark:bg-white/[0.04]">
                R{m.round}: {m.votes_a}–{m.votes_b} votes {m.winner_id ? `· winner: ${m.winner_id.slice(0, 8)}…` : '· open'}
                {!m.winner_id && <BattleForms battleId={battle.id} matchupId={m.id} setWinner />}
              </li>
            ))}
          </ul>
          <div className="mt-3 flex flex-wrap gap-2">
            <BattleForms battleId={battle.id} genBracket />
            <BattleForms battleId={battle.id} advance />
          </div>
        </div>
      </div>
      <p className="mt-3 text-xs text-stone-400">
        <Link href="/battles" className="font-bold text-gold-700 hover:underline dark:text-gold-300">View public page →</Link>
      </p>
    </div>
  );
}
