// /best-perfumes — data-driven "best of" lists for Indian search intent.
// Every list is rendered from live catalog queries (climate scores, INR prices),
// never from a hardcoded perfume lineup.
import Link from 'next/link';
import { getSeoPerfumeList, type SeoListKind, type SeoPerfume } from '@/lib/seo';
import { VS_COMPARISONS, vsParam } from '@/lib/vs-comparisons';
import { getPerfumesBySlugs } from '@/lib/data-supabase';
import { SITE_URL } from '@/lib/site-url';
import { inr } from '@/lib/utils';
import { Breadcrumbs, Card, SectionHeading, Badge } from '@/components';
import { PerfumeCard } from '@/components/domain';

export const revalidate = 86400;

export const metadata = {
  title: 'Best Perfumes in India 2026: Monsoon, Office & Budget Picks — Scentiqa',
  description: 'Data-driven best perfume lists for India: top monsoon performers, best perfumes under ₹1,000, office scents for Indian weather and longest-lasting in heat. Real prices, ratings and climate scores.',
  alternates: { canonical: `${SITE_URL}/best-perfumes` },
};

interface ListDef {
  kind: SeoListKind; kicker: string; title: string; blurb: string;
  scoreLabel: (p: SeoPerfume) => string | null;
}

const LISTS: ListDef[] = [
  {
    kind: 'monsoon', kicker: 'Rain-tested',
    title: 'Best monsoon perfumes',
    blurb: 'Fragrances ranked by their monsoon-season score from community climate wear-tests across India.',
    scoreLabel: (p) => p.monsoonRating != null ? `Monsoon score ${p.monsoonRating}/100` : null,
  },
  {
    kind: 'budget', kicker: 'Under ₹1,000',
    title: 'Best perfumes under ₹1,000',
    blurb: 'The highest-rated fragrances you can actually buy in India for under a thousand rupees.',
    scoreLabel: (p) => p.lowestPriceInr ? `From ${inr(p.lowestPriceInr)}` : null,
  },
  {
    kind: 'office', kicker: 'Work-appropriate',
    title: 'Best office perfumes for Indian weather',
    blurb: 'Scents that stay pleasant through hot commutes and air-conditioned offices, ranked by summer score.',
    scoreLabel: (p) => p.summerRating != null ? `Summer score ${p.summerRating}/100` : null,
  },
  {
    kind: 'heat', kicker: 'Beast mode',
    title: 'Longest-lasting perfumes in Indian heat',
    blurb: 'Maximum longevity when the temperature climbs — ranked by heat-longevity test scores.',
    scoreLabel: (p) => p.heatLongevity != null ? `Heat longevity ${p.heatLongevity}/100` : null,
  },
];

function ListSection({ def, perfumes }: { def: ListDef; perfumes: SeoPerfume[] }) {
  if (perfumes.length === 0) return null;
  return (
    <section aria-label={def.title} className="mt-12">
      <SectionHeading kicker={def.kicker} title={def.title} />
      <p className="mb-6 max-w-2xl text-[15px] text-stone-600 dark:text-stone-300">{def.blurb}</p>
      <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {perfumes.map((p, i) => {
          const score = def.scoreLabel(p);
          return (
            <li key={p.slug} className="h-full">
              <div className="relative h-full">
                {score && (
                  <span className="absolute -top-2 left-3 z-10 rounded-full bg-stone-900 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white dark:bg-white dark:text-stone-900">
                    {score}
                  </span>
                )}
                <PerfumeCard
                  rank={i + 1}
                  perfume={{
                    slug: p.slug, name: p.name, house: p.house,
                    ratingAvg: p.ratingAvg, lowestPriceInr: p.lowestPriceInr,
                    isDupe: false, bottleImage: p.bottleImage,
                  }}
                />
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

export default async function BestPerfumesPage() {
  const [monsoon, budget, office, heat] = await Promise.all(
    (['monsoon', 'budget', 'office', 'heat'] as SeoListKind[]).map((k) => getSeoPerfumeList(k, 8)),
  );
  const lists: Array<{ def: ListDef; perfumes: SeoPerfume[] }> = [
    { def: LISTS[0], perfumes: monsoon },
    { def: LISTS[1], perfumes: budget },
    { def: LISTS[2], perfumes: office },
    { def: LISTS[3], perfumes: heat },
  ];
  const vsSlugs = [...new Set(VS_COMPARISONS.flatMap((p) => [p.a, p.b]))];
  const vsNames = new Map((await getPerfumesBySlugs(vsSlugs)).map((p) => [p.slug, p.name] as const));

  return (
    <div className="mx-auto max-w-7xl px-4 pt-6 sm:px-6">
      <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Best Perfumes' }]} />
      <p className="mt-4 text-xs font-bold uppercase tracking-[0.22em] text-gold-600 dark:text-gold-400">
        Ranked by real data
      </p>
      <h1 className="mt-1 font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
        Best perfumes in India
      </h1>
      <p className="mt-3 max-w-3xl text-[15px] leading-relaxed text-stone-600 dark:text-stone-300">
        No sponsored placements, no invented rankings. Every list below is computed from Scentiqa&apos;s live
        catalog — community climate wear-tests, verified INR prices and member ratings.
      </p>

      {lists.map(({ def, perfumes }) => (
        <ListSection key={def.kind} def={def} perfumes={perfumes} />
      ))}

      <section aria-label="Popular comparisons" className="mt-12">
        <SectionHeading kicker="Head to head" title="Popular comparisons" />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {VS_COMPARISONS.slice(0, 8).map((p) => (
            <Link key={vsParam(p)} href={`/vs/${vsParam(p)}`} className="group block">
              <Card hover className="p-4">
                <p className="font-display text-[15px] font-semibold group-hover:text-gold-700 dark:group-hover:text-gold-300">
                  {vsNames.get(p.a) ?? p.a} <span className="font-normal text-stone-400">vs</span> {vsNames.get(p.b) ?? p.b}
                </p>
              </Card>
            </Link>
          ))}
        </div>
        <p className="mt-4 text-sm">
          <Link href="/vs" className="font-semibold text-gold-700 hover:underline dark:text-gold-300">All comparisons →</Link>
          {' · '}
          <Link href="/dupes" className="font-semibold text-gold-700 hover:underline dark:text-gold-300">Dupe guides →</Link>
        </p>
      </section>

      <section aria-label="Methodology" className="mt-10">
        <Card className="p-5">
          <h2 className="font-display text-lg font-bold">How these lists are built</h2>
          <div className="mt-2 space-y-2 text-sm leading-relaxed text-stone-600 dark:text-stone-300">
            <p><Badge>Monsoon / Office / Heat</Badge> Ranked by climate wear-test scores from Scentiqa members testing in real Indian weather.</p>
            <p><Badge>Under ₹1,000</Badge> Ranked by review count among perfumes with a verified Indian price below ₹1,000.</p>
            <p>Lists refresh daily as new tests, prices and reviews land. <Link href="/climate-protocol" className="font-semibold text-gold-700 hover:underline dark:text-gold-300">Read the climate protocol →</Link></p>
          </div>
        </Card>
      </section>

    </div>
  );
}
