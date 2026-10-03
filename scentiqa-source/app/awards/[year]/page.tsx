import Link from 'next/link';
import { getAwards, getHouse, getPerfume } from '@/lib/data';
import { isSupabaseConfigured } from '@/lib/supabase';
import { Card, SectionHeading } from '@/components/ui';
import { Breadcrumbs, HouseCard, PerfumeCard } from '@/components';

export const metadata = { title: 'Scentiqa Awards', description: 'Annual Scentiqa awards for the best perfumes and dupes in India, voted by the community and tested by our lab.' };

export default async function AwardsPage({ params }: { params: Promise<{ year: string }> }) {
  const { year } = await params;
  const awards = await getAwards(Number(year));
  return (
    <div className="mx-auto max-w-7xl px-4 pt-6 sm:px-6">
      <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Awards', href: '/awards/2026' }, { label: year }]} />
      <SectionHeading kicker="Community + lab" title={`Scentiqa Awards ${year}`} />
      <p className="mb-6 max-w-2xl text-[15px] text-stone-500 dark:text-stone-400">
        Winners are decided 50% by community vote, 50% by our lab panel — and only lab-tested dupes can win dupe categories.
        {!isSupabaseConfigured() && <span className="font-semibold"> Vote counts shown here are illustrative samples.</span>}
      </p>
      <div className="mb-6 flex gap-2">
        {['2026', '2025'].map((y) => (
          <Link key={y} href={`/awards/${y}`}
            className={y === year ? 'rounded-full bg-gold-600 px-4 py-1.5 text-sm font-bold text-white' : 'rounded-full border border-stone-300 px-4 py-1.5 text-sm font-medium hover:border-gold-600 dark:border-ink-700'}>{y}</Link>
        ))}
      </div>
      {awards.length === 0 && (
        <Card className="p-10 text-center">
          <p className="font-display text-xl font-semibold">No awards for {year} yet</p>
          <p className="mt-2 text-sm text-stone-500">Voting opens later this year. <Link href="/awards/2026" className="font-semibold text-gold-700 hover:underline dark:text-gold-300">See 2026 results →</Link></p>
        </Card>
      )}
      <div className="grid gap-6 md:grid-cols-2">
        {awards.map((a) => <AwardCard key={a.id} award={a} />)}
      </div>
    </div>
  );
}

async function AwardCard({ award }: { award: Awaited<ReturnType<typeof getAwards>>[number] }) {
  const ranked = [...award.nominees].sort((x, y) => y[1] - x[1]);
  const winnerSlug = ranked[0]?.[0];
  return (
    <Card className="overflow-hidden p-0">
      <div className="flex items-center justify-between bg-gradient-to-r from-gold-600/15 to-transparent px-6 py-4">
        <h2 className="font-display text-xl font-bold tracking-tight">{award.category}</h2>
        <span className="text-2xl">🏆</span>
      </div>
      <div className="grid grid-cols-3 gap-3 p-6">
        {ranked.map(([slug, votes]) => (
          <NomineeTile key={slug} slug={slug} votes={votes} isHouse={award.type === 'house'} winner={slug === winnerSlug} />
        ))}
      </div>
    </Card>
  );
}

async function NomineeTile({ slug, votes, isHouse, winner }: { slug: string; votes: number; isHouse: boolean; winner: boolean }) {
  if (isHouse) {
    const h = await getHouse(slug);
    if (!h) return null;
    return (
      <div className={winner ? 'rounded-2xl ring-2 ring-gold-500 ring-offset-2 dark:ring-offset-ink-900' : ''}>
        {winner && <p className="mb-1 text-center text-[11px] font-bold uppercase text-gold-700 dark:text-gold-300">Winner</p>}
        <HouseCard house={h} />
        <p className="mt-1.5 text-center text-xs text-stone-400">{votes.toLocaleString('en-IN')} votes</p>
      </div>
    );
  }
  const p = await getPerfume(slug);
  if (!p) return null;
  return (
    <div className={winner ? 'rounded-2xl ring-2 ring-gold-500 ring-offset-2 dark:ring-offset-ink-900' : ''}>
      {winner && <p className="mb-1 text-center text-[11px] font-bold uppercase text-gold-700 dark:text-gold-300">Winner</p>}
      <PerfumeCard perfume={p} />
      <p className="mt-1.5 text-center text-xs text-stone-400">{votes.toLocaleString('en-IN')} votes</p>
    </div>
  );
}
