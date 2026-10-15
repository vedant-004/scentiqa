import type { Metadata } from 'next';
import { PickFinder } from '@/components/pick-finder';
import { WEATHER_TYPES } from '@/lib/weather-occasions';

export const metadata: Metadata = {
  title: 'Perfumes for Every Weather',
  description: 'Pick a weather type — hot & humid, monsoon, winter — and get perfume recommendations matched to Indian weather, with budget filters.',
};

export default function WeatherPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#F01348]">Weather match</p>
      <h1 className="mt-1 font-display text-3xl font-bold tracking-tight sm:text-4xl">Dress your scent for the weather</h1>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-stone-500 dark:text-stone-400">
        A heavy oud that shines in Delhi winter will choke in Mumbai humidity. Pick the weather you are stepping
        into — we will match scents whose accord profiles suit it, and show you what they cost in India.
      </p>
      <div className="mt-6">
        <PickFinder
          profiles={WEATHER_TYPES}
          endpoint="/api/weather-picks"
          storageKey="weather"
          selectLabel="Pick a weather type"
        />
      </div>
    </div>
  );
}
