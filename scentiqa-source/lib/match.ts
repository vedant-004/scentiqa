// Shared honest matching helpers — score perfumes against an accord profile
// using LIVE accord data. No ML vectors, no invented numbers.

export interface AccordEntry { name: string; strength: number | null }

const ALIASES: Record<string, string> = { ambery: 'amber', leathery: 'leather' };

export function normalizeAccords(raw: unknown): AccordEntry[] {
  if (!Array.isArray(raw)) return [];
  const out: AccordEntry[] = [];
  for (const a of raw) {
    if (typeof a === 'string') { if (a.trim()) out.push({ name: a, strength: null }); continue; }
    if (a && typeof a === 'object') {
      const r = a as Record<string, unknown>;
      if (typeof r.name === 'string' && r.name.trim()) {
        out.push({ name: r.name, strength: typeof r.strength === 'number' ? r.strength : null });
      }
    }
  }
  return out;
}

/** Prominence 0-100: source strength when published, else rank-derived. */
export function accordProminence(accords: AccordEntry[], wanted: string): number | null {
  const key = ALIASES[wanted.toLowerCase()] ?? wanted.toLowerCase();
  const idx = accords.findIndex((a) => {
    const nl = a.name.toLowerCase();
    return nl === key || nl.includes(key);
  });
  if (idx < 0) return null;
  const a = accords[idx];
  if (typeof a.strength === 'number') return Math.max(0, Math.min(100, a.strength));
  return Math.round(100 * (accords.length - idx) / accords.length);
}

/**
 * Similarity-based accord profile matching (Fragrantica-style).
 * Each wanted accord contributes graded credit based on how close the
 * perfume's prominence is to the requested intensity — no hard cutoffs,
 * so near-misses still rank instead of vanishing.
 */
export function scoreAccordProfile(
  accords: AccordEntry[],
  wanted: Array<{ name: string; min: number }>,
): { score: number; explanation: string[] } {
  if (accords.length === 0 || wanted.length === 0) return { score: 0, explanation: [] };
  const total = wanted.reduce((s, w) => s + w.min / 100, 0);
  if (total <= 0) return { score: 0, explanation: [] };
  let covered = 0;
  const scored: Array<{ name: string; credit: number }> = [];
  for (const w of wanted) {
    const prom = accordProminence(accords, w.name);
    if (prom === null) continue;
    // Graded similarity: full credit at or above target, smooth falloff below.
    // A perfume at 75 when you asked for 80 still earns ~94% of that accord's credit.
    const ratio = prom / Math.max(w.min, 1);
    const closeness = ratio >= 1 ? 1 : Math.pow(Math.max(0, ratio), 1.5);
    const credit = (w.min / 100) * closeness * (0.6 + 0.4 * (prom / 100));
    covered += credit;
    if (closeness > 0.35) scored.push({ name: w.name, credit });
  }
  scored.sort((a, b) => b.credit - a.credit);
  return { score: Math.round(100 * (covered / total)), explanation: scored.slice(0, 3).map((s) => s.name) };
}

export function tieredNotes(r: { top_notes: unknown; heart_notes: unknown; base_notes: unknown }): Array<{ name: string; weight: number }> {
  const out: Array<{ name: string; weight: number }> = [];
  const push = (raw: unknown, weight: number) => {
    if (!Array.isArray(raw)) return;
    for (const n of raw) {
      if (typeof n === 'string' && n.trim()) out.push({ name: n.toLowerCase(), weight });
    }
  };
  push(r.top_notes, 1);
  push(r.heart_notes, 1.2);
  push(r.base_notes, 1.4);
  return out;
}

/** Share of wanted notes found, tier-weighted (base > heart > top). 0-100. */
export function scoreNoteSet(
  notes: Array<{ name: string; weight: number }>,
  wanted: string[],
): { score: number; matched: string[] } {
  if (notes.length === 0 || wanted.length === 0) return { score: 0, matched: [] };
  let hitWeight = 0;
  const matched: string[] = [];
  for (const want of wanted) {
    const hit = notes.find((n) => n.name.includes(want.toLowerCase()));
    if (hit) { hitWeight += hit.weight; matched.push(want); }
  }
  if (matched.length === 0) return { score: 0, matched: [] };
  return { score: Math.round(100 * (hitWeight / (wanted.length * 1.4))), matched: matched.slice(0, 4) };
}

/** Projection preference from concentration — honest, label-based. */
export function scoreProjection(concentration: string | null | undefined, want: 'intimate' | 'moderate' | 'strong'): number {
  const c = (concentration ?? '').toLowerCase();
  const strength = c.includes('parfum') && !c.includes('eau') ? 100
    : c.includes('extrait') ? 95
    : c.includes('edp') || c.includes('eau de parfum') ? 75
    : c.includes('edt') || c.includes('eau de toilette') ? 55
    : c.includes('edc') || c.includes('cologne') ? 35
    : 60;
  if (want === 'strong') return strength;
  if (want === 'intimate') return 100 - strength;
  return 100 - Math.abs(strength - 65); // moderate peaks mid-range
}
