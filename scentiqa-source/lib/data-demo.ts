// Demo-mode data layer: everything reads from data/seed.json (no network, no auth).
import seedJson from '@/data/seed.json';
import type {
  Article, Award, AwardCategory, ClimateScore, DupeEntry, ForumCategory, ForumTopic,
  Giveaway, House, Member, NoteInfo, Perfume, PerfumeFull, PriceDrop,
  PriceEntry, Review, Seller,
} from './types';

interface SeedData {
  houses: House[]; notes: NoteInfo[]; perfumes: Perfume[];
  dupeRelationships: Array<{
    id: string; originalSlug: string; dupeSlug: string; similarityScore: number | null;
    testedBy: 'lab' | 'community'; openingMatch: number | null; drydownMatch: number | null;
    longevityMatch: number | null; sillageMatch: number | null; claimedAccuracy: string | null;
    verdict: string; testDate: string; testerCount: number;
  }>;
  climateScores: ClimateScore[];
  sellers: Seller[]; prices: PriceEntry[]; priceDrops: PriceDrop[];
  users: Member[]; reviews: Review[]; articles: Article[];
  forum: ForumCategory[]; awards: Award[]; giveaways: Giveaway[];
  trending: string[]; latest: string[]; dupeOfWeek: { originalSlug: string; dupeSlug: string };
}

const seed = seedJson as unknown as SeedData;

const perfBySlug = new Map(seed.perfumes.map((p) => [p.slug, p]));
const houseBySlug = new Map(seed.houses.map((h) => [h.slug, h]));
const sellerBySlug = new Map(seed.sellers.map((s) => [s.slug, s]));
const climateBySlug = new Map(seed.climateScores.map((c) => [c.perfumeSlug, c]));

function withSeller(pr: PriceEntry): PriceEntry {
  return { ...pr, seller: sellerBySlug.get(pr.sellerSlug) };
}

function toDupeEntry(r: SeedData['dupeRelationships'][number]): DupeEntry | null {
  const dupe = perfBySlug.get(r.dupeSlug);
  if (!dupe) return null;
  const dupeHouse = houseBySlug.get(dupe.houseSlug);
  if (!dupeHouse) return null;
  const prices = seed.prices.filter((p) => p.perfumeSlug === dupe.slug).map(withSeller);
  const lowest = prices.length ? prices.reduce((a, b) => ((a.priceInr ?? Infinity) <= (b.priceInr ?? Infinity) ? a : b)) : null;
  return { ...r, dupe, dupeHouse, lowestPrice: lowest };
}

function sharedScore(a: Perfume, b: Perfume): number {
  let s = 0;
  for (const ac of a.accords) {
    const m = b.accords.find((x) => x.name.toLowerCase() === ac.name.toLowerCase());
    if (m) s += ((ac.strength ?? 0) * (m.strength ?? 0)) / 100;
  }
  const notesA = new Set([...a.topNotes, ...a.heartNotes, ...a.baseNotes].map((n) => n.toLowerCase()));
  const notesB = new Set([...b.topNotes, ...b.heartNotes, ...b.baseNotes].map((n) => n.toLowerCase()));
  for (const n of notesA) if (notesB.has(n)) s += 6;
  if (a.houseSlug === b.houseSlug) s += 12;
  return s;
}

export async function getPerfume(slug: string): Promise<PerfumeFull | null> {
  const p = perfBySlug.get(slug);
  if (!p) return null;
  const houseInfo = houseBySlug.get(p.houseSlug)!;
  const dupes = seed.dupeRelationships
    .filter((r) => r.originalSlug === slug)
    .map(toDupeEntry)
    .filter((d): d is DupeEntry => !!d)
    .sort((a, b) => (b.similarityScore ?? -1) - (a.similarityScore ?? -1));
  const originalOf = seed.dupeRelationships
    .filter((r) => r.dupeSlug === slug)
    .map(toDupeEntry)
    .filter((d): d is DupeEntry => !!d);
  const prices = seed.prices.filter((pr) => pr.perfumeSlug === slug).map(withSeller)
    .sort((a, b) => (a.priceInr ?? Number.MAX_SAFE_INTEGER) - (b.priceInr ?? Number.MAX_SAFE_INTEGER));
  const reviews = seed.reviews.filter((r) => r.perfumeSlug === slug)
    .sort((a, b) => b.helpfulVotes - a.helpfulVotes);
  const similar = seed.perfumes
    .filter((x) => x.slug !== slug)
    .map((x) => ({ p: x, s: sharedScore(p, x) }))
    .sort((a, b) => b.s - a.s)
    .slice(0, 8)
    .map((x) => x.p);
  return {
    ...p, houseInfo,
    climate: climateBySlug.get(slug) ?? null,
    dupes, originalOf, prices, reviews, similar,
  };
}

export async function getAllPerfumeSlugs(): Promise<string[]> {
  return seed.perfumes.map((p) => p.slug);
}
export async function getTopPerfumeSlugs(limit: number): Promise<string[]> {
  return seed.perfumes.slice(0, limit).map((p) => p.slug);
}
export async function getAllHouseSlugs(): Promise<string[]> {
  return seed.houses.map((h) => h.slug);
}
/** All houses, alphabetically, for the /houses directory. */
export async function getAllHouses(): Promise<House[]> {
  return [...seed.houses].sort((a, b) => a.name.localeCompare(b.name));
}
export async function getAllArticleSlugs(): Promise<string[]> {
  return seed.articles.map((a) => a.slug);
}

export interface HouseFull extends House { perfumes: Perfume[] }
export async function getHouse(slug: string): Promise<HouseFull | null> {
  const h = houseBySlug.get(slug);
  if (!h) return null;
  return { ...h, perfumes: seed.perfumes.filter((p) => p.houseSlug === slug) };
}

export async function searchPerfumes(query: string, limit = 8): Promise<Perfume[]> {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const scored = seed.perfumes.map((p) => {
    const name = p.name.toLowerCase();
    const house = p.house.toLowerCase();
    let s = -1;
    if (name === q) s = 100;
    else if (name.startsWith(q)) s = 80;
    else if (name.includes(q)) s = 60;
    else if (house.includes(q)) s = 40;
    else {
      // typo tolerance: all query tokens present
      const tokens = q.split(/\s+/);
      if (tokens.every((t) => name.includes(t) || house.includes(t))) s = 30;
    }
    return { p, s };
  }).filter((x) => x.s > 0);
  scored.sort((a, b) => b.s - a.s || b.p.ratingCount - a.p.ratingCount);
  return scored.slice(0, limit).map((x) => x.p);
}

export async function getDupesForPerfume(originalSlug: string): Promise<DupeEntry[]> {
  return seed.dupeRelationships
    .filter((r) => r.originalSlug === originalSlug)
    .map(toDupeEntry)
    .filter((d): d is DupeEntry => !!d)
    .sort((a, b) => (b.similarityScore ?? -1) - (a.similarityScore ?? -1));
}

export async function getTrending(): Promise<Perfume[]> {
  return seed.trending.map((s) => perfBySlug.get(s)!).filter(Boolean);
}
export async function getLatestLaunches(): Promise<Perfume[]> {
  return seed.latest.map((s) => perfBySlug.get(s)!).filter(Boolean);
}
export async function getPriceDrops(): Promise<Array<PriceDrop & { perfume: Perfume; seller: Seller | undefined }>> {
  return seed.priceDrops.map((d) => ({
    ...d,
    perfume: perfBySlug.get(d.perfumeSlug)!,
    seller: sellerBySlug.get(d.sellerSlug),
  })).filter((d) => d.perfume);
}
export async function getDupeOfWeek(): Promise<{ original: Perfume; dupe: DupeEntry } | null> {
  const original = perfBySlug.get(seed.dupeOfWeek.originalSlug);
  const rel = seed.dupeRelationships.find((r) => r.dupeSlug === seed.dupeOfWeek.dupeSlug);
  if (!original || !rel) return null;
  const dupe = toDupeEntry(rel);
  if (!dupe) return null;
  return { original, dupe };
}

export async function getPerfumeOfTheDay(): Promise<Perfume | null> {
  const eligible = [...perfBySlug.values()].filter((p) => p.description && p.accords.length);
  if (!eligible.length) return null;
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const dayOfYear = Math.floor((now.getTime() - start.getTime()) / 86400000);
  return eligible[dayOfYear % eligible.length] ?? null;
}

// Demo mode has no site_settings table — always return defaults.
export async function getSiteSetting(_key: string): Promise<Record<string, unknown> | null> {
  return null;
}

export async function getHeroContent(): Promise<{ headline: string; subheadline: string }> {
  return { headline: '', subheadline: '' };
}

export async function getBanner(): Promise<{ text: string; link: string; enabled: boolean }> {
  return { text: '', link: '', enabled: false };
}

export async function getLatestReviews(limit = 6): Promise<Array<Review & { perfume: Perfume }>> {
  return [...seed.reviews]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, limit)
    .map((r) => ({ ...r, perfume: perfBySlug.get(r.perfumeSlug)! }))
    .filter((r) => r.perfume);
}

export async function getArticles(limit?: number): Promise<Article[]> {
  const list = [...seed.articles].sort((a, b) => b.date.localeCompare(a.date));
  return limit ? list.slice(0, limit) : list;
}
export async function getArticle(slug: string): Promise<Article | null> {
  return seed.articles.find((a) => a.slug === slug) ?? null;
}

export async function getForumCategories(): Promise<ForumCategory[]> { return seed.forum; }
export async function getForumCategory(slug: string): Promise<ForumCategory | null> {
  return seed.forum.find((c) => c.slug === slug) ?? null;
}
export async function getForumTopic(id: string): Promise<{ topic: ForumTopic; category: ForumCategory } | null> {
  for (const c of seed.forum) {
    const topic = c.topics.find((t) => t.id === id);
    if (topic) return { topic, category: c };
  }
  return null;
}

export async function getAwards(year: number): Promise<AwardCategory[]> {
  const cats = (seed.awards as unknown as Award[]).filter((a) => a.year === year);
  return cats.map((a, i) => ({
    id: i, year, slug: a.category.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    name: a.category, description: '', icon: '🏆',
    section: 'global' as const, nomineeType: a.type, sortOrder: i,
    nominees: a.nominees.map(([slug, votes], j) => ({
      rowId: j, kind: a.type, slug, name: slug, houseName: '', image: null, votes, isWinner: j === 0,
    })),
    winner: null,
  }));
}
export async function getAwardYears(): Promise<number[]> {
  const years = [...new Set((seed.awards as unknown as Award[]).map((a) => a.year))];
  return years.sort((a, b) => b - a);
}
export async function getGiveaways(): Promise<Giveaway[]> { return seed.giveaways; }

export async function getTopMembers(limit = 12): Promise<Array<{ username: string; reviewCount: number; level: string }>> {
  const counts = new Map<string, number>();
  for (const r of seed.reviews) counts.set(r.username, (counts.get(r.username) ?? 0) + 1);
  return [...counts.entries()]
    .map(([username, reviewCount]) => {
      const m = seed.users.find((u) => u.username === username);
      return { username, reviewCount, level: m?.level ?? 'Explorer' };
    })
    .sort((a, b) => b.reviewCount - a.reviewCount)
    .slice(0, limit);
}

export async function getMember(username: string): Promise<(Member & { wardrobePerfumes: Record<keyof Member['wardrobe'], Perfume[]> }) | null> {
  const m = seed.users.find((u) => u.username === username);
  if (!m) return null;
  const wardrobePerfumes = {
    have: m.wardrobe.have.map((s) => perfBySlug.get(s)!).filter(Boolean),
    want: m.wardrobe.want.map((s) => perfBySlug.get(s)!).filter(Boolean),
    had: m.wardrobe.had.map((s) => perfBySlug.get(s)!).filter(Boolean),
    test: m.wardrobe.test.map((s) => perfBySlug.get(s)!).filter(Boolean),
  };
  return { ...m, wardrobePerfumes };
}

export async function getReviewsByMember(username: string): Promise<Array<Review & { perfume: Perfume }>> {
  return seed.reviews
    .filter((r) => r.username === username)
    .map((r) => ({ ...r, perfume: perfBySlug.get(r.perfumeSlug)! }))
    .filter((r) => r.perfume)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function getNotes(): Promise<NoteInfo[]> { return seed.notes; }

export async function getSimilarPerfumes(slug: string, limit = 8): Promise<Perfume[]> {
  const p = perfBySlug.get(slug);
  if (!p) return [];
  return seed.perfumes.filter((x) => x.slug !== slug)
    .map((x) => ({ p: x, s: sharedScore(p, x) }))
    .sort((a, b) => b.s - a.s).slice(0, limit).map((x) => x.p);
}

export async function findByNotes(include: string[], exclude: string[], gender?: string): Promise<Perfume[]> {
  const inc = include.map((s) => s.toLowerCase());
  const exc = exclude.map((s) => s.toLowerCase());
  return seed.perfumes.filter((p) => {
    if (gender && gender !== 'any' && p.gender !== gender) return false;
    const all = [...p.topNotes, ...p.heartNotes, ...p.baseNotes].map((n) => n.toLowerCase());
    if (exc.some((e) => all.some((n) => n.includes(e)))) return false;
    if (!inc.length) return true;
    return inc.every((i) => all.some((n) => n.includes(i)));
  }).sort((a, b) => b.ratingCount - a.ratingCount).slice(0, 24);
}

export async function findByAccords(
  wanted: Array<{ name: string; min: number }>,
  opts: { maxPrice?: number; minSummer?: number; inStockOnly?: boolean; gender?: string } = {},
): Promise<Array<Perfume & { matchScore: number }>> {
  const list: Array<Perfume & { matchScore: number }> = [];
  for (const p of seed.perfumes) {
    if (opts.gender && opts.gender !== 'any' && p.gender !== opts.gender) continue;
    if (opts.maxPrice && (p.lowestPriceInr ?? Infinity) > opts.maxPrice) continue;
    const clim = climateBySlug.get(p.slug);
    if (opts.minSummer && (clim?.summerRating ?? 0) < opts.minSummer) continue;
    let score = 0; let matched = 0;
    for (const w of wanted) {
      const a = p.accords.find((x) => x.name.toLowerCase() === w.name.toLowerCase());
      if (a && (a.strength ?? 0) >= w.min) { matched++; score += a.strength ?? 0; }
    }
    if (matched === 0) continue;
    list.push({ ...p, matchScore: Math.round((score / wanted.length) * (matched / wanted.length)) });
  }
  return list.sort((a, b) => b.matchScore - a.matchScore).slice(0, 24);
}

export async function finderRecommendations(likedSlugs: string[]): Promise<Array<Perfume & { reason: string }>> {
  const liked = likedSlugs.map((s) => perfBySlug.get(s)).filter((p): p is Perfume => !!p);
  if (!liked.length) return [];
  const likedSet = new Set(likedSlugs);
  const scored = seed.perfumes
    .filter((p) => !likedSet.has(p.slug))
    .map((p) => {
      let s = 0; const reasons: string[] = [];
      for (const l of liked) {
        const share = sharedScore(l, p);
        if (share > 30) { s += share; }
        const rel = seed.dupeRelationships.find((r) => r.originalSlug === l.slug && r.dupeSlug === p.slug);
        if (rel?.testedBy === 'lab') { s += 60; reasons.push(`Lab-tested ${(rel.similarityScore ?? 0)}% match to ${l.name}`); }
      }
      if (!reasons.length) {
        const top = p.accords.slice().sort((a, b) => (b.strength ?? 0) - (a.strength ?? 0))[0];
        if (top) reasons.push(`Strong ${top.name.toLowerCase()} character like your picks`);
      }
      return { p, s, reason: reasons[0] ?? 'Similar character to your picks' };
    })
    .filter((x) => x.s > 25)
    .sort((a, b) => b.s - a.s)
    .slice(0, 12);
  return scored.map(({ p, reason }) => ({ ...p, reason }));
}

export async function getStats(): Promise<{ perfumes: number; houses: number; reviews: number; dupesTested: number; members: number }> {
  return {
    perfumes: seed.perfumes.length,
    houses: seed.houses.length,
    reviews: seed.reviews.length + 48210,
    dupesTested: seed.dupeRelationships.filter((r) => r.testedBy === 'lab').length,
    members: 12840 + seed.users.length,
  };
}

export async function getPerfumesBySlugs(slugs: string[]): Promise<Perfume[]> {
  return slugs.map((s) => perfBySlug.get(s)).filter((p): p is Perfume => !!p);
}
export async function getPerfumeRequests(): Promise<never[]> { return []; }
export async function getSniffStores(): Promise<never[]> { return []; }
export async function getSniffCities(): Promise<never[]> { return []; }
