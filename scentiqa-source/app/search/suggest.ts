// "Did you mean …?" suggestions for zero-result searches.
//
// A small static map of common fragrance misspellings → the correct term.
// Every suggestion links to a real /search?q= query, so nothing here invents
// catalog data. Shown only when a search returns zero results, one line max.
const CORRECTIONS: Array<[RegExp, string]> = [
  [/^aventos?$/i, 'aventus'],
  [/^creed\s+aventos?$/i, 'creed aventus'],
  [/^sovage$/i, 'sauvage'],
  [/^bac+arat/i, 'baccarat rouge 540'],
  [/^khamra$/i, 'khamrah'],
  [/^tobaco/i, 'tobacco vanille'],
  [/^erba\s*pura$/i, 'erba pura'],
  [/^layton$/i, 'parfums de marly layton'],
  [/^hawas$/i, 'rasasi hawas'],
];

export function suggestCorrection(query: string): string | null {
  const q = query.trim().toLowerCase();
  if (q.length < 3) return null;
  for (const [re, fix] of CORRECTIONS) {
    if (re.test(q)) return fix;
  }
  return null;
}

// Popular searches shown as recovery chips on the zero-results state.
// All are real, well-known fragrances with catalog coverage.
export const POPULAR_SEARCHES = [
  'Aventus',
  'Sauvage',
  'Baccarat Rouge 540',
  'Khamrah',
  'Tobacco Vanille',
  'Erba Pura',
];
