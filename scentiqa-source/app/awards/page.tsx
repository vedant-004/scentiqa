import Link from 'next/link';
import { getAwardYears, getAwards } from '@/lib/data';
import { Card, SectionHeading } from '@/components/ui';
import { Breadcrumbs } from '@/components';

export const metadata = {
  title: 'Scentiqa Awards',
  description: 'The Scentiqa Awards celebrate the best fragrances in the world and in India — from niche legends to desi clone heroes. Curated by the Scentiqa team.',
};

export const revalidate = 3600;

export default async function AwardsLandingPage() {
  const years = await getAwardYears();
  const counts = await Promise.all(years.map(async (y) => (await getAwards(y)).length));
  return (
    <div className="mx-auto max-w-7xl px-4 pt-6 sm:px-6">
      <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Awards' }]} />
      <div className="relative mb-8 overflow-hidden rounded-3xl">
        <div aria-hidden className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: "url('/images/awards/awards-hero-uhd.jpg')" }} />
        <div aria-hidden className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/55 to-black/80" />
        <div className="relative p-8 text-center sm:p-14">
          <p className="mb-3 text-5xl">🏆</p>
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.25em] text-gold-300">Scentiqa Awards</p>
          <h1 className="font-display text-4xl font-extrabold tracking-tight text-white sm:text-5xl">
            The best scents, crowned.
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-[15px] leading-relaxed text-stone-200">
            Fragrantica-style honours with an Indian twist: global legends sit next to desi heroes —
            the best attars, monsoon beasts, budget kings and clone houses of India.
            Every winner is a Scentiqa team pick, chosen from real catalog data.
          </p>
        </div>
      </div>

      <SectionHeading kicker="Editions" title="Award years" />
      {years.length === 0 && (
        <Card className="p-10 text-center">
          <p className="font-display text-xl font-semibold">No award editions yet</p>
          <p className="mt-2 text-sm text-stone-500">Check back soon.</p>
        </Card>
      )}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {years.map((y, i) => (
          <Link key={y} href={`/awards/${y}`} className="group block">
            <Card hover className="p-6">
              <p className="text-4xl">🏆</p>
              <h2 className="mt-3 font-display text-2xl font-bold tracking-tight group-hover:text-gold-700 dark:group-hover:text-gold-300">
                Scentiqa Awards {y}
              </h2>
              <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">
                {counts[i]} categor{counts[i] === 1 ? 'y' : 'ies'} · India + Global
              </p>
              <p className="mt-3 text-sm font-semibold text-gold-700 dark:text-gold-300">Explore →</p>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
