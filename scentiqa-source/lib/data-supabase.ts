// Supabase-mode data layer: same function signatures as lib/data-demo.ts.
// Used only when NEXT_PUBLIC_SUPABASE_URL is set. Requires supabase/schema.sql applied.
import { getSupabaseServer } from './supabase';
import type {
  Article, Award, AwardCategory, AwardNominee, ClimateScore, DupeEntry, ForumCategory, ForumTopic,
  Giveaway, House, Member, NoteInfo, Perfume, PerfumeFull, PriceDrop,
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
    memberRatingAvg: Number(r.member_rating_avg ?? 0), memberRatingCount: Number(r.member_rating_count ?? 0),
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
  // OPTIMIZED: Run independent queries in parallel instead of sequentially
  const [houseRes, relsRes, pricesRes, climRes, revsRes] = await Promise.all([
    c.from('houses').select('*').eq('id', p.house_id).single(),
    c.from('dupe_relationships').select('*, dupe:dupe_perfume_id(*, houses(slug, name))').eq('original_perfume_id', p.id),
    c.from('prices').select('*, sellers(*)').eq('perfume_id', p.id),
    c.from('climate_scores').select('*').eq('perfume_id', p.id).single(),
    c.from('reviews').select('*, users(username)').eq('perfume_id', p.id).order('helpful_votes', { ascending: false }).limit(20),
  ]);
  const houseInfo = mapHouse(houseRes.data ?? {});
  const { data: rels } = relsRes;
  const dupes = (rels ?? []).map(mapDupe).sort((a, b) => (b.similarityScore ?? -1) - (a.similarityScore ?? -1));
  const { data: pricesR } = pricesRes;
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
  const { data: clim } = climRes;
  const climate: ClimateScore | null = clim ? {
    id: clim.id, perfumeSlug: slug, heatLongevity: clim.heat_longevity,
    humiditySillage: clim.humidity_sillage, summerRating: clim.summer_rating,
    monsoonRating: clim.monsoon_rating, winterRating: clim.winter_rating,
    testTempC: clim.test_temp_c, testHumidityPct: clim.test_humidity_pct,
    sprays: clim.sprays_used, testerCount: clim.tester_count, notes: clim.notes ?? '',
  } : null;
  const { data: revs } = revsRes;
  const reviews: Review[] = (revs ?? []).map((r: Record<string, unknown>) => ({
    id: r.id as string, perfumeSlug: slug, username: (r.users as Record<string, string>)?.username ?? 'member',
    rating: r.rating as number, title: (r.title as string) ?? '', body: (r.body as string) ?? '',
    verifiedPurchase: !!r.verified_purchase, helpfulVotes: Number(r.helpful_votes ?? 0),
    createdAt: r.created_at as string,
  }));
  return { ...perfume, houseInfo, climate, dupes, originalOf: [], prices, reviews, similar: [] };
}

/** Paginated slug fetch: PostgREST caps a single select at 1000 rows. */
async function getAllSlugs(table: string, onlyPublished: boolean): Promise<string[]> {
  const c = sb(); if (!c) return [];
  const slugs: string[] = [];
  let offset = 0;
  for (;;) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let q: any = c.from(table).select('slug').range(offset, offset + 999);
    if (onlyPublished) q = q.eq('is_published', true);
    const { data } = await q;
    const rows = (data ?? []) as Array<{ slug: string }>;
    if (!rows.length) break;
    for (const r of rows) slugs.push(r.slug);
    offset += 1000;
    if (rows.length < 1000) break;
  }
  return slugs;
}
export async function getAllPerfumeSlugs(): Promise<string[]> {
  return getAllSlugs('perfumes', false);
}
/** Top N perfume slugs by rating count — for build-time static pre-rendering.
 *  The full catalog is still reachable on demand via ISR (dynamicParams). */
export async function getTopPerfumeSlugs(limit: number): Promise<string[]> {
  const c = sb(); if (!c) return [];
  const { data } = await c.from('perfumes').select('slug')
    .order('rating_count', { ascending: false }).limit(limit);
  return ((data ?? []) as Array<{ slug: string }>).map((r) => r.slug);
}
export async function getAllHouseSlugs(): Promise<string[]> {
  return getAllSlugs('houses', false);
}
/** All houses, alphabetically, for the /houses directory. */
export async function getAllHouses(): Promise<House[]> {
  const c = sb(); if (!c) return [];
  const { data } = await c.from('houses').select('*').order('name', { ascending: true });
  return (data ?? []).map((r) => mapHouse(r as Record<string, unknown>));
}
export async function getAllArticleSlugs(): Promise<string[]> {
  return getAllSlugs('articles', true);
}

export async function getHouse(slug: string): Promise<HouseFull | null> {
  const c = sb(); if (!c) return null;
  const { data: h } = await c.from('houses').select('*').eq('slug', slug).single();
  if (!h) return null;
  const { data: ps } = await c.from('perfumes').select('*, houses(slug, name)').eq('house_id', h.id).order('rating_count', { ascending: false });
  return { ...mapHouse(h), perfumes: (ps ?? []).map(mapPerfume) };
}

/** Lightweight house info for cards — no perfume pull. */
export async function getHouseSummary(slug: string): Promise<House | null> {
  const c = sb(); if (!c) return null;
  const { data: h } = await c.from('houses').select('*').eq('slug', slug).single();
  return h ? mapHouse(h) : null;
}

/** Sanitize a user search query for PostgREST ilike/or filters. */
function cleanSearchQuery(q: string): string {
  return q.trim().replace(/[%_\\(),"]/g, '').slice(0, 60);
}

/** Levenshtein edit distance — names are short, plain DP is plenty fast. */
function editDistance(a: string, b: string): number {
  if (a === b) return 0;
  const la = a.length, lb = b.length;
  if (la === 0) return lb;
  if (lb === 0) return la;
  let prev = new Array<number>(lb + 1);
  let cur = new Array<number>(lb + 1);
  for (let j = 0; j <= lb; j++) prev[j] = j;
  for (let i = 1; i <= la; i++) {
    cur[0] = i;
    const ca = a.charCodeAt(i - 1);
    for (let j = 1; j <= lb; j++) {
      const cost = ca === b.charCodeAt(j - 1) ? 0 : 1;
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + cost);
    }
    const tmp = prev; prev = cur; cur = tmp;
  }
  return prev[lb];
}

/**
 * Normalize a perfume name for near-duplicate comparison: lowercase, strip the
 * house's tokens (so "Creed Aventus" and "Aventus" compare equal), drop
 * punctuation, collapse whitespace.
 */
function normalizeName(name: string, house = ''): string {
  const clean = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, ' ').replace(/\s+/g, ' ').trim();
  const houseTokens = new Set(clean(house).split(' ').filter((t) => t.length > 2));
  return clean(name).split(' ').filter((t) => t.length > 0 && !houseTokens.has(t)).join(' ');
}

/** Marketplace spam patterns — applied in JS after fetch, so no index changes needed. */
function isSpamName(name: string): boolean {
  if (!name || !name.trim()) return true;
  if (/inspired[\s-]*by/i.test(name)) return true; // "X inspired by Y" / "inspired-Y"
  if (/\b[A-Z][a-z]*\*/.test(name)) return true;    // obfuscated brands like "Crd*"
  const letters = name.replace(/[^A-Za-z]/g, '');
  return letters.length > 8 && letters === letters.toUpperCase(); // ALL CAPS rows
}

/** Data-richness score for near-duplicate dedup: image + description outweigh ratings. */
function richness(r: Record<string, unknown>): number {
  return (Number(r.rating_count ?? 0) || 0)
    + (r.bottle_image_url ? 1_000_000 : 0)
    + (typeof r.description === 'string' && r.description.trim() ? 500_000 : 0);
}

type SearchRow = Record<string, unknown>;
type MatchedField = 'name' | 'house' | 'note' | 'fuzzy';

export interface SearchResult {
  results: Perfume[];
  /** High-confidence spelling correction, e.g. "aventis" -> "Aventus". Null when not confident. */
  didYouMean: string | null;
}

export async function searchPerfumesDetailed(query: string, limit = 8): Promise<SearchResult> {
  const c = sb(); if (!c) return { results: [], didYouMean: null };
  const q = cleanSearchQuery(query);
  if (q.length === 0) return { results: [], didYouMean: null };
  const sel = '*, houses(slug, name)';
  const seen = new Map<string, SearchRow>();
  const fieldOf = new Map<string, MatchedField>();
  let noteMatches = 0;
  const add = (rows: SearchRow[] | null, field: MatchedField) => {
    for (const r of rows ?? []) {
      const id = r.id as string;
      if (!id || seen.has(id)) continue;
      if (isSpamName(String(r.name ?? ''))) continue;
      if (field === 'note') {
        if (noteMatches >= 3) continue; // note hits must not drown name matches
        noteMatches++;
      }
      seen.set(id, r);
      fieldOf.set(id, field);
    }
  };
  type Row = Record<string, unknown>;
  // Pass 1: exact name match (case-insensitive) — instant.
  add(((await c.from('perfumes').select(sel).ilike('name', q).limit(limit)).data ?? []) as Row[], 'name');
  // Pass 2: name starts with query — the most useful prefix matches.
  if (seen.size < limit) {
    add(((await c.from('perfumes').select(sel).ilike('name', `${q}%`).limit(limit)).data ?? []) as Row[], 'name');
  }
  // Pass 3: name contains query — served by the trigram GIN index.
  if (seen.size < limit) {
    add(((await c.from('perfumes').select(sel).ilike('name', `%${q}%`).limit(limit * 2)).data ?? []) as Row[], 'name');
  }
  // Pass 4: house name contains query (e.g. "lattafa", "creed").
  if (seen.size < limit) {
    const { data } = await c.from('perfumes').select(sel).or(`houses.name.ilike.%${q}%`).limit(limit);
    add((data ?? []) as Row[], 'house');
  }
  // Passes 5 (typo tolerance) and 6 (note search) are independent — run together.
  const extra: Promise<void>[] = [];
  const fuzzyHits: Array<{ r: SearchRow; score: number }> = [];
  if (seen.size < limit) {
    // Pass 5: pg_trgm similarity() isn't callable through the JS client without an
    // RPC, so do it JS-side: pull a 2-letter-prefix candidate pool, then rerank by
    // token-level edit distance. "aventis" -> "Aventus".
    extra.push((async () => {
      const ql = q.toLowerCase();
      const qTokens = ql.split(/\s+/).filter(Boolean);
      if (!qTokens.length) return;
      const prefixes = new Set<string>();
      prefixes.add(qTokens[0].slice(0, 2));
      prefixes.add([...qTokens].sort((a, b) => b.length - a.length)[0].slice(0, 2));
      const pool: SearchRow[] = [];
      const pooled = new Set<string>();
      for (const prefix of prefixes) {
        if (!/^[a-z0-9]{2}$/.test(prefix)) continue;
        const { data } = await c.from('perfumes').select(sel).ilike('name', `${prefix}%`).limit(120);
        for (const r of (data ?? []) as Row[]) {
          const id = r.id as string;
          if (!id || seen.has(id) || pooled.has(id)) continue;
          if (isSpamName(String(r.name ?? ''))) continue;
          pooled.add(id);
          pool.push(r);
        }
      }
      const sim = (a: string, b: string) =>
        a === b ? 1 : 1 - editDistance(a, b) / Math.max(a.length, b.length);
      const scored = pool.map((r) => {
        const nTokens = String(r.name ?? '').toLowerCase()
          .replace(/[^a-z0-9]+/g, ' ').split(' ').filter(Boolean);
        // Every query token must resemble some name token (worst-token score).
        let worst = 1;
        for (const qt of qTokens) {
          let best = 0;
          for (const nt of nTokens) best = Math.max(best, sim(qt, nt));
          worst = Math.min(worst, best);
        }
        return { r, score: worst };
      }).filter((x) => x.score >= 0.55)
        .sort((a, b) => b.score - a.score);
      for (const x of scored) fuzzyHits.push(x);
      add(scored.map((x) => x.r), 'fuzzy');
    })());
  }
  if (seen.size < limit) {
    // Pass 6: query matches a note name (e.g. "oud") — include perfumes carrying
    // that note. Note columns are jsonb, so match with the contains operator.
    extra.push((async () => {
      const { data: noteRows, error } = await c.from('notes').select('name').ilike('name', `%${q}%`).limit(3);
      if (error || !noteRows?.length) return;
      const names = (noteRows as Array<{ name: string }>)
        .map((n) => String(n.name ?? ''))
        .filter((n) => n && !/["\\]/.test(n));
      if (!names.length) return;
      const perNote = await Promise.all(names.map(async (n) => {
        const filt = ['top_notes', 'heart_notes', 'base_notes']
          .map((col) => `${col}.cs.${JSON.stringify([n])}`).join(',');
        const { data, error: e2 } = await c.from('perfumes').select(sel).or(filt).limit(limit);
        if (e2) { console.warn('[search] note pass failed for note', n, e2.message); return []; }
        return (data ?? []) as Row[];
      }));
      add(perNote.flat(), 'note');
    })());
  }
  await Promise.all(extra);
  // "Did you mean?": only when there were NO direct name/house matches at all and
  // the fuzzy winner is genuinely close (>= 0.8). Never guess when nothing is close.
  let didYouMean: string | null = null;
  const directHits = [...fieldOf.values()].filter((f) => f === 'name' || f === 'house').length;
  if (directHits === 0 && fuzzyHits.length > 0) {
    const winner = [...fuzzyHits].sort((a, b) => b.score - a.score)[0];
    if (winner.score >= 0.8) {
      const name = String(winner.r.name ?? '').trim();
      if (name) didYouMean = name;
    }
  }
  // Near-duplicate dedup: same normalized name + house -> keep the richest record.
  const best = new Map<string, SearchRow>();
  for (const r of seen.values()) {
    const house = (r.houses as { name?: string; slug?: string } | null) ?? {};
    const key = `${normalizeName(String(r.name ?? ''), String(house.name ?? ''))}|${String(house.slug ?? '')}`;
    const cur = best.get(key);
    if (!cur || richness(r) > richness(cur)) best.set(key, r);
  }
  const rows = [...best.values()];
  const ql = q.toLowerCase();
  const rankOf = (r: SearchRow): number => {
    const name = String(r.name ?? '').toLowerCase();
    const house = String((r.houses as { name?: string } | null)?.name ?? '').toLowerCase();
    if (name === ql) return 0;
    if (name.startsWith(ql)) return 1;
    if (name.includes(ql)) return 2;
    if (house.includes(ql)) return 3;
    return fieldOf.get(r.id as string) === 'note' ? 5 : 4; // fuzzy = 4
  };
  rows.sort((a, b) => {
    const dr = rankOf(a) - rankOf(b);
    if (dr !== 0) return dr;
    return (Number(b.rating_count ?? 0) || 0) - (Number(a.rating_count ?? 0) || 0);
  });
  const top = rows.slice(0, limit);
  // One batched dupe count — never N+1.
  const counts = new Map<string, number>();
  const ids = top.map((r) => r.id as string).filter(Boolean);
  if (ids.length) {
    const { data } = await c.from('dupe_relationships').select('original_perfume_id').in('original_perfume_id', ids);
    for (const d of (data ?? []) as Array<{ original_perfume_id: string }>) {
      counts.set(d.original_perfume_id, (counts.get(d.original_perfume_id) ?? 0) + 1);
    }
  }
  return {
    results: top.map((r) => {
      const p = mapPerfume(r);
      p.matchedField = fieldOf.get(r.id as string) ?? 'name';
      p.dupeCount = counts.get(r.id as string) ?? 0;
      return p;
    }),
    didYouMean,
  };
}

/** Original signature — kept for existing callers (header search, find-alternative, diary, collection). */
export async function searchPerfumes(query: string, limit = 8): Promise<Perfume[]> {
  return (await searchPerfumesDetailed(query, limit)).results;
}

export async function getDupesForPerfume(originalSlug: string): Promise<DupeEntry[]> {
  const full = await getPerfume(originalSlug);
  return full?.dupes ?? [];
}

export async function getTrending(): Promise<Perfume[]> {
  const c = sb(); if (!c) return [];
  // Only perfumes with real ratings — never show empty 0.0-star cards.
  // Most-voted first is the honest "most popular" signal available.
  const { data } = await c.from('perfumes').select('*, houses(slug, name)')
    .gt('rating_count', 0)
    .order('rating_count', { ascending: false }).limit(12);
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
  // OPTIMIZED: Instead of fetching all 8k+ perfumes, use a day-based offset to fetch
  // a small batch and pick the first eligible one. This reduces 9 queries to 1-2.
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const dayOfYear = Math.floor((now.getTime() - start.getTime()) / 86400000);
  // Use dayOfYear to compute a stable starting offset (spread across the catalog)
  const BATCH = 200;
  const offset = (dayOfYear * 37) % 8000; // 37 is prime for good distribution
  const { data: batch } = await c.from('perfumes')
    .select('slug, accords, top_notes, heart_notes, base_notes')
    .not('bottle_image_url', 'is', null)
    .not('description', 'is', null)
    .neq('description', '')
    .order('slug', { ascending: true })
    .range(offset, offset + BATCH - 1);
  const pool = (batch ?? []).filter((r: Record<string, unknown>) => {
    const accords = (r.accords as unknown[]) ?? [];
    const notes = [
      ...((r.top_notes as string[]) ?? []),
      ...((r.heart_notes as string[]) ?? []),
      ...((r.base_notes as string[]) ?? []),
    ];
    return accords.length > 0 && notes.length > 0;
  });
  if (!pool.length) return null;
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

function embeddedName(rel: { name: string } | Array<{ name: string }> | null | undefined): string {
  if (!rel) return '';
  return Array.isArray(rel) ? (rel[0]?.name ?? '') : rel.name;
}
function embeddedUsername(rel: { username: string } | Array<{ username: string }> | null | undefined): string {
  if (!rel) return 'member';
  return Array.isArray(rel) ? (rel[0]?.username ?? 'member') : rel.username;
}

export async function getForumCategories(): Promise<ForumCategory[]> {
  const c = sb(); if (!c) return [];
  // Three bulk queries — no N+1. Counts are computed in code.
  const [{ data: cats }, { data: topics }, { data: posts }] = await Promise.all([
    c.from('forum_categories').select('*').order('sort_order'),
    c.from('forum_topics').select('id, category_id, title, users(username)'),
    c.from('forum_posts').select('id, topic_id'),
  ]);
  const postsByTopic = new Map<string, number>();
  for (const p of (posts ?? []) as Array<{ id: string; topic_id: string }>) {
    postsByTopic.set(p.topic_id, (postsByTopic.get(p.topic_id) ?? 0) + 1);
  }
  const topicsByCat = new Map<string, ForumTopic[]>();
  for (const t of (topics ?? []) as Array<{ id: string; category_id: string; title: string; users: unknown }>) {
    const list = topicsByCat.get(t.category_id) ?? [];
    list.push({
      id: t.id, title: t.title,
      author: embeddedUsername(t.users as { username: string } | Array<{ username: string }> | null), posts: [],
      postCount: postsByTopic.get(t.id) ?? 0,
    });
    topicsByCat.set(t.category_id, list);
  }
  return ((cats ?? []) as Array<{ id: string; slug: string; name: string; description: string | null }>).map((cat) => ({
    id: cat.id, slug: cat.slug, name: cat.name, description: cat.description ?? '',
    topics: topicsByCat.get(cat.id) ?? [],
  }));
}
export async function getForumCategory(slug: string): Promise<ForumCategory | null> {
  const c = sb(); if (!c) return null;
  const { data: cat } = await c.from('forum_categories').select('*').eq('slug', slug).maybeSingle();
  if (!cat) return null;
  const row = cat as { id: string; slug: string; name: string; description: string | null };
  const { data: topics } = await c.from('forum_topics')
    .select('id, title, users(username)').eq('category_id', row.id)
    .order('last_post_at', { ascending: false });
  const topicRows = (topics ?? []) as Array<{ id: string; title: string; users: unknown }>;
  const topicIds = topicRows.map((t) => t.id);
  let postRows: Array<{ topic_id: string }> = [];
  if (topicIds.length > 0) {
    const { data } = await c.from('forum_posts').select('topic_id').in('topic_id', topicIds);
    postRows = (data ?? []) as Array<{ topic_id: string }>;
  }
  const counts = new Map<string, number>();
  for (const p of postRows) counts.set(p.topic_id, (counts.get(p.topic_id) ?? 0) + 1);
  return {
    id: row.id, slug: row.slug, name: row.name, description: row.description ?? '',
    topics: topicRows.map((t) => ({
      id: t.id, title: t.title,
      author: embeddedUsername(t.users as { username: string } | Array<{ username: string }> | null), posts: [],
      postCount: counts.get(t.id) ?? 0,
    })),
  };
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

/** Top contributing members by review count (real data only). */
export async function getTopMembers(limit = 12): Promise<Array<{ username: string; reviewCount: number; level: string }>> {
  const c = sb(); if (!c) return [];
  const { data: rs } = await c.from('reviews').select('user_id');
  const counts = new Map<string, number>();
  for (const r of (rs ?? []) as Array<{ user_id: string }>) {
    counts.set(r.user_id, (counts.get(r.user_id) ?? 0) + 1);
  }
  if (counts.size === 0) return [];
  const { data: us } = await c.from('users').select('id, username, level').in('id', [...counts.keys()]);
  return ((us ?? []) as Array<{ id: string; username: string; level: string | null }>)
    .map((u) => ({ username: u.username, reviewCount: counts.get(u.id) ?? 0, level: u.level ?? 'Explorer' }))
    .sort((a, b) => b.reviewCount - a.reviewCount)
    .slice(0, limit);
}
export async function getMember(username: string): Promise<(Member & { wardrobePerfumes: Record<keyof Member['wardrobe'], Perfume[]> }) | null> {
  const c = sb(); if (!c) return null;
  const { data: u } = await c.from('users')
    .select('id, username, level, bio, signature_fragrance, favorite_fragrances, location_city')
    .ilike('username', username).limit(1).maybeSingle();
  if (!u) return null;
  const r = u as Record<string, unknown>;
  const { data: items } = await c.from('wardrobe_items').select('shelf, perfume_id').eq('user_id', r.id as string);
  const byShelf: Record<string, string[]> = { have: [], want: [], had: [], test: [] };
  for (const it of (items ?? []) as Array<{ shelf: string; perfume_id: string }>) {
    if (byShelf[it.shelf]) byShelf[it.shelf].push(it.perfume_id);
  }
  const allIds = [...new Set(Object.values(byShelf).flat())];
  const perfMap = new Map<string, Perfume>();
  if (allIds.length > 0) {
    const { data: ps } = await c.from('perfumes').select('*, houses(slug, name)').in('id', allIds);
    for (const p of ((ps ?? []) as Record<string, unknown>[]).map(mapPerfume)) perfMap.set(p.id, p);
  }
  const pick = (ids: string[]) => ids.map((id) => perfMap.get(id)).filter((p): p is Perfume => !!p);
  const favsRaw = r.favorite_fragrances;
  const favs = Array.isArray(favsRaw) ? (favsRaw as unknown[]).filter((x): x is string => typeof x === 'string') : [];
  return {
    id: r.id as string,
    username: r.username as string,
    city: (r.location_city as string) ?? '',
    bio: (r.bio as string) ?? '',
    level: (r.level as string) ?? 'Explorer',
    sig: (r.signature_fragrance as string) ?? '',
    favs,
    wardrobe: { have: byShelf.have, want: byShelf.want, had: byShelf.had, test: byShelf.test },
    wardrobePerfumes: { have: pick(byShelf.have), want: pick(byShelf.want), had: pick(byShelf.had), test: pick(byShelf.test) },
  };
}
export async function getReviewsByMember(username: string): Promise<Array<Review & { perfume: Perfume }>> {
  const c = sb(); if (!c) return [];
  const { data: u } = await c.from('users').select('id').ilike('username', username).limit(1).maybeSingle();
  if (!u) return [];
  const uid = (u as Record<string, unknown>).id as string;
  const { data: rs } = await c.from('reviews')
    .select('id, perfume_id, rating, title, body, verified_purchase, helpful_votes, created_at')
    .eq('user_id', uid).order('created_at', { ascending: false }).limit(20);
  const rows = (rs ?? []) as Record<string, unknown>[];
  const perfIds = [...new Set(rows.map((r) => r.perfume_id as string).filter(Boolean))];
  const perfMap = new Map<string, Perfume>();
  if (perfIds.length > 0) {
    const { data: ps } = await c.from('perfumes').select('*, houses(slug, name)').in('id', perfIds);
    for (const p of ((ps ?? []) as Record<string, unknown>[]).map(mapPerfume)) perfMap.set(p.id, p);
  }
  return rows
    .map((r) => {
      const perfume = perfMap.get(r.perfume_id as string);
      if (!perfume) return null;
      return {
        id: r.id as string,
        perfumeSlug: perfume.slug,
        username,
        rating: Number(r.rating ?? 0),
        title: String(r.title ?? ''),
        body: String(r.body ?? ''),
        verifiedPurchase: Boolean(r.verified_purchase),
        helpfulVotes: Number(r.helpful_votes ?? 0),
        createdAt: String(r.created_at ?? ''),
        perfume,
      };
    })
    .filter((r): r is Review & { perfume: Perfume } => r !== null);
}
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
  const [p, h, r, m] = await Promise.all([
    c.from('perfumes').select('id', { count: 'exact', head: true }),
    c.from('houses').select('id', { count: 'exact', head: true }),
    c.from('reviews').select('id', { count: 'exact', head: true }),
    c.from('users').select('id', { count: 'exact', head: true }),
  ]);
  return { perfumes: p.count ?? 0, houses: h.count ?? 0, reviews: r.count ?? 0, dupesTested: 0, members: m.count ?? 0 };
}
export async function getPerfumesBySlugs(slugs: string[]): Promise<Perfume[]> {
  const c = sb(); if (!c) return [];
  const { data } = await c.from('perfumes').select('*, houses(slug, name)').in('slug', slugs);
  return (data ?? []).map(mapPerfume);
}

/* ---------- Perfume requests (community voting) ---------- */
export interface PerfumeRequest {
  id: string; perfume_name: string; house_name: string; reason: string;
  status: string; requester_name: string; vote_count: number;
  team_created: boolean; created_at: string;
}
export async function getPerfumeRequests(status = 'open'): Promise<PerfumeRequest[]> {
  const c = sb(); if (!c) return [];
  const { data } = await c.from('perfume_requests').select('*')
    .eq('status', status).order('vote_count', { ascending: false }).order('created_at', { ascending: false }).limit(100);
  return (data ?? []) as PerfumeRequest[];
}

/* ---------- Sniff stores (city directory) ---------- */
export interface SniffStore {
  id: string; name: string; city: string; area: string; address: string;
  store_type: string; brands_text: string; samples_info: string; website: string;
  verified: boolean;
}
export async function getSniffStores(city?: string): Promise<SniffStore[]> {
  const c = sb(); if (!c) return [];
  let q = c.from('sniff_stores').select('*').order('city').order('name');
  if (city) q = q.eq('city', city);
  const { data } = await q.limit(200);
  return (data ?? []) as SniffStore[];
}
export async function getSniffCities(): Promise<string[]> {
  const c = sb(); if (!c) return [];
  const { data } = await c.from('sniff_stores').select('city').order('city');
  return [...new Set((data ?? []).map((r: { city: string }) => r.city))];
}
