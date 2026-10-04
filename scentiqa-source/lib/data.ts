// Scentiqa data adapter — single entry point for all data access.
// Demo mode (default): reads from data/seed.json.
// Supabase mode: when NEXT_PUBLIC_SUPABASE_URL + keys are set, queries Supabase.
import * as demo from './data-demo';
import * as live from './data-supabase';
import { isSupabaseConfigured } from './supabase';

export { isSupabaseConfigured as isSupabaseMode };
export type { HouseFull } from './data-demo';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function select<T extends (...args: any[]) => Promise<any>>(demoFn: T, liveFn: T): T {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return ((...args: any[]) => (isSupabaseConfigured() ? liveFn(...args) : demoFn(...args))) as T;
}

export const getPerfume = select(demo.getPerfume, live.getPerfume);
export const getAllPerfumeSlugs = select(demo.getAllPerfumeSlugs, live.getAllPerfumeSlugs);
export const getAllHouseSlugs = select(demo.getAllHouseSlugs, live.getAllHouseSlugs);
export const getAllHouses = select(demo.getAllHouses, live.getAllHouses);
export const getAllArticleSlugs = select(demo.getAllArticleSlugs, live.getAllArticleSlugs);
export const getHouse = select(demo.getHouse, live.getHouse);
export const searchPerfumes = select(demo.searchPerfumes, live.searchPerfumes);
export const getDupesForPerfume = select(demo.getDupesForPerfume, live.getDupesForPerfume);
export const getTrending = select(demo.getTrending, live.getTrending);
export const getLatestLaunches = select(demo.getLatestLaunches, live.getLatestLaunches);
export const getPriceDrops = select(demo.getPriceDrops, live.getPriceDrops);
export const getDupeOfWeek = select(demo.getDupeOfWeek, live.getDupeOfWeek);
export const getPerfumeOfTheDay = select(demo.getPerfumeOfTheDay, live.getPerfumeOfTheDay);
export const getLatestReviews = select(demo.getLatestReviews, live.getLatestReviews);
export const getArticles = select(demo.getArticles, live.getArticles);
export const getArticle = select(demo.getArticle, live.getArticle);
export const getForumCategories = select(demo.getForumCategories, live.getForumCategories);
export const getForumCategory = select(demo.getForumCategory, live.getForumCategory);
export const getForumTopic = select(demo.getForumTopic, live.getForumTopic);
export const getAwards = select(demo.getAwards, live.getAwards);
export const getGiveaways = select(demo.getGiveaways, live.getGiveaways);
export const getMember = select(demo.getMember, live.getMember);
export const getReviewsByMember = select(demo.getReviewsByMember, live.getReviewsByMember);
export const getNotes = select(demo.getNotes, live.getNotes);
export const getSimilarPerfumes = select(demo.getSimilarPerfumes, live.getSimilarPerfumes);
export const findByNotes = select(demo.findByNotes, live.findByNotes);
export const findByAccords = select(demo.findByAccords, live.findByAccords);
export const finderRecommendations = select(demo.finderRecommendations, live.finderRecommendations);
export const getStats = select(demo.getStats, live.getStats);
export const getPerfumesBySlugs = select(demo.getPerfumesBySlugs, live.getPerfumesBySlugs);
