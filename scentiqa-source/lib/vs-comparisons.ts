// Curated head-to-head comparisons for /vs/[a]-vs-[b].
// Slugs verified against the live catalog 2026-10-08. Add new pairs here;
// pages generate statically from this list (never combinatorially).
export interface VsPair { a: string; b: string }

export const VS_COMPARISONS: VsPair[] = [
  { a: 'aventus', b: 'club-de-nuit-intense-man' },
  { a: 'sauvage-dior', b: 'bleu-de-chanel-parfum' },
  { a: 'sauvage-elixir', b: 'sauvage-dior' },
  { a: 'baccarat-rouge-540', b: 'aventus' },
  { a: 'asad', b: 'khamrahqahwa' },
  { a: 'eros', b: 'y-eau-de-parfum' },
  { a: 'oud-wood', b: 'interlude-man' },
  { a: 'naxos', b: 'halfeti' },
  { a: 'santal33', b: 'another13' },
  { a: 'goodgirl', b: 'libreeaudetoilette' },
  { a: 'diorhommeintense', b: 'lhommeprada' },
  { a: 'hawasfire', b: 'asad' },
  { a: 'angham', b: 'opulentdubai' },
  { a: 'jean-lowe-vibe', b: 'mojaveghost' },
  { a: 'voceviva', b: 'chance-eau-fraiche' },
  { a: 'stronger-with-you-intensely', b: 'eros' },
  { a: 'chanel-no-5-parfum-chanel', b: 'shalimar' },
  { a: 'jazzclub', b: 'santal33' },
  { a: 'oud-satin-mood', b: 'baccarat-rouge-540' },
  { a: 'bleu-de-chanel-parfum', b: 'sauvage-elixir' },
];

export const vsParam = (p: VsPair) => `${p.a}-vs-${p.b}`;

/** Split a /vs/[comparison] param back into its two slugs. */
export function parseVsParam(comparison: string): VsPair | null {
  const idx = comparison.indexOf('-vs-');
  if (idx < 0) return null;
  const a = comparison.slice(0, idx);
  const b = comparison.slice(idx + 4);
  if (!a || !b) return null;
  return { a, b };
}
