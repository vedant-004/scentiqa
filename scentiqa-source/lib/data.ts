// Scentiqa data adapter — single entry point for all data access.
// Demo mode (default): reads from data/seed.json.
// Supabase mode: when NEXT_PUBLIC_SUPABASE_URL + keys are set, queries Supabase.
import { cache } from 'react';
import * as demo from './data-demo';
import * as live from './data-supabase';
import { isSupabaseConfigured } from './supabase';

export { isSupabaseConfigured as isSupabaseMode };
export type { HouseFull } from './data-demo';

/**
 * LAB DATA STATUS — set to true ONLY when real, dated blind-panel lab test
 * records back the similarity scores shown on the site. While false, every
 * lab/score claim across the site must use honest "estimated / community
 * signal" copy (see P0-1 trust reconciliation, Oct 2026).
 */
export const LAB_DATA_LIVE = false;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function select<T extends (...args: any[]) => Promise<any>>(demoFn: T, liveFn: T): T {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return ((...args: any[]) => (isSupabaseConfigured() ? liveFn(...args) : demoFn(...args))) as T;
}

export const getPerfume = cache(select(demo.getPerfume, live.getPerfume));
export const getAllPerfumeSlugs = select(demo.getAllPerfumeSlugs, live.getAllPerfumeSlugs);
export const getTopPerfumeSlugs = select(demo.getTopPerfumeSlugs, live.getTopPerfumeSlugs);
export const getAllHouseSlugs = select(demo.getAllHouseSlugs, live.getAllHouseSlugs);
export const getAllHouses = select(demo.getAllHouses, live.getAllHouses);
export const getAllArticleSlugs = select(demo.getAllArticleSlugs, live.getAllArticleSlugs);
export const getHouse = cache(select(demo.getHouse, live.getHouse));
export const getHouseSummary = select(demo.getHouse, live.getHouseSummary);
export const searchPerfumes = select(demo.searchPerfumes, live.searchPerfumes);
export const searchPerfumesDetailed = select(demo.searchPerfumesDetailed, live.searchPerfumesDetailed);
export const getDupesForPerfume = select(demo.getDupesForPerfume, live.getDupesForPerfume);
export const getTrending = select(demo.getTrending, live.getTrending);
export const getLatestLaunches = select(demo.getLatestLaunches, live.getLatestLaunches);
export const getPriceDrops = select(demo.getPriceDrops, live.getPriceDrops);
export const getDupeOfWeek = select(demo.getDupeOfWeek, live.getDupeOfWeek);
export const getPerfumeOfTheDay = select(demo.getPerfumeOfTheDay, live.getPerfumeOfTheDay);
export const getSiteSetting = select(demo.getSiteSetting, live.getSiteSetting);
export const getHeroContent = select(demo.getHeroContent, live.getHeroContent);
export const getBanner = select(demo.getBanner, live.getBanner);
export const getLatestReviews = select(demo.getLatestReviews, live.getLatestReviews);
export const getArticles = select(demo.getArticles, live.getArticles);
export const getArticle = select(demo.getArticle, live.getArticle);
export const getForumCategories = select(demo.getForumCategories, live.getForumCategories);
export const getForumCategory = select(demo.getForumCategory, live.getForumCategory);
export const getForumTopic = select(demo.getForumTopic, live.getForumTopic);
export const getAwards = select(demo.getAwards, live.getAwards);
export const getAwardYears = select(demo.getAwardYears, live.getAwardYears);
export const getGiveaways = select(demo.getGiveaways, live.getGiveaways);
export const getMember = select(demo.getMember, live.getMember);
export const getReviewsByMember = select(demo.getReviewsByMember, live.getReviewsByMember);
export const getTopMembers = select(demo.getTopMembers, live.getTopMembers);
export const getNotes = select(demo.getNotes, live.getNotes);
export const getSimilarPerfumes = select(demo.getSimilarPerfumes, live.getSimilarPerfumes);
export const findByNotes = select(demo.findByNotes, live.findByNotes);
export const findByAccords = select(demo.findByAccords, live.findByAccords);
export const finderRecommendations = select(demo.finderRecommendations, live.finderRecommendations);
export const getStats = select(demo.getStats, live.getStats);

/* ------------------------------------------------------------------ */
/* Single source of truth for site-wide stats.                          */
/* Every surface (header strip, footer, homepage, search, finder) must  */
/* read from getSiteStats() — no component computes its own count.     */
/* 60-second in-memory cache; on failure returns zeros and callers      */
/* render "—" with labels intact (never a bare number without a label). */
/* ------------------------------------------------------------------ */
export interface SiteStats {
  perfumes: number;
  houses: number;
  reviews: number;
  members: number;
}

const STATS_TTL_MS = 60_000;
let statsCache: { at: number; value: SiteStats } | null = null;

export async function getSiteStats(): Promise<SiteStats> {
  const now = Date.now();
  if (statsCache && now - statsCache.at < STATS_TTL_MS) {
    return statsCache.value;
  }
  try {
    const s = await getStats();
    const value: SiteStats = {
      perfumes: Number(s.perfumes) || 0,
      houses: Number(s.houses) || 0,
      reviews: Number(s.reviews) || 0,
      members: Number(s.members) || 0,
    };
    statsCache = { at: now, value };
    return value;
  } catch {
    // Fail closed: zeros. Callers render "—" with labels intact.
    return { perfumes: 0, houses: 0, reviews: 0, members: 0 };
  }
}

/** Format a stat value: number, or "—" when unavailable (0 from a failed fetch). */
export function fmtStat(n: number): string {
  return n > 0 ? n.toLocaleString('en-IN') : '—';
}
export const getPerfumeRequests = select(demo.getPerfumeRequests, live.getPerfumeRequests);
export const getSniffStores = select(demo.getSniffStores, live.getSniffStores);
export const getSniffCities = select(demo.getSniffCities, live.getSniffCities);
export const getPerfumesBySlugs = select(demo.getPerfumesBySlugs, live.getPerfumesBySlugs);
