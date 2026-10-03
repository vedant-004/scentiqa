import type { MetadataRoute } from 'next';
import { getAllPerfumeSlugs, getAllHouseSlugs, getAllArticleSlugs } from '@/lib/data';

const BASE = 'https://scentiqa.in';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [perfumes, houses, articles] = await Promise.all([
    getAllPerfumeSlugs(), getAllHouseSlugs(), getAllArticleSlugs(),
  ]);
  const staticRoutes = [
    '', '/find-alternative', '/compare', '/finder', '/search/notes', '/search/accords',
    '/forum', '/news', '/giveaways', '/awards/2026',
    '/methodology', '/climate-protocol', '/trust-charter', '/fake-guide',
    '/about', '/contact', '/terms', '/privacy',
  ];
  return [
    ...staticRoutes.map((r) => ({ url: `${BASE}${r || '/'}`, changeFrequency: 'weekly' as const, priority: r === '' ? 1 : 0.7 })),
    ...perfumes.map((s) => ({ url: `${BASE}/perfume/${s}`, changeFrequency: 'weekly' as const, priority: 0.9 })),
    ...houses.map((s) => ({ url: `${BASE}/house/${s}`, changeFrequency: 'monthly' as const, priority: 0.8 })),
    ...articles.map((s) => ({ url: `${BASE}/news/${s}`, changeFrequency: 'monthly' as const, priority: 0.6 })),
  ];
}
