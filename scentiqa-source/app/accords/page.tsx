// /accords — the Scentiqa accord encyclopedia index.
import Link from 'next/link';
import { getAccordIndex, accordSlug } from '@/lib/accords-data';
import { Breadcrumbs } from '@/components';
import { Card, SectionHeading } from '@/components/ui';
import { AccordsIndexClient } from './accords-client';

export const metadata = {
  title: 'Fragrance Accords Encyclopedia',
  description: 'Explore every fragrance accord — what each smells like, and the perfumes built around it.',
};
export const revalidate = 3600;

export default async function AccordsIndex() {
  const data = await getAccordIndex();
  const accords = [...data.index.entries()].map(([key, refs]) => ({
    slug: accordSlug(data.displayNames.get(key) ?? key),
    name: data.displayNames.get(key) ?? key,
    count: refs.length,
    avgStrength: data.avgStrength.get(key) ?? 0,
  })).sort((a, b) => b.count - a.count);

  return (
    <div className="mx-auto max-w-6xl px-4 pt-6 sm:px-6">
      <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Accords' }]} />
      <SectionHeading kicker="Encyclopedia" title="Fragrance accords, decoded" />
      <p className="mb-6 -mt-3 max-w-2xl text-sm text-stone-500 dark:text-stone-400">
        An accord is the overall impression a perfume leaves — woody, citrus, gourmand. Browse every accord in the catalog and the perfumes that wear it loudest.
      </p>
      {accords.length === 0 ? (
        <Card className="p-8 text-center text-sm text-stone-500">Accord data is still loading.</Card>
      ) : (
        <AccordsIndexClient accords={accords} />
      )}
      <p className="mt-6 text-center text-xs text-stone-400">
        <Link href="/search/accords" className="font-bold text-gold-700 hover:underline dark:text-gold-300">Find your accord with the AI accord finder →</Link>
      </p>
    </div>
  );
}
