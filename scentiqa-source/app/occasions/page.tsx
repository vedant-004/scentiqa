import type { Metadata } from 'next';
import { PickFinder } from '@/components/pick-finder';
import { OCCASIONS } from '@/lib/weather-occasions';

export const metadata: Metadata = {
  title: 'Perfumes for Every Occasion',
  description: 'Gym, office, coffee date, wedding — pick an occasion and get perfume recommendations with longevity and budget filters.',
};

export default function OccasionsPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#F01348]">Occasion picks</p>
      <h1 className="mt-1 font-display text-3xl font-bold tracking-tight sm:text-4xl">The right scent for the moment</h1>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-stone-500 dark:text-stone-400">
        Gym freshness and wedding opulence are different jobs. Pick your occasion, set your budget and how long
        it needs to last — we will rank scents by fit, with honest match scores.
      </p>
      <div className="mt-6">
        <PickFinder
          profiles={OCCASIONS}
          endpoint="/api/occasion-picks"
          storageKey="occasion"
          selectLabel="Pick an occasion"
          showLongevityFilter
        />
      </div>
    </div>
  );
}
