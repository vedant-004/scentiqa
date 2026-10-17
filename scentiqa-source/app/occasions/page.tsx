import type { Metadata } from 'next';
import { PickFinder } from '@/components/pick-finder';
import { OCCASIONS } from '@/lib/weather-occasions';
import { SITE_URL } from '@/lib/site-url';
import { JsonLd } from '@/components/seo';

export const metadata: Metadata = {
  title: 'Best Perfumes for Every Occasion in India',
  description: 'Gym, office, wedding, date night — pick an occasion and get perfume recommendations with INR prices and longevity estimates.',
  alternates: { canonical: `${SITE_URL}/occasions` },
  openGraph: {
    title: 'Best Perfumes for Every Occasion in India | Scentarchy',
    description: 'Find the perfect perfume for gym, office, wedding or date night with INR prices.',
    url: `${SITE_URL}/occasions`,
  },
};

const FAQS = [
  { q: 'What is the best office perfume for India?', a: 'For Indian offices, choose subtle, non-intrusive fragrances — soft citrus, light florals or clean musks. Avoid heavy projection scents in shared workspaces.' },
  { q: 'Which perfume is best for weddings in India?', a: 'Indian weddings call for rich, long-lasting fragrances — ouds, ambers and warm orientals that project through long ceremonies and outdoor venues.' },
  { q: 'Can I wear the same perfume to gym and office?', a: 'Gym scents should be fresh and light since body heat amplifies fragrance. Office scents should be subtle. One versatile fresh fragrance can work for both if applied lightly.' },
];

const faqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: FAQS.map((f) => (
    { '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } }
  )),
};

export default function OccasionsPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <JsonLd data={faqJsonLd} />
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
      {/* Visible FAQ: FAQPage JSON-LD requires the questions to be user-visible */}
      <section className="mt-12">
        <h2 className="font-display text-2xl font-bold">Frequently asked questions</h2>
        <div className="mt-4 space-y-3">
          {FAQS.map((f) => (
            <details key={f.q} className="group rounded-2xl border border-stone-200/70 bg-white p-5 dark:border-white/10 dark:bg-white/[0.03]">
              <summary className="cursor-pointer text-sm font-bold marker:text-gold-600">{f.q}</summary>
              <p className="mt-2 text-sm leading-relaxed text-stone-500 dark:text-stone-400">{f.a}</p>
            </details>
          ))}
        </div>
      </section>
    </div>
  );
}
