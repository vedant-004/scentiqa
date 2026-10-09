import Link from 'next/link';
import { getSniffStores, getSniffCities } from '@/lib/data';
import { Card, SectionHeading, Badge } from '@/components/ui';
import { Breadcrumbs } from '@/components';

export const metadata = {
  title: 'Where to Sniff in India',
  description: 'Find stores across India where you can smell and test perfumes before buying — niche boutiques, designer counters, and attar markets, city by city.',
};

export const revalidate = 600;

const TYPE_LABEL: Record<string, string> = {
  niche: 'Niche boutique',
  designer: 'Designer counter',
  attar: 'Attar market',
  department: 'Department store',
  multi: 'Multi-brand',
};

const TYPE_COLOR: Record<string, string> = {
  niche: 'bg-purple-500/15 text-purple-700 dark:text-purple-300',
  designer: 'bg-sky-500/15 text-sky-700 dark:text-sky-300',
  attar: 'bg-amber-500/15 text-amber-700 dark:text-amber-300',
  department: 'bg-stone-500/15 text-stone-600 dark:text-stone-300',
  multi: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300',
};

export default async function SniffPage({ searchParams }: { searchParams: Promise<{ city?: string }> }) {
  const { city } = await searchParams;
  const [cities, stores] = await Promise.all([getSniffCities(), getSniffStores(city)]);
  const activeCity = city && cities.includes(city) ? city : undefined;
  const shown = activeCity ? stores.filter((s) => s.city === activeCity) : stores;

  return (
    <div className="mx-auto max-w-5xl px-4 pt-6 sm:px-6">
      <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Where to Sniff' }]} />
      <SectionHeading kicker="City guide" title="Where to Sniff in India" />
      <p className="mb-6 max-w-2xl text-[15px] text-stone-500 dark:text-stone-400">
        Perfume is meant to be smelled, not guessed from a screen. These are real stores
        across India where you can test niche, designer, and attar fragrances before you buy.
      </p>

      <div className="mb-6 flex flex-wrap gap-2">
        <Link href="/sniff"
          className={`rounded-full px-4 py-2 text-sm font-semibold transition-all ${!activeCity ? 'bg-stone-900 text-white dark:bg-white dark:text-stone-900' : 'bg-stone-900/5 text-stone-600 hover:bg-stone-900/10 dark:bg-white/10 dark:text-stone-300'}`}>
          All cities
        </Link>
        {cities.map((c) => (
          <Link key={c} href={`/sniff?city=${encodeURIComponent(c)}`}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition-all ${activeCity === c ? 'bg-stone-900 text-white dark:bg-white dark:text-stone-900' : 'bg-stone-900/5 text-stone-600 hover:bg-stone-900/10 dark:bg-white/10 dark:text-stone-300'}`}>
            {c}
          </Link>
        ))}
      </div>

      {shown.length === 0 && (
        <Card className="p-8 text-center">
          <p className="text-sm text-stone-500">No stores listed yet — check back soon.</p>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {shown.map((s) => (
          <Card key={s.id} className="p-5">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className={TYPE_COLOR[s.store_type] ?? TYPE_COLOR.multi}>{TYPE_LABEL[s.store_type] ?? s.store_type}</Badge>
              {s.verified && (
                <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300">✓ Verified</span>
              )}
            </div>
            <h3 className="mt-2 font-display text-lg font-bold tracking-tight">{s.name}</h3>
            <p className="mt-0.5 text-sm font-medium text-stone-500 dark:text-stone-400">
              {s.area ? `${s.area}, ` : ''}{s.city}
            </p>
            {s.brands_text && <p className="mt-3 text-sm leading-relaxed text-stone-600 dark:text-stone-300">{s.brands_text}</p>}
            {s.samples_info && (
              <p className="mt-2 text-[13px] text-stone-500 dark:text-stone-400">
                <span className="font-semibold text-stone-700 dark:text-stone-200">Samples: </span>{s.samples_info}
              </p>
            )}
            {s.website && (
              <a href={s.website} target="_blank" rel="noopener noreferrer" className="mt-3 inline-block text-sm font-semibold text-gold-700 hover:underline dark:text-gold-300">
                Visit website →
              </a>
            )}
          </Card>
        ))}
      </div>

      <Card className="mt-8 p-6">
        <h2 className="font-display text-lg font-bold">Know a store we missed?</h2>
        <p className="mt-2 text-sm text-stone-500 dark:text-stone-400">
          This directory grows with the community. Tell us about it via the{' '}
          <Link href="/contact" className="font-semibold text-gold-700 hover:underline dark:text-gold-300">contact page</Link>{' '}
          and we will verify and add it.
        </p>
      </Card>
    </div>
  );
}
