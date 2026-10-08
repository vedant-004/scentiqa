// /dupes — index of every designer dupe guide.
import Link from 'next/link';
import { getDupeGuideOriginals } from '@/lib/seo';
import { SITE_URL } from '@/lib/site-url';
import { Breadcrumbs, Card, SectionHeading } from '@/components';

export const revalidate = 86400;

export const metadata = {
  title: 'Designer Perfume Dupe Guides in India — Scentiqa',
  description: 'Every Scentiqa dupe guide: verified affordable alternatives to expensive designer and niche perfumes, with similarity scores and INR prices for India.',
  alternates: { canonical: `${SITE_URL}/dupes` },
};

export default async function DupesIndexPage() {
  const guides = await getDupeGuideOriginals();
  return (
    <div className="mx-auto max-w-7xl px-4 pt-6 sm:px-6">
      <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Dupe Guides' }]} />
      <SectionHeading kicker="Smell expensive for less" title="Designer dupe guides" />
      <p className="mb-8 max-w-2xl text-[15px] text-stone-600 dark:text-stone-300">
        Every guide below lists verified dupes for one designer or niche original — ranked by similarity,
        with tester verdicts and prices you can actually pay in India.
      </p>
      {guides.length === 0 ? (
        <p className="text-stone-500">Dupe guides are being prepared. Check back soon.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {guides.map((g) => (
            <Link key={g.slug} href={`/dupes/${g.slug}`} className="group block h-full">
              <Card hover className="flex h-full flex-col p-5">
                <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-gold-600 dark:text-gold-400">{g.house}</p>
                <h2 className="mt-1 font-display text-xl font-semibold tracking-tight group-hover:text-gold-700 dark:group-hover:text-gold-300">
                  Best {g.name} dupes in India
                </h2>
                <p className="mt-2 text-sm text-stone-500">{g.dupeCount} verified alternatives</p>
                <span className="mt-auto pt-3 text-sm font-semibold text-stone-400">View guide →</span>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
