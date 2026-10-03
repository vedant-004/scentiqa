// Scentiqa shared types — mirrors supabase/schema.sql

export type HouseType = 'designer' | 'niche' | 'indian_clone' | 'middle_eastern' | 'attar_maker' | 'artisan' | 'mass';
export type Gender = 'men' | 'women' | 'unisex';
export type TestedBy = 'lab' | 'community';

export interface House {
  id: string; slug: string; name: string; country: string; region: string | null;
  mainActivity: string; website: string | null; type: HouseType; description: string;
  perfumeCount: number; earliestYear: number; latestYear: number;
  avgSimilarity: number | null; trustRating: number; foundedYear: number;
  needsVerification?: boolean;
}

export interface Accord { name: string; strength: number }

export interface Perfume {
  id: string; slug: string; name: string; houseSlug: string; house: string;
  gender: Gender; launchYear: number; concentration: string; description: string;
  bottleImage: string | null; ratingAvg: number; ratingCount: number;
  lowestPriceInr: number | null; accords: Accord[];
  topNotes: string[]; heartNotes: string[]; baseNotes: string[];
  inspiredBy: string | null; claimedAccuracy: string | null; isDupe: boolean;
  needsVerification?: boolean;
  /** Real catalog record researched 2026-09-30 (vs synthetic demo fixture). */
  real?: boolean;
  /** Date the real catalog record was observed (2026-09-30 or 2026-10-02). */
  observedAt?: string | null;
  priceProvenance?: 'live' | 'mixed' | 'indexed' | 'stale' | 'demo';
  sourceUrl?: string | null;
  researchNote?: string | null;
  isSet?: boolean;
}

export interface DupeRelationship {
  id: string; originalSlug: string; dupeSlug: string;
  similarityScore: number | null; testedBy: TestedBy;
  openingMatch: number | null; drydownMatch: number | null;
  longevityMatch: number | null; sillageMatch: number | null;
  claimedAccuracy: string | null; verdict: string;
  testDate: string; testerCount: number;
}

/** Dupe relationship joined with the dupe perfume + its house */
export interface DupeEntry extends DupeRelationship {
  dupe: Perfume;
  dupeHouse: House;
  lowestPrice: PriceEntry | null;
}

export interface ClimateScore {
  id: string; perfumeSlug: string;
  heatLongevity: number; humiditySillage: number;
  summerRating: number; monsoonRating: number; winterRating: number;
  testTempC: number; testHumidityPct: number; sprays: number; testerCount: number;
  notes: string;
}

export interface Seller {
  id: string; slug: string; name: string; website: string | null;
  type: 'official' | 'importer' | 'marketplace'; verified: boolean; note?: string | null;
}

export interface PriceEntry {
  id: string; perfumeSlug: string; sellerSlug: string;
  priceInr: number; mrpInr: number | null; sizeMl: number | null;
  inStock: boolean; url: string | null;
  /** live = observed on a live page fetch; mixed/indexed/stale = needs re-verification; demo = synthetic sample. */
  provenance: 'live' | 'mixed' | 'indexed' | 'stale' | 'demo';
  checkedAt: string;
  seller?: Seller;
}

export interface PriceDrop { perfumeSlug: string; oldInr: number; newInr: number; sellerSlug: string }

export interface Wardrobe { have: string[]; want: string[]; had: string[]; test: string[] }

export interface Member {
  id: string; username: string; city: string; bio: string; level: string;
  sig: string; favs: string[]; wardrobe: Wardrobe;
}

export interface Review {
  id: string; perfumeSlug: string; username: string; rating: number;
  title: string; body: string; verifiedPurchase: boolean;
  helpfulVotes: number; createdAt: string;
}

export interface Article {
  id: string; slug: string; title: string; category: string;
  excerpt: string; body: string; author: string; date: string;
}

export interface ForumPost { id: string; username: string; body: string }
export interface ForumTopic { id: string; title: string; author: string; posts: ForumPost[] }
export interface ForumCategory { id: string; slug: string; name: string; description: string; topics: ForumTopic[] }

export interface Award { id: string; year: number; category: string; type: 'house' | 'perfume'; nominees: Array<[string, number]> }

export interface Giveaway {
  id: string; slug: string; title: string; desc: string; prize: string;
  perfumeSlug: string; starts: string; ends: string; winner: string | null;
  active: boolean; entries: number;
}

export interface NoteInfo { id: string; slug: string; name: string; category: string; odorProfile: string }

export interface PerfumeFull extends Perfume {
  houseInfo: House;
  climate: ClimateScore | null;
  dupes: DupeEntry[];
  originalOf: DupeEntry[]; // relationships where THIS perfume is the dupe
  prices: PriceEntry[];
  reviews: Review[];
  similar: Perfume[];
}
