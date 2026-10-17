// Representative imagery for accord encyclopedia pages (/accords/[slug]).
//
// Each accord maps to a note in lib/note-images.json whose photo illustrates it
// (e.g. the citrus accord shows citrus fruit). Only Wikimedia-hosted images are
// used, since those hotlink reliably; anything else falls back to a tasteful
// gradient placeholder so we never render a broken image.
//
// The photos are illustrative of the accord, not product photos.
import noteImages from './note-images.json';

const WIKI_HOSTS = new Set(['upload.wikimedia.org', 'thumb.wikimedia.org']);

interface NoteImageEntry {
  image?: string | null;
  page?: string | null;
  confidence?: string | null;
}

const NOTES = noteImages as Record<string, NoteImageEntry>;

// Normalized accord name -> note key in note-images.json.
// Every note key below was verified to have a Wikimedia-hosted image.
// Chosen for honesty: the photo must illustrate the accord itself.
const ACCORD_TO_NOTE: Record<string, string> = {
  'citrus': 'lemon',
  'citrusy': 'lemon',
  'white floral': 'jasmine',
  'white florals': 'jasmine',
  'white flowers': 'jasmine',
  'floral': 'rose',
  'florals': 'rose',
  'rose': 'rose',
  'jasmine': 'jasmine',
  'tuberose': 'indian-tuberose',
  'orange blossom': 'orange-blossom',
  'neroli': 'orange-blossom',
  'sweet': 'madagascar-vanilla',
  'gourmand': 'madagascar-vanilla',
  'vanilla': 'madagascar-vanilla',
  'vanillic': 'madagascar-vanilla',
  'sweet vanilla': 'madagascar-vanilla',
  'woody': 'atlas-cedar',
  'woods': 'atlas-cedar',
  'wood': 'atlas-cedar',
  'cedar': 'atlas-cedar',
  'cedarwood': 'atlas-cedar',
  'musk': 'white-musk',
  'musky': 'white-musk',
  'white musk': 'white-musk',
  'amber': 'crystal-amber',
  'ambery': 'crystal-amber',
  'amber woody': 'crystal-amber',
  'oud': 'indian-oud',
  'oudh': 'indian-oud',
  'agarwood': 'indian-oud',
  'spicy': 'pink-pepper',
  'spices': 'pink-pepper',
  'spice': 'pink-pepper',
  'warm spicy': 'pink-pepper',
  'warm spice': 'pink-pepper',
  'fresh': 'mint',
  'mint': 'mint',
  'green': 'galbanum',
  'green notes': 'galbanum',
  'vetiver': 'haitian-vetiver',
  'patchouli': 'indonesian-patchouli-leaf',
  'leather': 'leather',
  'leathery': 'leather',
  'suede': 'leather',
  'iris': 'iris',
  'powdery': 'orris',
  'powder': 'orris',
  'honey': 'honey',
  'honeyed': 'honey',
  'tea': 'green-tea',
  'balsamic': 'peru-balsam',
  'balsam': 'peru-balsam',
  'resinous': 'peru-balsam',
  'incense': 'frankincense',
  'incensy': 'frankincense',
  'hay': 'hay',
  'mossy': 'oakmoss',
  'moss': 'oakmoss',
  'earthy': 'oakmoss',
  'grapefruit': 'grapefruit',
  'fig': 'fig',
  'aromatic': 'lavender',
  'aromatics': 'lavender',
  'herbal': 'lavender',
  'herbaceous': 'lavender',
  'lavender': 'lavender',
};

function wikiImage(entry: NoteImageEntry | undefined): { url: string; creditUrl: string | null } | null {
  const url = entry?.image?.trim();
  if (!url) return null;
  try {
    if (!WIKI_HOSTS.has(new URL(url).hostname)) return null;
  } catch {
    return null;
  }
  const creditUrl = entry?.page?.trim() ? entry.page.trim() : null;
  return { url, creditUrl };
}

export interface AccordImage {
  url: string;
  caption: string;
  creditUrl: string | null;
}

/**
 * Returns a representative image for an accord, or null when no suitable
 * image exists (caller renders a gradient placeholder instead).
 */
export function getAccordImage(displayName: string): AccordImage | null {
  const norm = displayName.toLowerCase().trim();
  // 1. Curated mapping.
  let noteKey = ACCORD_TO_NOTE[norm];
  // 2. Direct note-key match (e.g. accord "Galbanum").
  if (!noteKey) {
    const asKey = norm.replace(/\s+/g, '-');
    if (NOTES[asKey]) noteKey = asKey;
  }
  if (!noteKey) return null;
  const img = wikiImage(NOTES[noteKey]);
  if (!img) return null;
  return { url: img.url, caption: `${displayName} accords`, creditUrl: img.creditUrl };
}
