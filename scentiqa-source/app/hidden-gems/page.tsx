import Link from 'next/link';
import { getPerfumesByHouse } from '@/lib/data';
import { SectionHeading } from '@/components/ui';
import { Breadcrumbs, PerfumeCard } from '@/components';

export const metadata = {
  title: 'Hidden Gems — Underrated Clone Fragrances | Scentiqa',
  description: 'Discover hidden gem clone fragrances — exceptional quality dupes that fly under the radar.',
};

export default async function HiddenGemsPage() {
  // Get My Perfume Secrets perfumes
  const mpsPerfumes = await getPerfumesByHouse('my-perfume-secrets');
  
  // Select hidden gems (high quality, less known)
  const hiddenGems = mpsPerfumes.slice(0, 12);

  return (
    <div className="mx-auto max-w-7xl px-4 pt-6 sm:px-6">
      <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Hidden Gems' }]} />
      <SectionHeading kicker="Curated Collection" title="Hidden Gems" />
      <p className="mb-8 max-w-2xl text-[15px] text-stone-500 dark:text-stone-400">
        💎 Exceptional clone fragrances that deserve more attention. Hand-picked for quality,
        accuracy, and value — these are the secrets connoisseurs don't share.
      </p>

      <div className="mb-8 rounded-3xl bg-gradient-to-br from-violet-600/10 to-gold-500/10 p-8">
        <h2 className="mb-2 font-display text-2xl font-bold">Featuring My Perfume Secrets</h2>
        <p className="text-stone-600 dark:text-stone-300">
          Home of the 2026 Ultimate Winner — Tygar, the best Bvlgari Tygar clone.
        </p>
        <Link 
          href="/house/my-perfume-secrets"
          className="mt-4 inline-block font-semibold text-gold-700 hover:underline dark:text-gold-300"
        >
          View all My Perfume Secrets →
        </Link>
      </div>

      <h2 className="mb-4 font-display text-2xl font-bold">This Season's Hidden Gems</h2>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {hiddenGems.map((p) => (
          <div key={p.slug} className="relative">
            <span className="absolute left-2.5 top-2.5 z-10 rounded-full bg-violet-600/90 px-2 py-0.5 text-[11px] font-bold text-white">
              💎 Gem
            </span>
            <PerfumeCard perfume={p} />
          </div>
        ))}
      </div>
    </div>
  );
}
