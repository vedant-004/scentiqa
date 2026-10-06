import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getAwards, getAwardYears } from '@/lib/data';
import type { AwardCategory, AwardNominee } from '@/lib/types';
import { Card, SectionHeading, Badge } from '@/components/ui';
import { Breadcrumbs } from '@/components';
import { NomineeImg, nomineeHref } from '../components';

export const revalidate = 3600;

export async function generateMetadata({ params }: { params: Promise<{ year: string }> }) {
  const { year } = await params;
  return {
    title: `Scentiqa Awards ${year}`,
    description: `Scentiqa Awards ${year}: the best fragrances in the world and India — niche, designer, attars, monsoon beasts and desi clone heroes.`,
  };
}

export default async function AwardsYearPage({ params }: { params: Promise<{ year: string }> }) {
  const { year } = await params;
  const y = Number(year);
  if (!Number.isFinite(y)) notFound();
  const [categories, years] = await Promise.all([getAwards(y), getAwardYears()]);
  if (categories.length === 0) notFound();

  const ultimate = categories.find((c) => c.slug === `ultimate-winner-${y}` && c.winner);
  const indian = categories.filter((c) => c.section === 'indian' && c.slug !== ultimate?.slug);
  const global = categories.filter((c) => c.section === 'global');

  return (
    <div className="mx-auto max-w-7xl px-4 pt-6 sm:px-6">
      <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Awards', href: '/awards' }, { label: String(y) }]} />
      <SectionHeading kicker="Scentiqa's choice" title={`Scentiqa Awards ${y}`} />
      <p className="mb-6 max-w-2xl text-[15px] text-stone-500 dark:text-stone-400">
        Our team's annual picks — global legends and Indian heroes, from niche icons to
        monsoon beasts and budget kings. Winners are Scentiqa team selections, not sponsored placements.
      </p>

      <div className="mb-8 flex flex-wrap gap-2">
        {years.map((yy) => (
          <Link key={yy} href={`/awards/${yy}`}
            className={yy === y
              ? 'rounded-full bg-gold-600 px-4 py-1.5 text-sm font-bold text-white'
              : 'rounded-full border border-stone-300 px-4 py-1.5 text-sm font-medium hover:border-gold-600 dark:border-ink-700'}>
            {yy}
          </Link>
        ))}
      </div>

      {ultimate?.winner && <UltimateBanner category={ultimate} winner={ultimate.winner} />}

      <SectionHeading kicker="Desi honours" title="Scentiqa India Awards" />
      <div className="mb-10 grid gap-6 md:grid-cols-2">
        {indian.map((c) => <CategoryCard key={c.id} category={c} year={y} />)}
      </div>

      <SectionHeading kicker="World stage" title="Global Awards" />
      <div className="grid gap-6 md:grid-cols-2">
        {global.map((c) => <CategoryCard key={c.id} category={c} year={y} />)}
      </div>
    </div>
  );
}

function UltimateBanner({ category, winner }: { category: AwardCategory; winner: AwardNominee }) {
  const href = winner.kind === 'house' ? `/house/${winner.slug}` : `/perfume/${winner.slug}`;
  return (
    <Card className="mb-10 overflow-hidden p-0">
      <div className="relative overflow-hidden text-center">
        <div aria-hidden className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: "url('/images/awards/awards-hero-uhd.jpg')" }} />
        <div aria-hidden className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/55 to-black/80" />
        <div className="relative p-8 sm:p-12">
          <p className="mb-2 text-6xl">{category.icon}</p>
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.25em] text-gold-300">{category.name}</p>
          <h2 className="font-display text-4xl font-bold text-white sm:text-5xl">{winner.name}</h2>
          {winner.houseName && <p className="mt-2 text-lg text-stone-200">by {winner.houseName}</p>}
          <div className="mt-6 inline-flex items-center gap-2 rounded-full bg-gold-500/20 px-6 py-2.5 ring-1 ring-gold-400/40">
            <span className="text-2xl">⭐</span>
            <span className="font-bold text-gold-200">Scentiqa's Choice {category.year}</span>
          </div>
          <div className="mt-6">
            <Link href={href} className="inline-block rounded-full bg-gold-600 px-8 py-3 font-bold text-white transition-colors hover:bg-gold-700">
              View {winner.kind === 'house' ? 'house' : 'fragrance'} →
            </Link>
          </div>
        </div>
      </div>
    </Card>
  );
}

function CategoryCard({ category, year }: { category: AwardCategory; year: number }) {
  const w = category.winner;
  return (
    <Card hover className="overflow-hidden p-0">
      <div className="flex items-start justify-between gap-3 bg-gradient-to-r from-gold-600/15 to-transparent px-6 py-4">
        <div>
          <h2 className="font-display text-xl font-bold tracking-tight">
            <span className="mr-2">{category.icon}</span>{category.name}
          </h2>
          {category.description && (
            <p className="mt-1 text-[13px] leading-snug text-stone-500 dark:text-stone-400">{category.description}</p>
          )}
        </div>
        <Badge>{category.nominees.length} nominee{category.nominees.length === 1 ? '' : 's'}</Badge>
      </div>
      <div className="p-6">
        {w ? (
          <WinnerTile nominee={w} />
        ) : (
          <p className="rounded-2xl bg-stone-100/70 p-4 text-center text-sm text-stone-500 dark:bg-white/[0.04] dark:text-stone-400">
            Winner to be announced
          </p>
        )}
        {category.nominees.length > 1 && (
          <div className="mt-4 flex items-center gap-2">
            {category.nominees.filter((n) => !n.isWinner).slice(0, 4).map((n) => (
              <NomineeThumb key={n.rowId} nominee={n} />
            ))}
            <Link href={`/awards/${year}/${category.slug}`}
              className="ml-auto shrink-0 text-sm font-semibold text-gold-700 hover:underline dark:text-gold-300">
              All nominees →
            </Link>
          </div>
        )}
        {category.nominees.length <= 1 && (
          <div className="mt-4 text-right">
            <Link href={`/awards/${year}/${category.slug}`}
              className="text-sm font-semibold text-gold-700 hover:underline dark:text-gold-300">
              View category →
            </Link>
          </div>
        )}
      </div>
    </Card>
  );
}

function WinnerTile({ nominee }: { nominee: AwardNominee }) {
  const href = nomineeHref(nominee);
  return (
    <Link href={href} className="group flex items-center gap-4 rounded-2xl bg-gold-500/10 p-4 ring-1 ring-gold-500/40 transition hover:bg-gold-500/15">
      <NomineeImg nominee={nominee} boxClass="h-16 w-16 shrink-0 rounded-xl bg-white/60 dark:bg-white/10" textClass="text-xl" />
      <div className="min-w-0">
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-gold-700 dark:text-gold-300">👑 Winner</p>
        <p className="truncate font-display text-lg font-bold group-hover:text-gold-700 dark:group-hover:text-gold-300">{nominee.name}</p>
        {nominee.houseName && <p className="truncate text-[13px] text-stone-500 dark:text-stone-400">{nominee.houseName}</p>}
      </div>
    </Link>
  );
}

function NomineeThumb({ nominee }: { nominee: AwardNominee }) {
  return (
    <Link href={nomineeHref(nominee)} title={nominee.name} className="block rounded-xl ring-1 ring-stone-200 dark:ring-white/10">
      <NomineeImg nominee={nominee} boxClass="h-12 w-12 rounded-xl bg-stone-100 dark:bg-white/[0.06]" textClass="text-xs" />
    </Link>
  );
}
