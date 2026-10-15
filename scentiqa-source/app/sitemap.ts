import type { MetadataRoute } from 'next';
import { getAllPerfumeSlugs, getAllHouseSlugs, getAllArticleSlugs, getAwardYears, getAwards } from '@/lib/data';
import { SITE_URL } from '@/lib/site-url';

const BASE = SITE_URL;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [perfumes, houses, articles, years] = await Promise.all([
    getAllPerfumeSlugs(), getAllHouseSlugs(), getAllArticleSlugs(), getAwardYears(),
  ]);
  const staticRoutes = [
    '', '/find-alternative', '/compare', '/finder', '/quiz', '/notes', '/accords', '/search/notes', '/search/accords',
    '/forum', '/news', '/blog', '/giveaways', '/awards', '/requests', '/sniff',
    '/best-perfumes', '/dupes', '/vs', '/perfumes',
    '/weather', '/occasions', '/battles', '/climate', '/blindbuy',
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
  const now = new Date();
  // Blog posts
  const { getAllBlogPosts } = await import('@/lib/blog');
  const blogPosts = getAllBlogPosts();
  const blogEntries: MetadataRoute.Sitemap = blogPosts.map((p) => ({
    url: `${BASE}/blog/${p.slug}`,
    lastModified: p.date ? new Date(p.date) : now,
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  }));
  const awardEntries: MetadataRoute.Sitemap = [];
  for (const year of years) {
    awardEntries.push({ url: `${BASE}/awards/${year}`, lastModified: now, changeFrequency: 'weekly' as const, priority: 0.7 });
    const cats = await getAwards(year);
    for (const c of cats) {
      awardEntries.push({ url: `${BASE}/awards/${year}/${c.slug}`, lastModified: now, changeFrequency: 'weekly' as const, priority: 0.7 });
    }
  }
  // Discovery hubs get higher priority than individual product pages.
  const hubRoutes = new Set(['', '/finder', '/quiz', '/weather', '/occasions', '/battles', '/climate', '/blindbuy', '/perfumes', '/dupes', '/vs', '/best-perfumes']);
  // Filter out corrupt slugs (data import artifacts like time values).
  const cleanPerfumes = perfumes.filter((s) => !/^\d{1,2}:\d{2}(:\d{2})?$/.test(s));
  return [
    ...staticRoutes.map((r) => ({
      url: `${BASE}${r || '/'}`,
      lastModified: now,
      changeFrequency: 'weekly' as const,
      priority: r === '' ? 1 : hubRoutes.has(r) ? 0.8 : 0.5,
    })),
    ...awardEntries,
    ...blogEntries,
    ...dupeUrls.map((u) => ({ url: `${BASE}${u}`, lastModified: now, changeFrequency: 'weekly' as const, priority: 0.8 })),
    ...vsUrls.map((u) => ({ url: `${BASE}${u}`, lastModified: now, changeFrequency: 'weekly' as const, priority: 0.8 })),
    ...noteSlugs.map((s) => ({ url: `${BASE}/notes/${s}`, lastModified: now, changeFrequency: 'monthly' as const, priority: 0.5 })),
    ...cleanPerfumes.map((s) => ({ url: `${BASE}/perfume/${s}`, lastModified: now, changeFrequency: 'weekly' as const, priority: 0.6 })),
    ...houses.map((s) => ({ url: `${BASE}/house/${s}`, lastModified: now, changeFrequency: 'monthly' as const, priority: 0.7 })),
    ...articles.map((s) => ({ url: `${BASE}/news/${s}`, lastModified: now, changeFrequency: 'monthly' as const, priority: 0.6 })),
  ];
}
