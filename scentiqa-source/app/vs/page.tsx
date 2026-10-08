// /vs — index of curated head-to-head comparisons.
import Link from 'next/link';
import { VS_COMPARISONS, vsParam } from '@/lib/vs-comparisons';
import { getPerfumesBySlugs } from '@/lib/data-supabase';
import { SITE_URL } from '@/lib/site-url';
import { Breadcrumbs, Card, SectionHeading } from '@/components';

export const revalidate = 86400;

export const metadata = {
  title: 'Perfume Comparisons: Head-to-Head in India — Scentiqa',
  description: 'Side-by-side perfume comparisons with INR prices, ratings, accords and Indian-heat performance. Aventus vs Club de Nuit, Sauvage vs Bleu de Chanel and more.',
  alternates: { canonical: `${SITE_URL}/vs` },
};

export default async function VsIndexPage() {
  const slugs = [...new Set(VS_COMPARISONS.flatMap((p) => [p.a, p.b]))];
  const names = new Map((await getPerfumesBySlugs(slugs)).map((p) => [p.slug, p.name] as const));
  return (
    <div className="mx-auto max-w-7xl px-4 pt-6 sm:px-6">
      <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Versus' }]} />
      <SectionHeading kicker="Head to head" title="Perfume comparisons" />
      <p className="mb-8 max-w-2xl text-[15px] text-stone-600 dark:text-stone-300">
        Every comparison below is built from live catalog data — real Indian prices, community ratings,
        full note pyramids and climate-test scores. No filler, no invented numbers.
      </p>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {VS_COMPARISONS.map((p) => (
          <Link key={vsParam(p)} href={`/vs/${vsParam(p)}`} className="group block h-full">
            <Card hover className="flex h-full flex-col p-5">
              <h2 className="font-display text-xl font-semibold tracking-tight group-hover:text-gold-700 dark:group-hover:text-gold-300">
                {names.get(p.a) ?? p.a} <span className="font-normal text-stone-400">vs</span> {names.get(p.b) ?? p.b}
              </h2>
              <span className="mt-auto pt-3 text-sm font-semibold text-stone-400">Compare →</span>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
