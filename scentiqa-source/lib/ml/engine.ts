// Scentiqa ML Engine — client-side inference for accord matching, note search,
// and AI predictions. Trained on 24k Fragrantica perfumes.

export interface MLModel {
  accords: string[];
  vectors: Record<string, number[]>; // perfumeId -> 84-dim accord vector (0-1)
  notes: Record<string, { t: string[]; h: string[]; b: string[] }>;
}

export interface MLMatch {
  a: string[]; // accords
  t: string[]; // top notes
  m: string[]; // middle notes
  e: string[]; // base notes
}

let model: MLModel | null = null;
let matches: Record<string, MLMatch> | null = null;
let noteAccords: Record<string, Array<[string, number]>> | null = null;

export async function loadML(): Promise<void> {
  if (model) return;
  const [m, mt, na] = await Promise.all([
    fetch('/ml/ml-model-compact.json').then((r) => r.json()),
    fetch('/ml/ml-matches.json').then((r) => r.json()).catch(() => ({})),
    fetch('/ml/ml-note-accords.json').then((r) => r.json()).catch(() => ({})),
  ]);
  model = m;
  matches = mt;
  noteAccords = na;
}

export function isMLReady(): boolean {
  return model !== null;
}

// Accord name aliases (UI name -> dataset name)
const ACCORD_ALIASES: Record<string, string> = {
  ambery: 'amber',
  leathery: 'leather',
};

function findAccordIndex(accords: string[], name: string): number {
  const nl = name.toLowerCase();
  let idx = accords.findIndex((a) => a.toLowerCase() === nl);
  if (idx < 0 && ACCORD_ALIASES[nl]) {
    idx = accords.findIndex((a) => a.toLowerCase() === ACCORD_ALIASES[nl]);
  }
  return idx;
}

// --- Accord matching: cosine similarity between user target and perfume vector ---

export function accordMatchScore(
  userSliders: Record<string, number>, // accord name -> 0-100
  perfumeId: string
): { score: number; explanation: string[] } {
  if (!model) return { score: 0, explanation: [] };

  // Build target vector from sliders (normalize accord names)
  const target = new Array(model.accords.length).fill(0);
  const activeAccords: string[] = [];
  for (const [name, val] of Object.entries(userSliders)) {
    if (val <= 0) continue;
    const idx = findAccordIndex(model.accords, name);
    if (idx >= 0) {
      target[idx] = val / 100;
      activeAccords.push(model.accords[idx]);
    }
  }

  // Get perfume vector (from matches if available, else from model vectors)
  let vec = model.vectors[perfumeId];
  const match = matches?.[perfumeId];
  if (match && match.a.length > 0) {
    // Build vector from matched accords (even weight)
    vec = new Array(model.accords.length).fill(0);
    for (const a of match.a) {
      const idx = model.accords.indexOf(a);
      if (idx >= 0) vec[idx] = 1;
    }
    // Normalize
    const mx = Math.max(...vec, 0.001);
    vec = vec.map((v) => v / mx);
  }
  if (!vec) return { score: 0, explanation: [] };

  // Cosine similarity
  let dot = 0, magT = 0, magV = 0;
  for (let i = 0; i < target.length; i++) {
    dot += target[i] * vec[i];
    magT += target[i] * target[i];
    magV += vec[i] * vec[i];
  }
  magT = Math.sqrt(magT);
  magV = Math.sqrt(magV);
  if (magT === 0 || magV === 0) return { score: 0, explanation: [] };

  const cos = dot / (magT * magV);
  // Convert to 0-100 with a curve that rewards strong alignment
  const score = Math.round(100 * Math.pow(Math.max(0, cos), 0.7));

  // Explanation: which accords drove the match
  const explanation: string[] = [];
  for (const a of activeAccords) {
    const idx = model.accords.indexOf(a);
    if (vec[idx] > 0.3) {
      explanation.push(a);
    }
  }

  return { score, explanation: explanation.slice(0, 3) };
}

// --- Note matching: weighted Jaccard with position weights ---

export function noteMatchScore(
  includeNotes: string[],
  excludeNotes: string[],
  perfumeId: string
): { score: number; matchedNotes: string[] } {
  if (!model) return { score: 0, matchedNotes: [] };

  // Get perfume notes (from model or matches)
  let notes = model.notes[perfumeId];
  const match = matches?.[perfumeId];
  if (match && (match.t.length + match.m.length + match.e.length > 0)) {
    notes = { t: match.t, h: match.m, b: match.e };
  }
  if (!notes) return { score: 0, matchedNotes: [] };

  const allNotes = [...notes.t, ...notes.h, ...notes.b].map((n) => n.toLowerCase());
  const inc = includeNotes.map((n) => n.toLowerCase());
  const exc = excludeNotes.map((n) => n.toLowerCase());

  // Exclusion: if any excluded note present, score = 0
  for (const e of exc) {
    if (allNotes.some((n) => n.includes(e) || e.includes(n))) {
      return { score: 0, matchedNotes: [] };
    }
  }

  if (inc.length === 0) return { score: 50, matchedNotes: [] };

  // Weighted match: top=1, heart=1.3, base=1.6 (base notes matter more for character)
  let matchedWeight = 0;
  let totalWeight = 0;
  const matchedNotes: string[] = [];

  for (const inNote of inc) {
    let best = 0;
    let bestNote = '';
    const check = (noteList: string[], w: number) => {
      for (const n of noteList) {
        const nl = n.toLowerCase();
        if (nl.includes(inNote) || inNote.includes(nl)) {
          if (w > best) {
            best = w;
            bestNote = n;
          }
        }
      }
    };
    check(notes.t, 1.0);
    check(notes.h, 1.3);
    check(notes.b, 1.6);
    // Max weight per include note is 1.6
    totalWeight += 1.6;
    matchedWeight += best;
    if (bestNote) matchedNotes.push(bestNote);
  }

  const score = Math.round(100 * (matchedWeight / totalWeight));
  return { score, matchedNotes };
}

// --- AI Predictions ---

// Note volatility classes for longevity estimation
const VOLATILITY: Record<string, number> = {
  // 1 = very volatile (short), 5 = tenacious (long)
  citrus: 1, bergamot: 1, lemon: 1, grapefruit: 1, 'mandarin orange': 1, neroli: 1.5,
  green: 1.5, aquatic: 1.5, aldehydes: 1.5,
  floral: 2, rose: 2, jasmine: 2, lavender: 2, 'lily-of-the-valley': 2,
  fruity: 2, spicy: 2.5, 'pink pepper': 2, cardamom: 2.5,
  woody: 3.5, cedar: 3.5, sandalwood: 4, vetiver: 3.5, patchouli: 4,
  amber: 4, vanilla: 3.5, 'tonka bean': 3.5, musk: 4, oud: 5, leather: 4,
  tobacco: 4, sweet: 3, gourmand: 3,
};

const CONCENTRATION_BOOST: Record<string, number> = {
  edt: 0, edp: 0.5, parfum: 1, extrait: 1.2, oil: 1, attar: 1,
};

export interface AIPrediction {
  longevity: { score: number; label: string }; // 1-5
  sillage: { score: number; label: string }; // 1-5
  opening: string[];
  heart: string[];
  base: string[];
  overallScore: number; // 0-100
  confidence: 'high' | 'medium' | 'low';
  source: string; // explanation of where data came from
}

export function predictPerfume(
  perfumeId: string,
  perfumeMeta?: { concentration?: string; description?: string }
): AIPrediction | null {
  if (!model) return null;

  const match = matches?.[perfumeId];
  const notes = model.notes[perfumeId];
  const hasNotes = notes && (notes.t.length + notes.h.length + notes.b.length > 0);
  const hasMatch = match && (match.t.length + match.m.length + match.e.length > 0);

  let top: string[] = [], heart: string[] = [], base: string[] = [];
  let confidence: 'high' | 'medium' | 'low' = 'low';
  let source = '';

  if (hasNotes) {
    top = notes.t; heart = notes.h; base = notes.b;
    confidence = 'high';
    source = 'Based on the published note pyramid';
  } else if (hasMatch) {
    top = match.t; heart = match.m; base = match.e;
    confidence = 'medium';
    source = 'AI-matched to a highly similar fragrance in our 24k perfume database';
  } else {
    return null; // Not enough data
  }

  // Longevity: weighted average of base note volatility + concentration boost
  const concBoost = CONCENTRATION_BOOST[(perfumeMeta?.concentration || 'edp').toLowerCase()] ?? 0.5;
  let volSum = 0, volCount = 0;
  for (const n of base) {
    const nl = n.toLowerCase();
    // Find volatility (exact or partial match)
    let v = 2.5; // default
    for (const [key, val] of Object.entries(VOLATILITY)) {
      if (nl.includes(key) || key.includes(nl)) {
        v = val;
        break;
      }
    }
    volSum += v;
    volCount++;
  }
  // Also consider heart notes (they bridge)
  for (const n of heart.slice(0, 3)) {
    const nl = n.toLowerCase();
    let v = 2.5;
    for (const [key, val] of Object.entries(VOLATILITY)) {
      if (nl.includes(key) || key.includes(nl)) {
        v = val;
        break;
      }
    }
    volSum += v * 0.5;
    volCount += 0.5;
  }

  const avgVol = volCount > 0 ? volSum / volCount : 2.5;
  // Convert 1-5 volatility to 1-5 longevity (higher volatility = shorter, but base notes dominate)
  // Actually: higher avgVol (more tenacious notes) = longer longevity
  let longevity = Math.min(5, Math.max(1, avgVol + concBoost * 0.5));
  
  // Sillage: based on top/heart note projection (citrus/floral project more, woods less)
  let projSum = 0, projCount = 0;
  for (const n of [...top, ...heart.slice(0, 2)]) {
    const nl = n.toLowerCase();
    let p = 3; // default moderate
    if (/citrus|bergamot|lemon|neroli|aldehyd/i.test(nl)) p = 4;
    else if (/musk|amber|vanilla|sweet/i.test(nl)) p = 3.5;
    else if (/oud|leather|tobacco|smok/i.test(nl)) p = 4.5;
    else if (/woody|cedar|sandalwood|vetiver/i.test(nl)) p = 2.5;
    projSum += p;
    projCount++;
  }
  let sillage = projCount > 0 ? projSum / projCount : 3;
  sillage = Math.min(5, Math.max(1, sillage + concBoost * 0.3));

  const labels = ['Very Weak', 'Weak', 'Moderate', 'Long-lasting', 'Beast Mode'];
  const silLabels = ['Intimate', 'Moderate', 'Heavy', 'Enormous', 'Room-filler'];

  // Overall AI score: combination of longevity, sillage, note richness
  const noteRichness = Math.min(1, (top.length + heart.length + base.length) / 12);
  const overallScore = Math.round(
    (longevity / 5) * 35 + (sillage / 5) * 25 + noteRichness * 25 + (confidence === 'high' ? 15 : confidence === 'medium' ? 10 : 5)
  );

  return {
    longevity: { score: Math.round(longevity * 10) / 10, label: labels[Math.min(4, Math.max(0, Math.round(longevity) - 1))] },
    sillage: { score: Math.round(sillage * 10) / 10, label: silLabels[Math.min(4, Math.max(0, Math.round(sillage) - 1))] },
    opening: top.slice(0, 5),
    heart: heart.slice(0, 5),
    base: base.slice(0, 5),
    overallScore: Math.min(100, overallScore),
    confidence,
    source,
  };
}

// Smart note suggestions based on co-occurrence
export function suggestNotes(selectedNotes: string[], limit = 8): string[] {
  if (!noteAccords || selectedNotes.length === 0) return [];
  // Find accords associated with selected notes, then find other notes with those accords
  const accordScores = new Map<string, number>();
  for (const n of selectedNotes) {
    const nl = n.toLowerCase();
    for (const [note, accords] of Object.entries(noteAccords)) {
      if (note === nl) {
        for (const [a, w] of accords) {
          accordScores.set(a, (accordScores.get(a) || 0) + w);
        }
      }
    }
  }
  // Score all notes by accord overlap
  const selected = new Set(selectedNotes.map((n) => n.toLowerCase()));
  const scores = new Map<string, number>();
  for (const [note, accords] of Object.entries(noteAccords)) {
    if (selected.has(note)) continue;
    let s = 0;
    for (const [a, w] of accords) {
      s += (accordScores.get(a) || 0) * w;
    }
    if (s > 0) scores.set(note, s);
  }
  return [...scores.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([n]) => n);
}
