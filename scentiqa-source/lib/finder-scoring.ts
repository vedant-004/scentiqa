// AI Scent Finder — server-side scoring engine.
// Precision-first ranking: every point is explainable, nothing random.
// Weights: notes 35 + accord vector 25 + longevity 15 + sillage 10 + budget 10 + house 5 = 100.
import { promises as fs } from 'fs';
import path from 'path';

export interface FinderAnswers {
  lovedNotes: string[]; // normalized lowercase note names
  hatedNotes: string[];
  houses: string[]; // house slugs (empty = any)
  longevity: number; // 1-5 required
  sillage: number; // 1-5 required
  occasions: string[]; // occasion keys
  budget: number; // max INR
  gender: 'men' | 'women' | 'unisex' | 'any';
  clonePref: 'originals' | 'clones' | 'any';
  concentration: string[]; // normalized, empty = any
}

export interface ScoredPerfume {
  id: string;
  slug: string;
  name: string;
  house: string;
  houseSlug: string;
  gender: string;
  concentration: string;
  bottleImage: string | null;
  lowestPriceInr: number | null;
  ratingAvg: number;
  ratingCount: number;
  isDupe: boolean;
  score: number; // 0-100
  breakdown: { key: string; label: string; points: number; max: number }[];
  reasons: string[];
  matchedLovedNotes: string[];
  predictedLongevity: number; // 1-5
  predictedSillage: number; // 1-5
  relaxed?: string; // set when constraints were relaxed to find this
}

// ---------- ML data (loaded once, cached) ----------

interface MLData {
  accords: string[];
  vectors: Record<string, number[]>;
  noteAccords: Record<string, Array<[string, number]>>;
  noteCategory: Map<string, string>; // normalized note name -> category
}

let mlCache: MLData | null = null;

async function loadMLData(): Promise<MLData> {
  if (mlCache) return mlCache;
  const dir = path.join(process.cwd(), 'public', 'ml');
  const [modelRaw, naRaw, notesListRaw] = await Promise.all([
    fs.readFile(path.join(dir, 'ml-model-compact.json'), 'utf8'),
    fs.readFile(path.join(dir, 'ml-note-accords.json'), 'utf8').catch(() => '{}'),
    fs.readFile(path.join(dir, 'ml-notes-list.json'), 'utf8').catch(() => '[]'),
  ]);
  const model = JSON.parse(modelRaw);
  const noteCategory = new Map<string, string>();
  try {
    const list = JSON.parse(notesListRaw) as Array<{ slug: string; name: string; category: string }>;
    for (const n of list) {
      if (n.name && n.category) noteCategory.set(norm(n.name), norm(n.category));
    }
  } catch { /* noop */ }
  mlCache = {
    accords: model.accords as string[],
    vectors: model.vectors as Record<string, number[]>,
    noteAccords: JSON.parse(naRaw) as Record<string, Array<[string, number]>>,
    noteCategory,
  };
  return mlCache;
}

// ---------- helpers ----------

const ACCORD_ALIASES: Record<string, string> = {
  ambery: 'amber',
  leathery: 'leather',
};

/** Precomputed normalized accord name -> index map (avoids re-normalizing 84 names per lookup in hot loops). */
function buildAccordIndexMap(accords: unknown[]): Map<string, number> {
  const m = new Map<string, number>();
  accords.forEach((a, i) => {
    const nl = norm(a);
    if (nl && !m.has(nl)) m.set(nl, i);
  });
  return m;
}

function accordIndex(accords: unknown[], name: unknown): number {
  const nl = norm(name);
  if (!nl) return -1;
  let idx = accords.findIndex((a) => norm(a) === nl);
  if (idx < 0 && ACCORD_ALIASES[nl]) {
    idx = accords.findIndex((a) => norm(a) === ACCORD_ALIASES[nl]);
  }
  return idx;
}

/** Fast lookup using a precomputed map. */
function accordIndexFast(map: Map<string, number>, name: unknown): number {
  const nl = norm(name);
  if (!nl) return -1;
  const idx = map.get(nl);
  if (idx !== undefined) return idx;
  const alias = ACCORD_ALIASES[nl];
  if (alias) {
    const ai = map.get(alias);
    if (ai !== undefined) return ai;
  }
  return -1;
}

function norm(s: unknown): string {
  return String(s ?? '').toLowerCase().trim();
}

/** Canonical concentration bucket: attar | parfum | edp | edt | other */
export function canonConcentration(c: string): string {
  const s = norm(c);
  if (/attar|\boil\b|oil based/.test(s)) return 'attar';
  if (/extrait|pure parfum/.test(s)) return 'parfum';
  if (/eau de parfum|\bedp\b/.test(s)) return 'edp';
  if (/eau de toilette|\bedt\b/.test(s)) return 'edt';
  if (s.includes('parfum')) return 'parfum';
  return 'other';
}

/** fuzzy note match: returns {name, quality} — quality 1 = direct/substring, 0.6 = same scent family */
function noteHit(
  perfumeNotes: string[],
  wanted: string,
  noteCategory?: Map<string, string>
): { name: string; quality: number } | null {
  const w = norm(wanted);
  for (const n of perfumeNotes) {
    const nl = norm(n);
    if (nl === w || nl.includes(w) || w.includes(nl)) return { name: n, quality: 1 };
  }
  // family fallback: same category (e.g. hating "citrus" catches "lemon")
  if (noteCategory) {
    const wantedCat = noteCategory.get(w);
    if (wantedCat) {
      for (const n of perfumeNotes) {
        if (noteCategory.get(norm(n)) === wantedCat) return { name: n, quality: 0.6 };
      }
    }
    // also: wanted string itself might be a category name (e.g. user typed "citrus")
    for (const n of perfumeNotes) {
      if (noteCategory.get(norm(n)) === w) return { name: n, quality: 0.6 };
    }
  }
  return null;
}

// Note volatility for longevity prediction (1 = fleeting, 5 = tenacious)
const VOLATILITY: Array<[RegExp, number]> = [
  [/citrus|bergamot|lemon|grapefruit|mandarin|neroli|yuzu|lime/i, 1],
  [/green|aquatic|marine|ozonic|aldehyd/i, 1.5],
  [/floral|rose|jasmine|lavender|lily|peony|violet|iris/i, 2],
  [/fruit|apple|pear|berry|pineapple|peach/i, 2],
  [/spic|pepper|cardamom|cinnamon|clove|nutmeg|ginger/i, 2.5],
  [/oud|agarwood/i, 5],
  [/amber|musk|vanilla|tonka|balsam|benzoin|myrrh/i, 4],
  [/sandalwood|patchouli|tobacco|leather|smok/i, 4],
  [/wood|cedar|vetiver|moss|oak/i, 3.5],
  [/sweet|gourmand|caramel|honey|chocolate|coffee/i, 3],
];

function volatilityOf(noteName: string): number {
  const nl = norm(noteName);
  for (const [re, v] of VOLATILITY) {
    if (re.test(nl)) return v;
  }
  return 2.5;
}

const CONC_BOOST: Record<string, number> = {
  edt: 0, 'eau de toilette': 0,
  edp: 0.5, 'eau de parfum': 0.5,
  parfum: 1, 'extrait': 1.2, 'extrait de parfum': 1.2,
  oil: 1, attar: 1, 'pure parfum': 1.1,
};

function concBoost(conc: string): number {
  const c = norm(conc);
  for (const [k, v] of Object.entries(CONC_BOOST)) {
    if (c.includes(k)) return v;
  }
  return 0.4;
}

export function predictLongevity(top: string[], heart: string[], base: string[], concentration: string): number {
  let sum = 0, cnt = 0;
  for (const n of base) { sum += volatilityOf(n); cnt += 1; }
  for (const n of heart.slice(0, 4)) { sum += volatilityOf(n) * 0.5; cnt += 0.5; }
  for (const n of top.slice(0, 3)) { sum += volatilityOf(n) * 0.25; cnt += 0.25; }
  const avg = cnt > 0 ? sum / cnt : 2.5;
  return Math.min(5, Math.max(1, Math.round((avg + concBoost(concentration) * 0.6) * 10) / 10));
}

export function predictSillage(top: string[], heart: string[], base: string[], concentration: string): number {
  let sum = 0, cnt = 0;
  for (const n of [...top, ...heart.slice(0, 3)]) {
    const nl = norm(n);
    let p = 3;
    if (/citrus|bergamot|lemon|neroli|aldehyd/i.test(nl)) p = 4;
    else if (/oud|leather|tobacco|smok|cumin/i.test(nl)) p = 4.5;
    else if (/musk|amber|vanilla|sweet|spic/i.test(nl)) p = 3.5;
    else if (/wood|cedar|sandalwood|vetiver|moss|powder/i.test(nl)) p = 2.5;
    sum += p; cnt += 1;
  }
  const avg = cnt > 0 ? sum / cnt : 3;
  return Math.min(5, Math.max(1, Math.round((avg + concBoost(concentration) * 0.4) * 10) / 10));
}

// Occasion -> accord preference boosts (folded into the target vector)
const OCCASION_ACCORDS: Record<string, Record<string, number>> = {
  office: { fresh: 60, citrus: 55, musky: 50, aquatic: 45, green: 35 },
  date: { sweet: 60, vanilla: 50, 'warm spicy': 55, musky: 50, amber: 40 },
  party: { 'warm spicy': 60, sweet: 55, tobacco: 45, leather: 45, amber: 40 },
  daily: { fresh: 55, citrus: 50, floral: 40, green: 40, musky: 35 },
  wedding: { amber: 60, woody: 55, rose: 50, oud: 45, sweet: 40 },
  gym: { fresh: 65, citrus: 60, aquatic: 55, green: 45 },
  monsoon: { fresh: 55, aquatic: 55, green: 45, citrus: 45 },
  summer: { citrus: 65, aquatic: 60, fresh: 55, green: 40 },
  winter: { amber: 65, woody: 60, 'warm spicy': 55, vanilla: 50, sweet: 45 },
};

function cosine(a: number[], b: number[]): number {
  let dot = 0, ma = 0, mb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    ma += a[i] * a[i];
    mb += b[i] * b[i];
  }
  if (ma === 0 || mb === 0) return 0;
  return dot / (Math.sqrt(ma) * Math.sqrt(mb));
}

// ---------- main scoring ----------

export interface PerfumeRow {
  id: string; slug: string; name: string;
  houseSlug: string; house: string;
  gender: string; concentration: string; description: string;
  bottleImage: string | null;
  topNotes: string[]; heartNotes: string[]; baseNotes: string[];
  accords: (string | { name: string; strength: number | null })[];
  lowestPriceInr: number | null;
  ratingAvg: number; ratingCount: number;
}

export async function scorePerfumes(
  rows: PerfumeRow[],
  a: FinderAnswers,
  opts?: { relaxBudget?: boolean; relaxConcentration?: boolean }
): Promise<ScoredPerfume[]> {
  const ml = await loadMLData();
  const accordMap = buildAccordIndexMap(ml.accords);
  const loved = a.lovedNotes.map(norm).filter(Boolean);
  const hated = a.hatedNotes.map(norm).filter(Boolean);

  // Build target accord vector from loved notes (+ occasion boosts)
  const target = new Array(ml.accords.length).fill(0);
  for (const n of loved) {
    const entries = ml.noteAccords[n];
    if (!entries) {
      // fallback: try to find the note key by partial match
      for (const [key, accs] of Object.entries(ml.noteAccords)) {
        if (key.includes(n) || n.includes(key)) {
          for (const [acc, w] of accs) {
            const idx = accordIndexFast(accordMap, acc);
            if (idx >= 0) target[idx] += w;
          }
          break;
        }
      }
      continue;
    }
    for (const [acc, w] of entries) {
      const idx = accordIndexFast(accordMap, acc);
      if (idx >= 0) target[idx] += w;
    }
  }
  for (const occ of a.occasions) {
    const boosts = OCCASION_ACCORDS[occ];
    if (!boosts) continue;
    for (const [acc, v] of Object.entries(boosts)) {
      const idx = accordIndexFast(accordMap, acc);
      if (idx >= 0) target[idx] += v / 100;
    }
  }
  const tMax = Math.max(...target, 0.001);
  const targetNorm = target.map((v) => v / tMax);

  const results: ScoredPerfume[] = [];

  for (const p of rows) {
    // ---- hard filters ----
    if (a.gender !== 'any') {
      const g = norm(p.gender || '');
      const want = a.gender; // men | women | unisex
      const ok =
        want === 'unisex'
          ? g.includes('unisex') || g === '' || g === 'any'
          : g.includes(want) || g.includes('unisex') || g === '' || g === 'any';
      if (!ok) continue;
    }
    if (a.concentration.length > 0 && !opts?.relaxConcentration) {
      const c = canonConcentration(p.concentration || '');
      const ok = a.concentration.some((w) => c === norm(w));
      if (!ok) continue;
    }

    const allNotes = [...p.topNotes, ...p.heartNotes, ...p.baseNotes];
    const breakdown: ScoredPerfume['breakdown'] = [];
    const reasons: string[] = [];
    const matchedLoved: string[] = [];

    // ---- 1. Note match (35) ----
    let wMatched = 0;
    const wTotal = Math.max(1, loved.length) * 1.6;
    if (loved.length > 0) {
      for (const ln of loved) {
        let best = 0;
        let bestName = '';
        const check = (list: string[], w: number) => {
          const hit = noteHit(list, ln, ml.noteCategory);
          if (hit && w * hit.quality > best) { best = w * hit.quality; bestName = hit.name; }
        };
        check(p.topNotes, 1.0);
        check(p.heartNotes, 1.3);
        check(p.baseNotes, 1.6);
        wMatched += best;
        if (bestName) matchedLoved.push(bestName);
      }
    }
    const notePts = loved.length === 0 ? 17.5 : Math.round(35 * (wMatched / wTotal));
    breakdown.push({ key: 'notes', label: 'Note match', points: notePts, max: 35 });
    if (matchedLoved.length > 0) {
      reasons.push(`Has your loved notes: ${[...new Set(matchedLoved)].slice(0, 4).join(', ')}`);
    }

    // hated-note penalty: -20 each, capped at -40 (family matches count too)
    let hatePenalty = 0;
    for (const hn of hated) {
      if (noteHit(allNotes, hn, ml.noteCategory)) hatePenalty += 20;
    }
    hatePenalty = Math.min(40, hatePenalty);

    // ---- 2. Accord vector similarity (25) ----
    let vec = ml.vectors[p.id];
    if (!vec && p.accords.length > 0) {
      vec = new Array(ml.accords.length).fill(0);
      for (const ac of p.accords) {
        // accords may be plain strings ('vanilla') or objects ({name, strength})
        const acName = typeof ac === 'string' ? ac : ac?.name;
        const acStrength = typeof ac === 'string' ? 50 : (ac?.strength || 50);
        if (!acName) continue;
        const idx = accordIndexFast(accordMap, acName);
        if (idx >= 0) vec[idx] = acStrength / 100;
      }
    }
    let accordPts = 12; // neutral default when no vector data
    let accordCos = 0;
    if (vec) {
      accordCos = cosine(targetNorm, vec);
      accordPts = Math.round(25 * Math.pow(Math.max(0, accordCos), 0.7));
    }
    breakdown.push({ key: 'accords', label: 'Scent character match', points: accordPts, max: 25 });

    // ---- 3. Longevity (15) ----
    const predLong = predictLongevity(p.topNotes, p.heartNotes, p.baseNotes, p.concentration);
    const longPts = predLong >= a.longevity
      ? 15
      : Math.max(0, Math.round(15 * (predLong / a.longevity)));
    breakdown.push({ key: 'longevity', label: 'Longevity match', points: longPts, max: 15 });
    const longLabels = ['', '2–3 hrs', '4–6 hrs', '6–8 hrs', '8–12 hrs', '12+ hrs'];
    if (predLong >= 4) reasons.push(`Long-lasting — around ${longLabels[Math.round(predLong)] ?? longLabels[5]} wear`);

    // ---- 4. Sillage (10) ----
    const predSil = predictSillage(p.topNotes, p.heartNotes, p.baseNotes, p.concentration);
    const silPts = Math.max(0, Math.round(10 - Math.abs(predSil - a.sillage) * 2.5));
    breakdown.push({ key: 'sillage', label: 'Projection match', points: silPts, max: 10 });
    if (a.sillage >= 4 && predSil >= 4) reasons.push('Beast-mode projection');
    if (a.sillage <= 2 && predSil <= 2) reasons.push('Intimate, office-safe projection');

    // ---- 5. Budget (10) ----
    const price = p.lowestPriceInr;
    let budgetPts: number;
    if (price == null || price <= 0) {
      budgetPts = 5;
    } else if (opts?.relaxBudget) {
      budgetPts = 5;
      reasons.push('Over budget — shown as a stretch pick');
    } else if (price <= a.budget) {
      budgetPts = 10;
      const under = a.budget - price;
      if (under >= 500) reasons.push(`₹${under.toLocaleString('en-IN')} under your budget`);
    } else if (price <= a.budget * 2) {
      budgetPts = Math.max(0, Math.round(10 * (1 - (price - a.budget) / a.budget)));
    } else {
      budgetPts = 0;
    }
    breakdown.push({ key: 'budget', label: 'Budget fit', points: budgetPts, max: 10 });

    // ---- 6. House preference (5) ----
    let housePts = 2.5;
    if (a.houses.length > 0) {
      housePts = a.houses.includes(p.houseSlug) ? 5 : 0;
      if (housePts === 5) reasons.push(`From ${p.house} — one of your picks`);
    }
    breakdown.push({ key: 'house', label: 'Brand match', points: housePts, max: 5 });

    // ---- clone preference modifier ----
    const isDupe = norm(p.description || '').startsWith('dupe of');
    let cloneAdj = 0;
    if (a.clonePref === 'clones') {
      cloneAdj = isDupe ? 8 : -4;
      if (isDupe) reasons.push('Great dupe value — smells designer for less');
    } else if (a.clonePref === 'originals') {
      cloneAdj = isDupe ? -8 : 4;
      if (!isDupe) reasons.push('Original designer/niche creation');
    }

    let score = notePts + accordPts + longPts + silPts + budgetPts + Math.round(housePts) + cloneAdj - hatePenalty;
    score = Math.max(0, Math.min(100, Math.round(score)));

    // Skip perfumes with zero note signal AND zero vector signal (no data at all)
    if (loved.length > 0 && wMatched === 0 && accordCos < 0.05) continue;

    results.push({
      id: p.id, slug: p.slug, name: p.name,
      house: p.house, houseSlug: p.houseSlug,
      gender: p.gender, concentration: p.concentration,
      bottleImage: p.bottleImage, lowestPriceInr: price,
      ratingAvg: p.ratingAvg, ratingCount: p.ratingCount,
      isDupe, score, breakdown, reasons,
      matchedLovedNotes: [...new Set(matchedLoved)],
      predictedLongevity: predLong, predictedSillage: predSil,
    });
  }

  results.sort((x, y) => y.score - x.score || y.ratingCount - x.ratingCount);
  return results;
}

/** Pick a wildcard: decent note overlap but a DIFFERENT character from the top picks. */
export async function pickWildcard(
  scored: ScoredPerfume[],
  a: FinderAnswers
): Promise<{ pick: ScoredPerfume; explanation: string } | null> {
  if (scored.length < 8) return null;
  const ml = await loadMLData();
  const topIds = new Set(scored.slice(0, 3).map((s) => s.id));

  // candidate pool: rank 8-40, score >= 45, different character
  const pool = scored.slice(7, 40).filter((s) => s.score >= 40 && !topIds.has(s.id));
  if (pool.length === 0) return null;

  // target vector of top-3 average
  const vecs: number[][] = [];
  for (const s of scored.slice(0, 3)) {
    const v = ml.vectors[s.id];
    if (v) vecs.push(v);
  }
  let best: ScoredPerfume | null = null;
  let bestDiv = -1;
  for (const c of pool) {
    const v = ml.vectors[c.id];
    if (!v || vecs.length === 0) continue;
    // average cosine distance to top-3
    let avgCos = 0;
    for (const tv of vecs) avgCos += cosine(v, tv);
    avgCos /= vecs.length;
    const divergence = (1 - avgCos) * (c.score / 100);
    if (divergence > bestDiv) { bestDiv = divergence; best = c; }
  }
  // fallback: most different by notes if no vectors
  if (!best) best = pool[Math.floor(pool.length / 2)];

  const lovedStr = a.lovedNotes.slice(0, 3).join(', ');
  return {
    pick: best,
    explanation: `You asked for ${lovedStr || 'your favorites'} — this one shares some DNA (${best.matchedLovedNotes.slice(0, 2).join(', ') || 'a similar vibe'}) but takes you somewhere new. ${best.house}'s ${best.name} is the wildcard worth sampling.`,
  };
}

/** Detect contradictory preferences for the profile summary. */
export function detectTensions(a: FinderAnswers): string[] {
  const tensions: string[] = [];
  const heavy = ['oud', 'amber', 'leather', 'tobacco', 'smoke', 'incense'];
  const fresh = ['citrus', 'bergamot', 'lemon', 'aquatic', 'marine', 'green'];
  const loved = a.lovedNotes.map(norm);
  const lovesHeavy = loved.some((n) => heavy.some((h) => n.includes(h)));
  const lovesFresh = loved.some((n) => fresh.some((h) => n.includes(h)));
  if (lovesHeavy && a.sillage <= 2) {
    tensions.push('You love rich notes (oud, amber…) but want intimate projection — we prioritized softer compositions with those notes.');
  }
  if (lovesFresh && a.longevity >= 4) {
    tensions.push('Fresh/citrus notes are naturally fleeting — we favored citrus scents anchored with woods/musk for staying power.');
  }
  if (lovesHeavy && lovesFresh) {
    tensions.push('You like both heavy and fresh profiles — expect a mix of bold evening scents and crisp daytime ones.');
  }
  if (a.clonePref === 'originals' && a.budget <= 1500) {
    tensions.push('Original designer scents under ₹1,500 are rare — we stretched to the best-value originals available.');
  }
  return tensions;
}
