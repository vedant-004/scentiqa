import type { MetadataRoute } from 'next';
import { getAllPerfumeSlugs, getAllHouseSlugs, getAllArticleSlugs, getAwardYears, getAwards } from '@/lib/data';
import { SITE_URL } from '@/lib/site-url';

const BASE = SITE_URL;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [perfumes, houses, articles, years] = await Promise.all([
    getAllPerfumeSlugs(), getAllHouseSlugs(), getAllArticleSlugs(), getAwardYears(),
  ]);
  const staticRoutes = [
    '', '/find-alternative', '/compare', '/finder', '/notes', '/accords', '/search/notes', '/search/accords',
    '/forum', '/news', '/giveaways', '/awards',
    '/best-perfumes', '/dupes', '/vs',
    '/methodology', '/climate-protocol', '/trust-charter', '/fake-guide',
    '/about', '/contact', '/terms', '/privacy',
  ];
  const { getNoteMetas } = await import('@/lib/notes-data');
  const noteSlugs = (await getNoteMetas()).map((m) => m.slug);
  // Programmatic SEO landing pages (see lib/seo.ts, lib/vs-comparisons.ts).
  let dupeUrls: string[] = [];
  let vsUrls: string[] = [];
  try {
    const { getDupeGuideOriginals } = await import('@/lib/seo');
    dupeUrls = (await getDupeGuideOriginals()).map((g) => `/dupes/${g.slug}`);
  } catch { /* dupe guides unavailable at build time */ }
  try {
    const { VS_COMPARISONS, vsParam } = await import('@/lib/vs-comparisons');
    vsUrls = VS_COMPARISONS.map((p) => `/vs/${vsParam(p)}`);
  } catch { /* vs list unavailable at build time */ }
  // Awards year + category pages (slugs come from the DB, same source as generateStaticParams).
  const awardEntries: MetadataRoute.Sitemap = [];
  for (const year of years) {
    awardEntries.push({ url: `${BASE}/awards/${year}`, changeFrequency: 'weekly' as const, priority: 0.7 });
    const cats = await getAwards(year);
    for (const c of cats) {
      awardEntries.push({ url: `${BASE}/awards/${year}/${c.slug}`, changeFrequency: 'weekly' as const, priority: 0.7 });
    }
  }
  return [
    ...staticRoutes.map((r) => ({ url: `${BASE}${r || '/'}`, changeFrequency: 'weekly' as const, priority: r === '' ? 1 : 0.7 })),
    ...awardEntries,
    ...dupeUrls.map((u) => ({ url: `${BASE}${u}`, changeFrequency: 'weekly' as const, priority: 0.8 })),
    ...vsUrls.map((u) => ({ url: `${BASE}${u}`, changeFrequency: 'weekly' as const, priority: 0.8 })),
    ...noteSlugs.map((s) => ({ url: `${BASE}/notes/${s}`, changeFrequency: 'monthly' as const, priority: 0.6 })),
    ...perfumes.map((s) => ({ url: `${BASE}/perfume/${s}`, changeFrequency: 'weekly' as const, priority: 0.9 })),
    ...houses.map((s) => ({ url: `${BASE}/house/${s}`, changeFrequency: 'monthly' as const, priority: 0.8 })),
    ...articles.map((s) => ({ url: `${BASE}/news/${s}`, changeFrequency: 'monthly' as const, priority: 0.6 })),
  ];
}
