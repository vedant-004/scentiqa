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
  { a: 'sauvage-dior', b: 'stronger-with-you-intensely' },
  { a: 'aventus', b: 'green-irish-tweed' },
  { a: 'eros', b: 'invictus' },
  { a: 'acqua-di-gio', b: 'cool-water' },
  { a: '1-million', b: 'phantom' },
  { a: 'le-male', b: 'ultra-male' },
  { a: 'light-blue', b: 'ck-one' },
  { a: 'sauvage-elixir', b: 'asad' },
  { a: 'layton', b: 'khamrah' },
  { a: 'layton', b: 'pegasus' },
  { a: 'oud-wood', b: 'tobacco-vanille' },
  { a: 'khamrah', b: 'hawas' },
  { a: 'asad', b: '9pm' },
  { a: '9pm', b: 'ultra-male' },
  { a: 'hawas', b: 'invictus' },
  { a: 'coco-mademoiselle', b: 'chance-eau-fraiche' },
  { a: 'libre', b: 'black-opium' },
  { a: 'goodgirl', b: '212-vip' },
  { a: 'the-one', b: 'la-nuit-de-lhomme' },
  { a: 'baccarat-rouge-540', b: '9pm' },
  { a: 'bleu-de-chanel-parfum', b: 'dior-homme' },
  { a: 'dior-homme', b: 'la-nuit-de-lhomme' },
  { a: 'tobacco-vanille', b: 'khamrah' },
  { a: 'green-irish-tweed', b: 'cool-water' },
  { a: 'invictus', b: '9pm' },
  { a: 'eros', b: 'ultra-male' },
  { a: '1-million', b: '9pm' },
  { a: 'aventus', b: 'layton' },
  { a: 'sauvage-dior', b: '9pm' },
  { a: 'baccarat-rouge-540', b: 'layton' },
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
