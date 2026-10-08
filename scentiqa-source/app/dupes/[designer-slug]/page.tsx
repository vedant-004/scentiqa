// /dupes/[designer-slug] — "Best {original} dupes in India".
// Static pages generated for every original with >= 2 verified dupes.
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getPerfume } from '@/lib/data-supabase';
import { getDupeGuideOriginals } from '@/lib/seo';
import { SITE_URL } from '@/lib/site-url';
import { inr } from '@/lib/utils';
import { Breadcrumbs, Card, SectionHeading, Badge, DupeCard, StarRating, ProductImage } from '@/components';

export const revalidate = 86400;

export async function generateStaticParams() {
  try {
    const guides = await getDupeGuideOriginals();
    return guides.map((g) => ({ 'designer-slug': g.slug }));
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }: { params: Promise<{ 'designer-slug': string }> }) {
  const { 'designer-slug': slug } = await params;
  const p = await getPerfume(slug);
  if (!p || p.dupes.length < 2) return { title: 'Perfume dupe guides in India — Scentiqa' };
  const cheapest = p.dupes.map((d) => d.dupe.lowestPriceInr).filter((v): v is number => v !== null);
  const from = cheapest.length > 0 ? ` from ${inr(Math.min(...cheapest))}` : '';
  const url = `${SITE_URL}/dupes/${slug}`;
  return {
    title: `Best ${p.name} Dupes in India (${p.dupes.length} Alternatives${from}) — Scentiqa`,
    description: `${p.name} by ${p.houseInfo.name} too pricey? Compare ${p.dupes.length} verified dupes and alternatives available in India, with similarity scores, tester verdicts and INR prices.`,
    alternates: { canonical: url },
    openGraph: { title: `Best ${p.name} Dupes in India — Scentiqa`, url, type: 'article' },
  };
}

export default async function DupeGuidePage({ params }: { params: Promise<{ 'designer-slug': string }> }) {
  const { 'designer-slug': slug } = await params;
  const p = await getPerfume(slug);
  if (!p || p.dupes.length < 2) notFound();

  const cheapest = p.dupes.map((d) => d.dupe.lowestPriceInr).filter((v): v is number => v !== null);
  const minPrice = cheapest.length > 0 ? Math.min(...cheapest) : null;
  const labTested = p.dupes.filter((d) => d.testedBy === 'lab').length;

  return (
    <div className="mx-auto max-w-7xl px-4 pt-6 sm:px-6">
      <Breadcrumbs items={[
        { label: 'Home', href: '/' },
        { label: 'Dupe Guides', href: '/dupes' },
        { label: p.name },
      ]} />

      <p className="mt-4 text-xs font-bold uppercase tracking-[0.22em] text-gold-600 dark:text-gold-400">
        Dupe guide · India
      </p>
      <h1 className="mt-1 font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
        Best {p.name} dupes in India
      </h1>
      <p className="mt-3 max-w-3xl text-[15px] leading-relaxed text-stone-600 dark:text-stone-300">
        {p.name} by <Link href={`/house/${p.houseInfo.slug}`} className="font-semibold text-gold-700 hover:underline dark:text-gold-300">{p.houseInfo.name}</Link> is
        loved across India, but it doesn&apos;t come cheap. Below are {p.dupes.length} verified alternatives you can
        actually buy here — ranked by similarity, with honest tester verdicts and live INR prices
        {minPrice !== null && <> starting at <strong>{inr(minPrice)}</strong></>}.
      </p>

      {/* The original */}
      <section aria-label="The original fragrance" className="mt-8">
        <SectionHeading kicker="The original" title={p.name} />
        <Card className="flex flex-col gap-5 p-5 sm:flex-row">
          <div className="flex shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-cream-100 to-gold-300/20 p-4 dark:from-ink-800 dark:to-gold-700/10">
            <ProductImage name={p.name} house={p.house} image={p.bottleImage} size="md" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-gold-600 dark:text-gold-400">{p.house}</p>
            <div className="mt-1 flex flex-wrap items-center gap-3">
              <StarRating value={p.ratingAvg} count={p.ratingCount} />
              <span className="text-lg font-bold">{inr(p.lowestPriceInr)}</span>
            </div>
            <p className="mt-2 text-sm text-stone-600 dark:text-stone-300">
              {p.accords.slice(0, 3).map((a) => a.name).join(' · ') || '—'}
              {p.concentration ? ` · ${p.concentration.toUpperCase()}` : ''}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link href={`/perfume/${p.slug}`} className="rounded-full bg-stone-900 px-4 py-2 text-sm font-semibold text-white hover:bg-stone-700 dark:bg-white dark:text-stone-900">Full details</Link>
              <Link href={`/compare?ids=${p.slug}`} className="rounded-full border border-stone-300 px-4 py-2 text-sm font-semibold hover:border-gold-600 dark:border-ink-700">Compare it yourself</Link>
            </div>
          </div>
        </Card>
      </section>

      {/* The dupes */}
      <section aria-label="Verified dupes" className="mt-10">
        <SectionHeading
          kicker={`${p.dupes.length} alternatives`}
          title="Verified dupes, ranked by similarity"
          action={labTested > 0 ? <Badge>{labTested} lab-tested</Badge> : undefined}
        />
        <div className="grid gap-4">
          {p.dupes.map((d) => (
            <DupeCard key={d.id} entry={d} originalName={p.name} />
          ))}
        </div>
      </section>

      {/* Honesty note */}
      <section aria-label="How dupes are verified" className="mt-10">
        <Card className="p-5">
          <h2 className="font-display text-lg font-bold">How Scentiqa verifies dupes</h2>
          <p className="mt-2 text-sm leading-relaxed text-stone-600 dark:text-stone-300">
            Every alternative above comes from our dupe database. Entries marked with a lab score were
            side-by-side tested by the Scentiqa team; the rest are community-suggested and clearly labeled
            while testing is pending. We never invent similarity numbers — if a score isn&apos;t shown,
            it hasn&apos;t been measured yet.
          </p>
          <p className="mt-3 text-sm">
            <Link href="/dupes" className="font-semibold text-gold-700 hover:underline dark:text-gold-300">Browse all dupe guides →</Link>
          </p>
        </Card>
      </section>
    </div>
  );
}
