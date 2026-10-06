import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getAwards } from '@/lib/data';
import type { AwardNominee } from '@/lib/types';
import { Card, SectionHeading, Badge } from '@/components/ui';
import { Breadcrumbs } from '@/components';
import { NomineeImg, nomineeHref } from '../../components';

export const revalidate = 3600;

export async function generateMetadata({ params }: { params: Promise<{ year: string; category: string }> }) {
  const { year, category } = await params;
  const cats = await getAwards(Number(year));
  const c = cats.find((x) => x.slug === category);
  return {
    title: c ? `${c.name} — Scentiqa Awards ${year}` : `Scentiqa Awards ${year}`,
    description: c?.description ?? `Scentiqa Awards ${year} category nominees and winner.`,
  };
}

export default async function AwardCategoryPage({ params }: { params: Promise<{ year: string; category: string }> }) {
  const { year, category } = await params;
  const y = Number(year);
  if (!Number.isFinite(y)) notFound();
  const cats = await getAwards(y);
  const c = cats.find((x) => x.slug === category);
  if (!c) notFound();

  return (
    <div className="mx-auto max-w-7xl px-4 pt-6 sm:px-6">
      <Breadcrumbs items={[
        { label: 'Home', href: '/' },
        { label: 'Awards', href: '/awards' },
        { label: String(y), href: `/awards/${y}` },
        { label: c.name },
      ]} />

      <div className="mb-8 flex items-start gap-4">
        <span className="text-5xl">{c.icon}</span>
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-gold-600 dark:text-gold-400">
            {c.section === 'indian' ? 'Scentiqa India Awards' : 'Global Awards'} · {y}
          </p>
          <h1 className="mt-1 font-display text-3xl font-extrabold tracking-tight sm:text-4xl">{c.name}</h1>
          {c.description && <p className="mt-2 max-w-2xl text-[15px] text-stone-500 dark:text-stone-400">{c.description}</p>}
        </div>
      </div>

      {c.winner && (
        <Card className="mb-8 overflow-hidden border-gold-500/50 p-0">
          <div className="bg-gradient-to-r from-gold-600/20 via-gold-500/10 to-transparent p-6 sm:p-8">
            <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-gold-700 dark:text-gold-300">👑 Winner · Scentiqa's Choice</p>
            <Link href={nomineeHref(c.winner)} className="group mt-3 flex items-center gap-5">
              <NomineeImg nominee={c.winner} boxClass="h-24 w-24 shrink-0 rounded-2xl bg-white/70 dark:bg-white/10" textClass="text-2xl" />
              <div className="min-w-0">
                <p className="font-display text-2xl font-bold tracking-tight group-hover:text-gold-700 dark:group-hover:text-gold-300 sm:text-3xl">{c.winner.name}</p>
                {c.winner.houseName && <p className="mt-1 text-stone-500 dark:text-stone-400">by {c.winner.houseName}</p>}
              </div>
            </Link>
          </div>
        </Card>
      )}

      <SectionHeading kicker={c.winner ? 'Also nominated' : 'Nominees'} title={c.nominees.length === 0 ? 'Nominees announced soon' : `${c.nominees.length} nominee${c.nominees.length === 1 ? '' : 's'}`} />

      {c.nominees.length === 0 && (
        <Card className="p-10 text-center">
          <p className="text-4xl">⏳</p>
          <p className="mt-3 font-display text-xl font-semibold">Nominees for this category are being finalized</p>
          <p className="mt-2 text-sm text-stone-500">Check back soon — or explore the other {y} categories.</p>
          <Link href={`/awards/${y}`} className="mt-4 inline-block text-sm font-semibold text-gold-700 hover:underline dark:text-gold-300">
            ← Back to Scentiqa Awards {y}
          </Link>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {c.nominees.map((n, i) => <NomineeRow key={n.rowId} nominee={n} rank={i + 1} />)}
      </div>

      <div className="mt-10">
        <Link href={`/awards/${y}`} className="text-sm font-semibold text-gold-700 hover:underline dark:text-gold-300">
          ← Back to Scentiqa Awards {y}
        </Link>
      </div>
    </div>
  );
}

function NomineeRow({ nominee, rank }: { nominee: AwardNominee; rank: number }) {
  return (
    <Link href={nomineeHref(nominee)} className="group block">
      <Card hover className={`flex items-center gap-4 p-4 ${nominee.isWinner ? 'ring-2 ring-gold-500' : ''}`}>
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-stone-900/85 font-display text-sm font-bold text-white dark:bg-white/90 dark:text-stone-900">
          {rank}
        </span>
        <NomineeImg nominee={nominee} boxClass="h-14 w-14 shrink-0 rounded-xl bg-stone-100 dark:bg-white/[0.06]" textClass="text-sm" />
        <div className="min-w-0 flex-1">
          <p className="truncate font-display text-[16px] font-semibold group-hover:text-gold-700 dark:group-hover:text-gold-300">{nominee.name}</p>
          {nominee.houseName && <p className="truncate text-xs text-stone-500 dark:text-stone-400">{nominee.houseName}</p>}
        </div>
        {nominee.isWinner && <Badge className="shrink-0 bg-gold-600 text-white">Winner</Badge>}
      </Card>
    </Link>
  );
}
