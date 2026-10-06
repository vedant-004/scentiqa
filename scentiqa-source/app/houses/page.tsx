import { getAllHouses } from '@/lib/data';
import { Breadcrumbs } from '@/components';
import HousesExplorer from './houses-explorer';

export const metadata = {
  title: 'All perfume houses',
  description: 'Browse every perfume house on Scentiqa — Indian clone houses, designers, niche, attar makers and more, with INR prices from verified sellers.',
};

export const revalidate = 86400; // refresh counts daily

export default async function HousesPage() {
  const houses = await getAllHouses();
  const totalPerfumes = houses.reduce((n, h) => n + (h.perfumeCount || 0), 0);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Houses' }]} />

      <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-gold-600 dark:text-gold-400">
            Directory
          </p>
          <h1 className="mt-1 font-display text-3xl font-bold tracking-tight sm:text-4xl">
            All perfume houses
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-stone-500 dark:text-stone-400">
            {houses.length} houses · {totalPerfumes.toLocaleString('en-IN')} fragrances indexed.
            Pick a house to browse its perfumes, dupes and INR prices.
          </p>
        </div>
      </div>

      <HousesExplorer houses={houses} />
    </div>
  );
}
