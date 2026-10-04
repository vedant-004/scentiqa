import { getAllHouses } from '@/lib/data';
import { HOUSE_TYPE_LABEL } from '@/lib/utils';
import { Breadcrumbs, HouseCard } from '@/components';
import { SectionHeading } from '@/components/ui';
import type { House } from '@/lib/types';

export const metadata = {
  title: 'All perfume houses',
  description: 'Browse every perfume house on Scentiqa — Indian clone houses, designers, niche, attar makers and more, with INR prices from verified sellers.',
};

export const revalidate = 86400; // refresh counts daily

const TYPE_ORDER = ['indian_clone', 'designer', 'niche', 'middle_eastern', 'attar_maker', 'artisan', 'mass'];

export default async function HousesPage() {
  const houses = await getAllHouses();
  const totalPerfumes = houses.reduce((n, h) => n + (h.perfumeCount || 0), 0);

  const groups = TYPE_ORDER
    .map((type) => ({
      type,
      label: HOUSE_TYPE_LABEL[type] ?? type,
      houses: houses.filter((h: House) => h.type === type),
    }))
    .filter((g) => g.houses.length > 0);
  const ungrouped = houses.filter((h: House) => !TYPE_ORDER.includes(h.type));
  if (ungrouped.length) groups.push({ type: 'other', label: 'Other', houses: ungrouped });

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

      <div className="mt-8 space-y-10">
        {groups.map((g) => (
          <section key={g.type}>
            <SectionHeading
              kicker={`${g.houses.length} ${g.houses.length === 1 ? 'house' : 'houses'}`}
              title={g.label}
            />
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {g.houses.map((h: House) => (
                <HouseCard key={h.slug} house={h} />
              ))}
            </div>
          </section>
        ))}
      </div>

      {houses.length === 0 && (
        <p className="mt-12 text-center text-sm text-stone-500 dark:text-stone-400">
          No houses found. Check back soon.
        </p>
      )}
    </div>
  );
}
