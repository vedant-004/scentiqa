import Link from 'next/link';
import { getHouse } from '@/lib/data';
import { Breadcrumbs } from '@/components';
import { Button, Card, SectionHeading } from '@/components';

export const metadata = {
  title: 'Verified Sellers',
  description: 'Authentic perfume sellers in India, verified by the Scentiqa team.',
};

export const revalidate = 86400;

// Curated by the site owner: only these sellers are listed for now.
const SELLERS = [
  {
    houseSlug: 'house-of-em5',
    name: 'House of EM5',
    website: 'https://www.houseofem5.com',
    blurb:
      'Mumbai-born clone house crafting inspired EDPs of popular designer and niche fragrances at honest Indian prices.',
    tags: ['Clone house', 'Made in India', 'EDPs'],
  },
  {
    houseSlug: 'my-perfume-secrets',
    name: 'My Perfume Secrets',
    website: 'https://myperfumesecrets.com',
    blurb:
      'High-concentration extrait-style dupes of luxury designer scents — one of India\u2019s most loved affordable fragrance brands.',
    tags: ['Dupe house', 'High concentration', 'Bestsellers'],
  },
];

export default async function SellersPage() {
  const houses = await Promise.all(SELLERS.map((s) => getHouse(s.houseSlug)));
  return (
    <div className="mx-auto max-w-7xl px-4 pt-6 sm:px-6">
      <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Verified Sellers' }]} />
      <SectionHeading kicker="Buy with confidence" title="Verified sellers" />
      <p className="mb-8 max-w-2xl text-[15px] leading-relaxed text-stone-600 dark:text-stone-300">
        Every seller listed here is <strong>authentic and verified by the Scentiqa team</strong>.
        These are the brands&rsquo; own official stores — no grey market, no fakes, ever.
      </p>

      <div className="grid gap-6 md:grid-cols-2">
        {SELLERS.map((s, i) => {
          const house = houses[i];
          const count = house?.perfumes.length ?? null;
          return (
            <Card key={s.houseSlug} className="relative overflow-hidden p-0">
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-gold-300/20 via-transparent to-transparent dark:from-gold-600/10" aria-hidden="true" />
              <div className="relative p-6 sm:p-8">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-bold text-emerald-700 dark:text-emerald-300">
                    <span aria-hidden="true">✓</span> Verified by Scentiqa
                  </span>
                  {s.tags.map((t) => (
                    <span key={t} className="rounded-full bg-stone-900/5 px-3 py-1 text-xs font-semibold text-stone-500 dark:bg-white/10 dark:text-stone-300">
                      {t}
                    </span>
                  ))}
                </div>
                <h2 className="mt-4 font-display text-3xl font-bold tracking-tight">{s.name}</h2>
                <p className="mt-2 text-[15px] leading-relaxed text-stone-600 dark:text-stone-300">{s.blurb}</p>
                {house?.description ? (
                  <p className="mt-3 line-clamp-3 text-sm text-stone-500 dark:text-stone-400">{house.description}</p>
                ) : null}
                {count !== null && (
                  <p className="mt-3 text-sm font-semibold text-gold-700 dark:text-gold-300">
                    {count} perfumes in the Scentiqa catalog
                  </p>
                )}
                <div className="mt-6 flex flex-wrap gap-3">
                  <a href={s.website} target="_blank" rel="noreferrer noopener">
                    <Button size="lg">Visit official website ↗</Button>
                  </a>
                  <Link href={`/house/${s.houseSlug}`}>
                    <Button variant="outline" size="lg">Browse their perfumes</Button>
                  </Link>
                </div>
                <p className="mt-4 break-all text-xs text-stone-400">{s.website}</p>
              </div>
            </Card>
          );
        })}
      </div>

      <Card className="mt-8 p-6 text-center">
        <p className="text-sm text-stone-500 dark:text-stone-400">
          Know a seller we should verify? <Link href="/contact" className="font-semibold text-gold-700 underline dark:text-gold-300">Tell us</Link> — we
          check every submission before listing.
        </p>
      </Card>
    </div>
  );
}
