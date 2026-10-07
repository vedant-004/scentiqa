import Link from 'next/link';
import { getSupabaseServer } from '@/lib/supabase';
import { SectionHeading } from '@/components/ui';
import { Breadcrumbs, PerfumeCard } from '@/components';

export const metadata = {
  title: 'Hidden Gems — Underrated Fragrances Worth Discovering',
  description: 'Highly rated by the few who have tried them — underrated fragrances from Indian houses that deserve more attention.',
};

export const revalidate = 3600;

interface Gem {
  slug: string; name: string; house: string; ratingAvg: number; ratingCount: number;
  lowestPriceInr: number | null; isDupe: boolean; bottleImage: string | null; gemNote: string;
}

export default async function HiddenGemsPage() {
  const sb = getSupabaseServer();
  let gems: Gem[] = [];

  if (sb) {
    // Truly hidden: high rating from a small number of raters (quality, undiscovered).
    // Gem score rewards high averages while requiring at least a couple of ratings
    // so a single 5-star vote can't dominate.
    const { data } = await sb.from('perfumes')
      .select('slug, name, rating_avg, rating_count, lowest_price_inr, description, bottle_image_url, houses(name)')
      .gte('rating_avg', 4)
      .gte('rating_count', 2)
      .lte('rating_count', 25)
      .order('rating_avg', { ascending: false })
      .limit(60);

    gems = ((data ?? []) as Array<{ slug: string; name: string; rating_avg: number | null; rating_count: number | null; lowest_price_inr: number | null; description: string | null; bottle_image_url: string | null; houses: { name: string } | Array<{ name: string }> | null }>)
      .map((r) => {
        const avg = r.rating_avg ?? 0;
        const count = r.rating_count ?? 0;
        const houseRel = r.houses;
        return {
          slug: r.slug, name: r.name,
          house: Array.isArray(houseRel) ? (houseRel[0]?.name ?? '') : (houseRel?.name ?? ''),
          ratingAvg: avg, ratingCount: count,
          lowestPriceInr: r.lowest_price_inr,
          isDupe: (r.description ?? '').startsWith('Dupe of'),
          bottleImage: r.bottle_image_url,
          gemNote: `${avg.toFixed(1)} stars from just ${count} ratings`,
          _score: avg * Math.log10(count + 1),
        };
      })
      .sort((a, b) => b._score - a._score)
      .slice(0, 12)
      .map(({ _score, ...g }) => g);
  }

  return (
    <div className="mx-auto max-w-7xl px-4 pt-6 sm:px-6">
      <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Hidden Gems' }]} />
      <SectionHeading kicker="Underrated" title="Hidden Gems" />
      <p className="mb-8 max-w-2xl text-[15px] text-stone-500 dark:text-stone-400">
        💎 Highly rated by the few who&rsquo;ve tried them — quality fragrances flying under the radar.
        Ranked from live community ratings: 4+ star averages with under 25 ratings each.
      </p>

      {gems.length === 0 ? (
        <p className="text-sm text-stone-500">No hidden gems yet — as community ratings grow, underrated standouts will appear here.</p>
      ) : (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {gems.map((g) => (
            <div key={g.slug} className="relative">
              <span className="absolute left-2.5 top-2.5 z-10 rounded-full bg-violet-600/90 px-2 py-0.5 text-[11px] font-bold text-white">
                💎 Gem
              </span>
              <PerfumeCard perfume={{
                slug: g.slug, name: g.name, house: g.house,
                ratingAvg: g.ratingAvg, lowestPriceInr: g.lowestPriceInr,
                isDupe: g.isDupe, bottleImage: g.bottleImage,
              }} />
              <p className="mt-1 px-1 text-[11px] text-stone-500 dark:text-stone-400">{g.gemNote}</p>
            </div>
          ))}
        </div>
      )}

      <div className="mt-10">
        <p className="text-center text-sm text-stone-500">
          <Link href="/houses" className="font-semibold text-gold-700 hover:underline dark:text-gold-300">Browse all houses →</Link>
        </p>
      </div>
    </div>
  );
}
