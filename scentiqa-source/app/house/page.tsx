import Link from 'next/link';
import { getAllHouses } from '@/lib/data';
import { SectionHeading } from '@/components/ui';
import { HouseCard } from '@/components';
import { Breadcrumbs } from '@/components';

export const metadata = {
  title: 'All Perfume Houses | Scentiqa',
  description: 'Browse all perfume houses on Scentiqa — Indian clone brands, designer houses, niche perfumeries.',
};

export default async function HousesPage() {
  const houses = await getAllHouses();

  // Group by type
  const byType = houses.reduce((acc, h) => {
    if (!acc[h.type]) acc[h.type] = [];
    acc[h.type].push(h);
    return acc;
  }, {} as Record<string, typeof houses>);

  const typeOrder = ['indian_clone', 'designer', 'niche', 'middle_eastern', 'attar_maker', 'artisan', 'mass'];
  const typeLabels: Record<string, string> = {
    indian_clone: 'Indian Clone Houses',
    designer: 'Designer Houses',
    niche: 'Niche Houses',
    middle_eastern: 'Middle Eastern',
    attar_maker: 'Attar Makers',
    artisan: 'Artisan',
    mass: 'Mass Market',
  };

  return (
    <div className="mx-auto max-w-7xl px-4 pt-6 sm:px-6">
      <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Houses' }]} />
      <SectionHeading kicker="Directory" title={`All Houses (${houses.length})`} />
      <p className="mb-8 max-w-2xl text-[15px] text-stone-500 dark:text-stone-400">
        Explore {houses.length} perfume houses — from Indian clone brands to international designers.
        Click any house to see all their fragrances.
      </p>

      {typeOrder.map((type) => {
        const list = byType[type];
        if (!list || list.length === 0) return null;
        return (
          <section key={type} className="mb-12">
            <h2 className="mb-4 font-display text-2xl font-bold">
              {typeLabels[type] || type} <span className="text-base font-normal text-stone-400">({list.length})</span>
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {list.map((h) => (
                <HouseCard key={h.slug} house={h} />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
