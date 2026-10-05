// Scent Archetypes — the "scent personality" system behind the AI Scent Finder.
// Twelve evocative identities derived from real perfumery families. Nothing
// random: archetypeFromAnswers() scores loved notes, occasions and projection
// against perfumery-accurate keyword families.

export interface ScentArchetype {
  id: string;
  name: string;
  emoji: string;
  tagline: string;
  description: string;
  families: string[]; // accord families that define it
  hue: number; // base HSL hue for theming
  keywords: string[]; // note-name substrings that signal this archetype
}

export const ARCHETYPES: ScentArchetype[] = [
  {
    id: 'midnight-smoker',
    name: 'The Midnight Smoker',
    emoji: '🌙',
    tagline: 'You don’t wear perfume. You wear atmosphere.',
    description:
      'Tobacco leaf, worn leather, curling oud smoke — you gravitate toward scents with a past. Yours is the trail people remember the morning after: dark, magnetic, unapologetically grown-up.',
    families: ['tobacco', 'leather', 'oud', 'smoky'],
    hue: 16,
    keywords: ['tobacco', 'leather', 'oud', 'agarwood', 'smoke', 'smoky', 'birch', 'suede', 'whiskey', 'whisky', 'cognac'],
  },
  {
    id: 'citrus-rebel',
    name: 'The Citrus Rebel',
    emoji: '🍋',
    tagline: 'Fresh is a lifestyle, not a season.',
    description:
      'Bergamot, yuzu, sea air — you want to smell like the first five minutes of a perfect day. Bright, kinetic, impossible to ignore in a room full of heavy orientals.',
    families: ['citrus', 'fresh', 'aquatic'],
    hue: 192,
    keywords: ['citrus', 'bergamot', 'lemon', 'grapefruit', 'mandarin', 'orange', 'neroli', 'yuzu', 'lime', 'petitgrain', 'aldehyd'],
  },
  {
    id: 'velvet-romantic',
    name: 'The Velvet Romantic',
    emoji: '🌹',
    tagline: 'Softness, weaponized.',
    description:
      'Damask rose, vanilla bourbon, skin-warm musk. You understand that the most powerful scents whisper. Yours is intimacy in a bottle — the kind people lean in to catch.',
    families: ['rose', 'vanilla', 'musk', 'powdery'],
    hue: 332,
    keywords: ['rose', 'vanilla', 'musk', 'peony', 'powder', 'powdery', 'lychee', 'raspberry', 'praline'],
  },
  {
    id: 'desert-mystic',
    name: 'The Desert Mystic',
    emoji: '🏜️',
    tagline: 'Ancient resins, modern soul.',
    description:
      'Frankincense, myrrh, golden amber — you’re drawn to scents that feel ceremonial. There’s something spiritual about your taste: warm, resinous, and quietly commanding.',
    families: ['amber', 'incense', 'balsamic'],
    hue: 282,
    keywords: ['amber', 'incense', 'olibanum', 'myrrh', 'benzoin', 'opoponax', 'labdanum', 'copal', 'styrax', 'ambrette'],
  },
  {
    id: 'green-alchemist',
    name: 'The Green Alchemist',
    emoji: '🌿',
    tagline: 'You smell like somewhere, not something.',
    description:
      'Crushed galbanum, vetiver roots, wet earth after rain. Your taste is botanical and precise — you notice the stem, not just the flower. Effortlessly sophisticated.',
    families: ['green', 'herbal', 'earthy'],
    hue: 142,
    keywords: ['green', 'galbanum', 'vetiver', 'herbal', 'basil', 'mint', 'tea', 'fig', 'ivy', 'moss', 'oakmoss', 'grass'],
  },
  {
    id: 'gourmand-dreamer',
    name: 'The Gourmand Dreamer',
    emoji: '🍰',
    tagline: 'Life’s too short for bitter.',
    description:
      'Vanilla absolute, cacao, spun honey — you want to smell delicious, and you’re not sorry about it. Warm, joyful, dangerously wearable. Compliments follow you like a dessert cart.',
    families: ['sweet', 'gourmand', 'vanilla'],
    hue: 36,
    keywords: ['sweet', 'vanilla', 'cacao', 'chocolate', 'caramel', 'honey', 'coffee', 'tonka', 'marshmallow', 'sugar', 'pistachio', 'almond'],
  },
  {
    id: 'noir-minimalist',
    name: 'The Noir Minimalist',
    emoji: '🖤',
    tagline: 'One perfect note, worn perfectly.',
    description:
      'Clean musk, pale woods, a whisper of ambroxan. You’ve edited your taste down to the essential — what remains is expensive-smelling restraint. Less, but better.',
    families: ['musky', 'woody', 'clean'],
    hue: 222,
    keywords: ['musk', 'white musk', 'ambroxan', 'iso e', 'cashmeran', 'cedar', 'clean', 'cotton', 'skin', 'mineral'],
  },
  {
    id: 'floral-muse',
    name: 'The Floral Muse',
    emoji: '🌸',
    tagline: 'A garden that follows you indoors.',
    description:
      'Tuberose at midnight, jasmine sambac, ylang in full bloom. You wear florals the way others wear statements — lush, unapologetic, and utterly feminine or beautifully bold.',
    families: ['white floral', 'floral'],
    hue: 308,
    keywords: ['jasmine', 'tuberose', 'ylang', 'orange blossom', 'lily', 'magnolia', 'gardenia', 'freesia', 'osmanthus', 'champaca', 'floral'],
  },
  {
    id: 'spice-merchant',
    name: 'The Spice Merchant',
    emoji: '🌶️',
    tagline: 'Warmth you can feel from across the room.',
    description:
      'Saffron, cinnamon bark, black pepper crackling over woods. Your taste runs hot — you like scents with momentum, spice, and a pulse. Never boring, never background.',
    families: ['warm spicy', 'spicy'],
    hue: 12,
    keywords: ['saffron', 'cinnamon', 'cardamom', 'pepper', 'pink pepper', 'clove', 'nutmeg', 'ginger', 'cumin', 'pimento', 'spicy', 'spice'],
  },
  {
    id: 'ocean-drifter',
    name: 'The Ocean Drifter',
    emoji: '🌊',
    tagline: 'Salt in the air, nowhere to be.',
    description:
      'Sea spray, driftwood, mineral calm. You chase the feeling of open water — scents that breathe. Cool, weightless, and quietly addictive in Indian heat.',
    families: ['marine', 'aquatic', 'ozonic'],
    hue: 206,
    keywords: ['marine', 'aquatic', 'sea', 'salt', 'salty', 'ozonic', 'ozone', 'driftwood', 'water', 'calone', 'seaweed'],
  },
  {
    id: 'golden-hour',
    name: 'The Golden Hour',
    emoji: '🌅',
    tagline: 'You smell like 6pm feels.',
    description:
      'Aged rum, golden honey, sun-warmed woods. Your taste is rich without being heavy — the glow of late light in a bottle. Festive, generous, unforgettable.',
    families: ['amber', 'sweet', 'woody'],
    hue: 44,
    keywords: ['rum', 'boozy', 'whiskey', 'honey', 'dried fruit', 'date', 'fig', 'plum', 'apricot', 'golden', 'amberwood'],
  },
  {
    id: 'wild-adventurer',
    name: 'The Wild Adventurer',
    emoji: '🏔️',
    tagline: 'Untamed, by choice.',
    description:
      'Pine resin, damp earth, woodsmoke on a cold wind. You want scents with terrain — rugged, natural, alive. Yours is the opposite of office-safe, and that’s the point.',
    families: ['woody', 'earthy', 'smoky'],
    hue: 96,
    keywords: ['woody', 'wood', 'earthy', 'earth', 'pine', 'cypress', 'sandalwood', 'patchouli', 'oak', 'moss', 'leather', 'vetiver'],
  },
];

export interface PartialAnswers {
  lovedNotes: string[];
  hatedNotes?: string[];
  occasions?: string[];
  sillage?: number;
  longevity?: number;
  houses?: string[];
  budget?: number;
  gender?: string;
  clonePref?: string;
  concentration?: string[];
}

function norm(s: string): string {
  return (s || '').toLowerCase().trim();
}

/** Score each archetype against the user's answers. Deterministic, explainable. */
export function archetypeFromAnswers(a: PartialAnswers): ScentArchetype {
  const loved = (a.lovedNotes || []).map(norm);
  const occasions = (a.occasions || []).map(norm);
  const scores = ARCHETYPES.map((arch) => {
    let s = 0;
    for (const n of loved) {
      for (const kw of arch.keywords) {
        if (n.includes(kw) || kw.includes(n)) { s += 2; break; }
      }
    }
    // occasion nudges (small, so notes dominate)
    if (occasions.includes('gym') || occasions.includes('summer') || occasions.includes('monsoon')) {
      if (['citrus-rebel', 'ocean-drifter', 'green-alchemist'].includes(arch.id)) s += 1;
    }
    if (occasions.includes('date') || occasions.includes('wedding')) {
      if (['velvet-romantic', 'golden-hour', 'desert-mystic'].includes(arch.id)) s += 1;
    }
    if (occasions.includes('party') || occasions.includes('winter')) {
      if (['midnight-smoker', 'spice-merchant', 'desert-mystic'].includes(arch.id)) s += 1;
    }
    if (occasions.includes('office') || occasions.includes('daily')) {
      if (['noir-minimalist', 'citrus-rebel', 'green-alchemist'].includes(arch.id)) s += 1;
    }
    // projection nudges
    if ((a.sillage ?? 3) >= 4 && ['midnight-smoker', 'spice-merchant', 'desert-mystic'].includes(arch.id)) s += 0.5;
    if ((a.sillage ?? 3) <= 2 && ['noir-minimalist', 'velvet-romantic'].includes(arch.id)) s += 0.5;
    return s;
  });
  let best = 0;
  for (let i = 1; i < scores.length; i++) {
    if (scores[i] > scores[best]) best = i;
  }
  return ARCHETYPES[best];
}

/* ---------------- Scent DNA orb params ---------------- */

export interface DnaParams {
  hue: number; // 0-360 dominant hue
  hue2: number; // secondary hue for gradient depth
  saturation: number; // 40-95
  glow: number; // 0-1 intensity
  particles: number; // particle count
  swirl: number; // rotation speed factor
}

/** Map answers to living orb visuals. Smooth, continuous — no jarring jumps. */
export function dnaFromAnswers(a: PartialAnswers, stepProgress: number): DnaParams {
  const loved = (a.lovedNotes || []).map(norm);
  // weighted hue average across archetype families
  let hx = 0, hy = 0, weight = 0;
  for (const n of loved) {
    for (const arch of ARCHETYPES) {
      for (const kw of arch.keywords) {
        if (n.includes(kw) || kw.includes(n)) {
          const rad = (arch.hue * Math.PI) / 180;
          hx += Math.cos(rad);
          hy += Math.sin(rad);
          weight += 1;
          break;
        }
      }
    }
  }
  let hue: number;
  if (weight === 0) {
    hue = 268; // neutral violet wisp before any signal
  } else {
    hue = ((Math.atan2(hy / weight, hx / weight) * 180) / Math.PI + 360) % 360;
  }
  const hue2 = (hue + 40) % 360;
  const answerCount =
    loved.length + (a.hatedNotes?.length ?? 0) + (a.occasions?.length ?? 0) + (a.houses?.length ?? 0);
  const glow = Math.min(1, 0.25 + stepProgress * 0.55 + Math.min(0.2, answerCount * 0.02));
  const saturation = Math.min(95, 45 + loved.length * 8 + stepProgress * 20);
  const particles = Math.round(6 + stepProgress * 22 + Math.min(10, loved.length * 1.5));
  const swirl = 0.6 + glow * 1.4;
  return { hue, hue2, saturation, glow, particles, swirl };
}

/** Confidence framing derived from the top match score. */
export function confidenceFor(score: number): { label: string; detail: string; tone: 'high' | 'good' | 'ok' | 'wild' } {
  if (score >= 90)
    return {
      label: "We're highly confident you'll love this",
      detail: 'Near-perfect alignment across your notes, performance needs and budget.',
      tone: 'high',
    };
  if (score >= 75)
    return {
      label: 'Strong match',
      detail: 'Hits your core preferences with room to surprise you.',
      tone: 'good',
    };
  if (score >= 60)
    return {
      label: 'Worth exploring',
      detail: 'A solid fit on your key criteria — sample it first if you can.',
      tone: 'ok',
    };
  return {
    label: 'Wildcard — high risk, high reward',
    detail: 'This one stretches your profile. Sometimes the stretch becomes the signature.',
    tone: 'wild',
  };
}
