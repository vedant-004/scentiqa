import type { Metadata } from 'next';
import { PickFinder } from '@/components/pick-finder';
import { WEATHER_TYPES } from '@/lib/weather-occasions';
import { SITE_URL } from '@/lib/site-url';
import { JsonLd } from '@/components/seo';

export const metadata: Metadata = {
  title: 'Best Perfumes for Every Weather in India',
  description: 'Pick a weather type — hot & humid, monsoon, winter — and get perfume recommendations matched to Indian weather, with INR prices.',
  alternates: { canonical: `${SITE_URL}/weather` },
  openGraph: {
    title: 'Best Perfumes for Every Weather in India | Scentarchy',
    description: 'Get perfume recommendations matched to Indian weather conditions with INR prices.',
    url: `${SITE_URL}/weather`,
  },
};

const faqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    { '@type': 'Question', name: 'Which perfumes work best in Indian summer heat?', acceptedAnswer: { '@type': 'Answer', text: 'Light, fresh fragrances with citrus, aquatic and green notes perform best in Indian summer. Heavy ouds and sweet gourmands can feel overwhelming in heat and humidity. Scentarchy\'s weather matcher scores perfumes by accord profile for each weather type.' } },
    { '@type': 'Question', name: 'Do perfumes last longer in winter?', acceptedAnswer: { '@type': 'Answer', text: 'Yes, cooler temperatures slow evaporation so perfumes project longer in winter. This is the best season for rich ouds, ambers and warm spicy fragrances in India.' } },
    { '@type': 'Question', name: 'What should I wear in monsoon humidity?', acceptedAnswer: { '@type': 'Answer', text: 'Choose fresh aquatic, green or light citrus scents for monsoon. Avoid heavy sweet fragrances that can turn cloying in high humidity.' } },
  ],
};

export default function WeatherPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <JsonLd data={faqJsonLd} />
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
