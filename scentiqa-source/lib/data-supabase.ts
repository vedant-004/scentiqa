// Supabase-mode data layer: same function signatures as lib/data-demo.ts.
// Used only when NEXT_PUBLIC_SUPABASE_URL is set. Requires supabase/schema.sql applied.
import { getSupabaseServer } from './supabase';
import type {
  Article, Award, AwardCategory, AwardNominee, ClimateScore, DupeEntry, ForumCategory, ForumTopic,
  Giveaway, House, NoteInfo, Perfume, PerfumeFull, PriceDrop,
  PriceEntry, Review, Seller,
} from './types';
import type { HouseFull } from './data-demo';

const sb = () => getSupabaseServer();

function normalizeAccords(raw: unknown): Perfume['accords'] {
  if (!Array.isArray(raw)) return [];
  return raw.map((a) => {
    // Plain name: prominence order preserved, no invented strength.
    if (typeof a === 'string') return { name: a, strength: null };
    if (a && typeof a === 'object') {
      const r = a as Record<string, unknown>;
      if (typeof r.name !== 'string' || !r.name.trim()) return null;
      const s = r.strength;
      // Keep only source-published numeric strengths (legacy catalog rows);
      // never invent: no rank-derived defaults, no 50 fallback.
      return { name: r.name, strength: typeof s === 'number' && Number.isFinite(s) ? s : null };
    }
    return null;
  }).filter((a): a is { name: string; strength: number | null } => a !== null);
}

function mapPerfume(r: Record<string, unknown>): Perfume {
  return {
    id: r.id as string, slug: r.slug as string, name: r.name as string,
    houseSlug: (r.houses as Record<string, string> | undefined)?.slug ?? '',
    house: (r.houses as Record<string, string> | undefined)?.name ?? '',
    gender: r.gender as Perfume['gender'], launchYear: r.launch_year as number,
    concentration: r.concentration as string, description: (r.description as string) ?? '',
    bottleImage: (r.bottle_image_url as string) ?? null,
    ratingAvg: Number(r.rating_avg ?? 0), ratingCount: Number(r.rating_count ?? 0),
    lowestPriceInr: (r.lowest_price_inr as number) ?? null,
    accords: normalizeAccords(r.accords),
    topNotes: (r.top_notes as string[]) ?? [], heartNotes: (r.heart_notes as string[]) ?? [],
    baseNotes: (r.base_notes as string[]) ?? [],
    scentStory: (r.scent_story as string) ?? null,
    beginnerFriendly: typeof r.beginner_friendly === 'boolean' ? r.beginner_friendly : null,
    inspiredBy: null, claimedAccuracy: null, isDupe: false,
    // Every row in the live database is catalog data, never synthetic demo content.
    real: true,
    observedAt: typeof r.created_at === 'string' ? r.created_at.slice(0, 10) : null,
  };
}

function mapDupe(r: Record<string, unknown>): DupeEntry {
  const dupe = mapPerfume(r.dupe as Record<string, unknown>);
  const dupeHouseR = (r.dupe as Record<string, unknown>).houses as Record<string, unknown>;
  return {
    id: r.id as string, originalSlug: '', dupeSlug: dupe.slug,
    similarityScore: (r.similarity_score as number) ?? null,
    testedBy: r.tested_by as DupeEntry['testedBy'],
    openingMatch: (r.opening_match as number) ?? null,
    drydownMatch: (r.drydown_match as number) ?? null,
    longevityMatch: (r.longevity_match as number) ?? null,
    sillageMatch: (r.sillage_match as number) ?? null,
    claimedAccuracy: (r.claimed_accuracy_text as string) ?? null,
    verdict: (r.verdict_text as string) ?? '',
    testDate: r.test_date as string, testerCount: Number(r.tester_count ?? 0),
    dupe, dupeHouse: mapHouse(dupeHouseR), lowestPrice: null,
  };
}

function mapHouse(r: Record<string, unknown>): House {
  return {
    id: r.id as string, slug: r.slug as string, name: r.name as string,
    country: (r.country as string) ?? '', region: (r.region as string) ?? null,
    mainActivity: (r.main_activity as string) ?? '', website: (r.website_url as string) ?? null,
    type: r.house_type as House['type'], description: (r.description as string) ?? '',
    perfumeCount: Number(r.perfume_count ?? 0), earliestYear: Number(r.earliest_year ?? 0),
    latestYear: Number(r.latest_year ?? 0),
    avgSimilarity: (r.avg_similarity_score as number) ?? null,
    trustRating: Number(r.trust_rating ?? 3), foundedYear: Number(r.founded_year ?? 0),
  };
}

export async function getPerfume(slug: string): Promise<PerfumeFull | null> {
  const c = sb(); if (!c) return null;
  const { data: p } = await c.from('perfumes').select('*, houses(slug, name)').eq('slug', slug).single();
  if (!p) return null;
  const perfume = mapPerfume(p);
  const houseInfo = mapHouse((await c.from('houses').select('*').eq('id', p.house_id).single()).data ?? {});
  const { data: rels } = await c.from('dupe_relationships')
    .select('*, dupe:dupe_perfume_id(*, houses(slug, name))')
    .eq('original_perfume_id', p.id);
  const dupes = (rels ?? []).map(mapDupe).sort((a, b) => (b.similarityScore ?? -1) - (a.similarityScore ?? -1));
  const { data: pricesR } = await c.from('prices').select('*, sellers(*)').eq('perfume_id', p.id);
  const prices: PriceEntry[] = (pricesR ?? []).filter((pr: Record<string, unknown>) => pr.sellers).map((pr: Record<string, unknown>) => ({
    id: pr.id as string, perfumeSlug: slug, sellerSlug: (pr.sellers as Record<string, string>).slug,
    priceInr: (pr.price_inr as number) ?? null, mrpInr: (pr.mrp_inr as number) ?? null,
    sizeMl: (pr.size_ml as number) ?? null, inStock: pr.in_stock as boolean, url: (pr.product_url as string) ?? null,
    provenance: (pr.price_provenance as PriceEntry['provenance']) ?? 'demo',
    checkedAt: (pr.checked_at as string) ?? '2026-09-30',
    seller: {
      id: (pr.sellers as Record<string, string>).id, slug: (pr.sellers as Record<string, string>).slug,
      name: (pr.sellers as Record<string, string>).name,
      website: ((pr.sellers as Record<string, string>).website_url as string) ?? null,
      type: ((pr.sellers as Record<string, string>).seller_type as Seller['type']) ?? 'marketplace',
      verified: !!((pr.sellers as Record<string, unknown>).verified),
    },
  })).sort((a, b) => (a.priceInr ?? Number.MAX_SAFE_INTEGER) - (b.priceInr ?? Number.MAX_SAFE_INTEGER));
  const { data: clim } = await c.from('climate_scores').select('*').eq('perfume_id', p.id).single();
  const climate: ClimateScore | null = clim ? {
    id: clim.id, perfumeSlug: slug, heatLongevity: clim.heat_longevity,
    humiditySillage: clim.humidity_sillage, summerRating: clim.summer_rating,
    monsoonRating: clim.monsoon_rating, winterRating: clim.winter_rating,
    testTempC: clim.test_temp_c, testHumidityPct: clim.test_humidity_pct,
    sprays: clim.sprays_used, testerCount: clim.tester_count, notes: clim.notes ?? '',
  } : null;
  const { data: revs } = await c.from('reviews').select('*, users(username)').eq('perfume_id', p.id).order('helpful_votes', { ascending: false }).limit(20);
  const reviews: Review[] = (revs ?? []).map((r: Record<string, unknown>) => ({
    id: r.id as string, perfumeSlug: slug, username: (r.users as Record<string, string>)?.username ?? 'member',
    rating: r.rating as number, title: (r.title as string) ?? '', body: (r.body as string) ?? '',
    verifiedPurchase: !!r.verified_purchase, helpfulVotes: Number(r.helpful_votes ?? 0),
    createdAt: r.created_at as string,
  }));
  return { ...perfume, houseInfo, climate, dupes, originalOf: [], prices, reviews, similar: [] };
}

export async function getAllPerfumeSlugs(): Promise<string[]> {
  const c = sb(); if (!c) return [];
  const { data } = await c.from('perfumes').select('slug');
  return (data ?? []).map((r: { slug: string }) => r.slug);
}
export async function getAllHouseSlugs(): Promise<string[]> {
  const c = sb(); if (!c) return [];
  const { data } = await c.from('houses').select('slug');
  return (data ?? []).map((r: { slug: string }) => r.slug);
}
/** All houses, alphabetically, for the /houses directory. */
export async function getAllHouses(): Promise<House[]> {
  const c = sb(); if (!c) return [];
  const { data } = await c.from('houses').select('*').order('name', { ascending: true });
  return (data ?? []).map((r) => mapHouse(r as Record<string, unknown>));
}
export async function getAllArticleSlugs(): Promise<string[]> {
  const c = sb(); if (!c) return [];
  const { data } = await c.from('articles').select('slug').eq('is_published', true);
  return (data ?? []).map((r: { slug: string }) => r.slug);
}

export async function getHouse(slug: string): Promise<HouseFull | null> {
  const c = sb(); if (!c) return null;
  const { data: h } = await c.from('houses').select('*').eq('slug', slug).single();
  if (!h) return null;
  const { data: ps } = await c.from('perfumes').select('*, houses(slug, name)').eq('house_id', h.id).order('rating_count', { ascending: false });
  return { ...mapHouse(h), perfumes: (ps ?? []).map(mapPerfume) };
}

export async function searchPerfumes(query: string, limit = 8): Promise<Perfume[]> {
  const c = sb(); if (!c) return [];
  const { data } = await c.from('perfumes').select('*, houses(slug, name)').ilike('name', `%${query}%`).limit(limit);
  return (data ?? []).map(mapPerfume);
}

export async function getDupesForPerfume(originalSlug: string): Promise<DupeEntry[]> {
  const full = await getPerfume(originalSlug);
  return full?.dupes ?? [];
}

export async function getTrending(): Promise<Perfume[]> {
  const c = sb(); if (!c) return [];
  const { data } = await c.from('perfumes').select('*, houses(slug, name)').order('view_count', { ascending: false }).limit(12);
  return (data ?? []).map(mapPerfume);
}
export async function getLatestLaunches(): Promise<Perfume[]> {
  const c = sb(); if (!c) return [];
  const { data } = await c.from('perfumes').select('*, houses(slug, name)').order('launch_year', { ascending: false }).limit(8);
  return (data ?? []).map(mapPerfume);
}
export async function getPriceDrops(): Promise<Array<PriceDrop & { perfume: Perfume; seller: Seller | undefined }>> { return []; }
export async function getDupeOfWeek(): Promise<{ original: Perfume; dupe: DupeEntry } | null> { return null; }

/** Deterministic "perfume of the day": rotates daily through perfumes that have a photo, accords, notes and a description. */
export async function getPerfumeOfTheDay(): Promise<Perfume | null> {
  const c = sb(); if (!c) return null;
  // Admin override first: if potd_override.perfume_slug is set, feature that perfume.
  const override = await getSiteSetting('potd_override');
  const slug = typeof override?.perfume_slug === 'string' ? override.perfume_slug : '';
  if (slug) {
    const { data } = await c.from('perfumes').select('*, houses(slug, name)').eq('slug', slug).maybeSingle();
    if (data) return mapPerfume(data as Record<string, unknown>);
    // Fall through to auto-rotation if the slug no longer exists.
  }
  // Candidate pool: rows with a photo and description. Accords/notes completeness
  // is verified in code because empty arrays can't be filtered reliably in PostgREST.
  // Paginated to cover the full 8k+ catalog (Supabase caps at 1000 rows/request).
  const PAGE = 1000;
  const rows: Record<string, unknown>[] = [];
  for (let from = 0; ; from += PAGE) {
    const { data: page } = await c.from('perfumes')
      .select('slug, accords, top_notes, heart_notes, base_notes')
      .not('bottle_image_url', 'is', null)
      .not('description', 'is', null)
      .neq('description', '')
      .order('slug', { ascending: true })
      .range(from, from + PAGE - 1);
    if (!page || page.length === 0) break;
    rows.push(...(page as Record<string, unknown>[]));
    if (page.length < PAGE) break;
  }
  const pool = rows.filter((r: Record<string, unknown>) => {
    const accords = (r.accords as unknown[]) ?? [];
    const notes = [
      ...((r.top_notes as string[]) ?? []),
      ...((r.heart_notes as string[]) ?? []),
      ...((r.base_notes as string[]) ?? []),
    ];
    return accords.length > 0 && notes.length > 0;
  });
  if (!pool.length) return null;
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const dayOfYear = Math.floor((now.getTime() - start.getTime()) / 86400000);
  const pick = pool[dayOfYear % pool.length] as { slug: string };
  const { data: full } = await c.from('perfumes').select('*, houses(slug, name)').eq('slug', pick.slug).single();
  return full ? mapPerfume(full as Record<string, unknown>) : null;
}

/** Raw site_settings row value (jsonb) or null when unset / table missing. */
export async function getSiteSetting(key: string): Promise<Record<string, unknown> | null> {
  const c = sb(); if (!c) return null;
  try {
    const { data } = await c.from('site_settings').select('value').eq('key', key).maybeSingle();
    const v = (data as { value?: unknown } | null)?.value;
    return v && typeof v === 'object' ? (v as Record<string, unknown>) : null;
  } catch {
    return null; // table not migrated yet — behave as unset
  }
}

export async function getHeroContent(): Promise<{ headline: string; subheadline: string }> {
  const s = await getSiteSetting('hero');
  return {
    headline: typeof s?.headline === 'string' ? s.headline : '',
    subheadline: typeof s?.subheadline === 'string' ? s.subheadline : '',
  };
}

export async function getBanner(): Promise<{ text: string; link: string; enabled: boolean }> {
  const s = await getSiteSetting('banner');
  return {
    text: typeof s?.text === 'string' ? s.text : '',
    link: typeof s?.link === 'string' ? s.link : '',
    enabled: s?.enabled === true,
  };
}

export async function getLatestReviews(limit = 6): Promise<Array<Review & { perfume: Perfume }>> {
  const c = sb(); if (!c) return [];
  const { data } = await c.from('reviews').select('*, users(username), perfumes(*, houses(slug, name))').order('created_at', { ascending: false }).limit(limit);
  return (data ?? []).map((r: Record<string, unknown>) => ({
    id: r.id as string, perfumeSlug: (r.perfumes as Record<string, string>).slug,
    username: (r.users as Record<string, string>)?.username ?? 'member',
    rating: r.rating as number, title: (r.title as string) ?? '', body: (r.body as string) ?? '',
    verifiedPurchase: !!r.verified_purchase, helpfulVotes: Number(r.helpful_votes ?? 0),
    createdAt: r.created_at as string, perfume: mapPerfume(r.perfumes as Record<string, unknown>),
  }));
}

export async function getArticles(limit?: number): Promise<Article[]> {
  const c = sb(); if (!c) return [];
  let q = c.from('articles').select('*').eq('is_published', true).order('published_at', { ascending: false });
  if (limit) q = q.limit(limit);
  const { data } = await q;
  return (data ?? []).map((a: Record<string, unknown>) => ({
    id: a.id as string, slug: a.slug as string, title: a.title as string,
    category: a.category as string, excerpt: (a.excerpt as string) ?? '',
    body: (a.body as string) ?? '', author: (a.author_name as string) ?? 'Scentiqa',
    date: a.published_at ? new Date(a.published_at as string).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '',
  }));
}
export async function getArticle(slug: string): Promise<Article | null> {
  const list = await getArticles();
  return list.find((a) => a.slug === slug) ?? null;
}

export async function getForumCategories(): Promise<ForumCategory[]> {
  const c = sb(); if (!c) return [];
  const { data: cats } = await c.from('forum_categories').select('*').order('sort_order');
  const out: ForumCategory[] = [];
  for (const cat of cats ?? []) {
    const { data: topics } = await c.from('forum_topics').select('*, users(username)').eq('category_id', cat.id).order('last_post_at', { ascending: false }).limit(10);
    out.push({
      id: cat.id, slug: cat.slug, name: cat.name, description: cat.description ?? '',
      topics: (topics ?? []).map((t: Record<string, unknown>) => ({
        id: t.id as string, title: t.title as string,
        author: (t.users as Record<string, string>)?.username ?? 'member', posts: [],
      })),
    });
  }
  return out;
}
export async function getForumCategory(slug: string): Promise<ForumCategory | null> {
  const cats = await getForumCategories();
  return cats.find((c) => c.slug === slug) ?? null;
}
export async function getForumTopic(id: string): Promise<{ topic: ForumTopic; category: ForumCategory } | null> {
  const c = sb(); if (!c) return null;
  const { data: t } = await c.from('forum_topics').select('*, users(username), forum_categories(*)').eq('id', id).single();
  if (!t) return null;
  const { data: posts } = await c.from('forum_posts').select('*, users(username)').eq('topic_id', id).order('created_at');
  const category = t.forum_categories as Record<string, string>;
  return {
    topic: {
      id: t.id as string, title: t.title as string,
      author: (t.users as Record<string, string>)?.username ?? 'member',
      posts: (posts ?? []).map((p: Record<string, unknown>) => ({
        id: p.id as string, username: (p.users as Record<string, string>)?.username ?? 'member',
        body: p.body as string,
      })),
    },
    category: { id: category.id, slug: category.slug, name: category.name, description: '', topics: [] },
  };
}

export async function getAwardYears(): Promise<number[]> {
  const c = sb(); if (!c) return [];
  const { data } = await c.from('award_categories').select('year').order('year', { ascending: false });
  const years = [...new Set((data ?? []).map((r) => (r as Record<string, unknown>).year as number))];
  return years;
}

export async function getAwards(year: number): Promise<AwardCategory[]> {
  const c = sb(); if (!c) return [];
  const { data: cats } = await c.from('award_categories')
    .select('*').eq('year', year).order('sort_order', { ascending: true });
  const { data: rows } = await c.from('awards')
    .select('id, category_slug, nominee_kind, nominee_perfume_id, nominee_house_id, vote_count, is_winner')
    .eq('year', year);
  // Resolve nominee display data in bulk
  const perfIds = [...new Set((rows ?? []).filter((r) => (r as Record<string, unknown>).nominee_kind === 'perfume').map((r) => (r as Record<string, unknown>).nominee_perfume_id as string).filter(Boolean))];
  const houseIds = [...new Set((rows ?? []).filter((r) => (r as Record<string, unknown>).nominee_kind === 'house').map((r) => (r as Record<string, unknown>).nominee_house_id as string).filter(Boolean))];
  const perfMap = new Map<string, { slug: string; name: string; house: string; image: string | null }>();
  const houseMap = new Map<string, { slug: string; name: string }>();
  if (perfIds.length > 0) {
    const { data: perfs } = await c.from('perfumes').select('id, slug, name, bottle_image_url, houses(slug, name)').in('id', perfIds);
    for (const p of perfs ?? []) {
      const r = p as Record<string, unknown>;
      const h = r.houses as Record<string, string> | undefined;
      perfMap.set(r.id as string, { slug: r.slug as string, name: r.name as string, house: h?.name ?? '', image: (r.bottle_image_url as string) ?? null });
    }
  }
  if (houseIds.length > 0) {
    const { data: houses } = await c.from('houses').select('id, slug, name').in('id', houseIds);
    for (const h of houses ?? []) {
      const r = h as Record<string, unknown>;
      houseMap.set(r.id as string, { slug: r.slug as string, name: r.name as string });
    }
  }
  const byCat = new Map<string, AwardNominee[]>();
  for (const r of rows ?? []) {
    const rec = r as Record<string, unknown>;
    const kind = rec.nominee_kind as 'house' | 'perfume';
    const refId = (kind === 'house' ? rec.nominee_house_id : rec.nominee_perfume_id) as string;
    const info = kind === 'house' ? houseMap.get(refId) : perfMap.get(refId);
    if (!info) continue;
    const key = (rec.category_slug as string) ?? '';
    if (!byCat.has(key)) byCat.set(key, []);
    byCat.get(key)!.push({
      rowId: Number(rec.id), kind,
      slug: info.slug, name: info.name,
      houseName: (info as { house?: string }).house ?? '',
      image: (info as { image?: string | null }).image ?? null,
      votes: Number(rec.vote_count ?? 0), isWinner: !!rec.is_winner,
    });
  }
  return (cats ?? []).map((cr) => {
    const rec = cr as Record<string, unknown>;
    const slug = rec.slug as string;
    const nominees = (byCat.get(slug) ?? []).sort((a, b) => Number(b.isWinner) - Number(a.isWinner) || b.votes - a.votes);
    return {
      id: Number(rec.id), year, slug,
      name: rec.name as string, description: (rec.description as string) ?? '',
      icon: (rec.icon as string) ?? '🏆',
      section: (rec.section as 'global' | 'indian') ?? 'global',
      nomineeType: (rec.nominee_type as 'house' | 'perfume') ?? 'perfume',
      sortOrder: Number(rec.sort_order ?? 0),
      nominees,
      winner: nominees.find((n) => n.isWinner) ?? null,
    };
  });
}
export async function getGiveaways(): Promise<Giveaway[]> {
  const c = sb(); if (!c) return [];
  const { data } = await c.from('giveaways').select('*').order('ends_at', { ascending: false });
  return (data ?? []).map((g: Record<string, unknown>) => ({
    id: g.id as string, slug: g.slug as string, title: g.title as string,
    desc: (g.description as string) ?? '', prize: (g.prize as string) ?? '',
    perfumeSlug: ((g.perfume_id as string) ?? '').replace(/^perf_/, ''),
    starts: g.starts_at as string, ends: g.ends_at as string,
    winner: null, active: !!g.is_active, entries: Number(g.entry_count ?? 0),
  }));
}

export async function getMember(): Promise<null> { return null; }
export async function getReviewsByMember(): Promise<Array<Review & { perfume: Perfume }>> { return []; }
export async function getNotes(): Promise<NoteInfo[]> {
  const c = sb(); if (!c) return [];
  const { data } = await c.from('notes').select('*').order('name');
  return (data ?? []).map((n: Record<string, unknown>) => ({
    id: n.id as string, slug: n.slug as string, name: n.name as string,
    category: n.category as string, odorProfile: (n.odor_profile as string) ?? '',
  }));
}
export async function getSimilarPerfumes(): Promise<Perfume[]> { return []; }
export async function findByNotes(): Promise<Perfume[]> { return []; }
export async function findByAccords(): Promise<Array<Perfume & { matchScore: number }>> { return []; }
export async function finderRecommendations(): Promise<Array<Perfume & { reason: string }>> { return []; }
export async function getStats(): Promise<{ perfumes: number; houses: number; reviews: number; dupesTested: number; members: number }> {
  const c = sb();
  if (!c) return { perfumes: 0, houses: 0, reviews: 0, dupesTested: 0, members: 0 };
  const [p, h, r] = await Promise.all([
    c.from('perfumes').select('id', { count: 'exact', head: true }),
    c.from('houses').select('id', { count: 'exact', head: true }),
    c.from('reviews').select('id', { count: 'exact', head: true }),
  ]);
  return { perfumes: p.count ?? 0, houses: h.count ?? 0, reviews: r.count ?? 0, dupesTested: 0, members: 0 };
}
export async function getPerfumesBySlugs(slugs: string[]): Promise<Perfume[]> {
  const c = sb(); if (!c) return [];
  const { data } = await c.from('perfumes').select('*, houses(slug, name)').in('slug', slugs);
  return (data ?? []).map(mapPerfume);
}
