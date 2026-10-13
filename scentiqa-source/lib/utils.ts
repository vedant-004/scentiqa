export function inr(n: number | null | undefined): string {
  if (n === null || n === undefined || !Number.isFinite(n)) return '—';
  return '₹' + n.toLocaleString('en-IN');
}

export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ');
}

export function timeAgo(iso: string): string {
  const then = new Date(iso).getTime();
  const mins = Math.max(1, Math.floor((Date.now() - then) / 60000));
  if (mins < 60) return `${mins}m ago`;
  const h = Math.floor(mins / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d ago`;
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function slugifyName(s: string): string {
  return s
    .normalize('NFD') // decompose accented chars (è → e + combining grave)
    .replace(/[\u0300-\u036f]/g, '') // strip diacritic marks (è → e, ô → o)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// Punchy, Fragrantica-grade accord colors: vivid solid hues, high saturation.
// Each accord maps to [background hex, text hex] — text is chosen for contrast.
const ACCORD_COLORS: Record<string, [string, string]> = {
  sweet: ['#ef4444', '#ffffff'],
  honey: ['#f59e0b', '#ffffff'],
  vanilla: ['#fde68a', '#713f12'],
  tobacco: ['#8d6e63', '#ffffff'],
  lavender: ['#8b7bd8', '#ffffff'],
  citrus: ['#d4e157', '#3f4a00'],
  aromatic: ['#2dd4bf', '#083f39'],
  floral: ['#ec4899', '#ffffff'],
  'white floral': ['#f9a8d4', '#6b2144'],
  powdery: ['#b0a89f', '#ffffff'],
  'warm spicy': ['#b45309', '#ffffff'],
  spicy: ['#dc2626', '#ffffff'],
  fruity: ['#fb7185', '#ffffff'],
  gourmand: ['#d97706', '#ffffff'],
  woody: ['#a16207', '#ffffff'],
  smoky: ['#57534e', '#ffffff'],
  musky: ['#a78bfa', '#3b2a6e'],
  musk: ['#a78bfa', '#3b2a6e'],
  amber: ['#f59e0b', '#5c3300'],
  ambery: ['#f59e0b', '#5c3300'],
  leathery: ['#7c2d12', '#ffffff'],
  leather: ['#7c2d12', '#ffffff'],
  fresh: ['#22d3ee', '#0c4a5e'],
  aquatic: ['#0ea5e9', '#ffffff'],
  green: ['#4ade80', '#14532d'],
  oriental: ['#c2410c', '#ffffff'],
  resinous: ['#92400e', '#ffffff'],
  earthy: ['#65a30d', '#ffffff'],
  natural: ['#84cc16', '#2a3a00'],
  creamy: ['#fde9c8', '#7c4a12'],
  almond: ['#e7c07a', '#5c3a10'],
  incense: ['#78716c', '#ffffff'],
  chypre: ['#16a34a', '#ffffff'],
  fougere: ['#0d9488', '#ffffff'],
  balsamic: ['#b45309', '#ffffff'],
  lactonic: ['#fef3c7', '#7c5a10'],
  mineral: ['#94a3b8', '#1e293b'],
  salty: ['#7dd3fc', '#0c4a6e'],
  animalic: ['#a16207', '#ffffff'],
  aldehydic: ['#e0f2fe', '#0c4a6e'],
  ozonic: ['#67e8f9', '#0c4a5e'],
  camphor: ['#99f6e4', '#134e4a'],
  herbal: ['#4ade80', '#14532d'],
  rose: ['#f43f5e', '#ffffff'],
  oud: ['#78350f', '#ffffff'],
};

function accordColorEntry(name: string | null | undefined): [string, string] {
  if (!name || typeof name !== 'string') return ['#d6a94f', '#ffffff'];
  const nl = name.toLowerCase();
  const key = Object.keys(ACCORD_COLORS).find((k) => nl.includes(k));
  return key ? ACCORD_COLORS[key] : ['#d6a94f', '#ffffff'];
}

/** Vivid solid background color for an accord. */
export function accordColor(name: string | null | undefined, dark = false): string {
  return accordColorEntry(name)[0];
}

/** Contrasting text color for use on top of accordColor(). */
export function accordTextColor(name: string | null | undefined): string {
  return accordColorEntry(name)[1];
}

/** Soft tinted background for an accord (badges, chips). */
export function accordBg(name: string | null | undefined, dark = false): string {
  const [bg] = accordColorEntry(name);
  return bg + (dark ? '33' : '26'); // hex alpha: ~20% / ~15%
}

export function scoreTone(score: number | null): 'great' | 'good' | 'ok' | 'low' | 'none' {
  if (score === null || score === undefined) return 'none';
  if (score >= 85) return 'great';
  if (score >= 75) return 'good';
  if (score >= 60) return 'ok';
  return 'low';
}

export function scoreClasses(tone: ReturnType<typeof scoreTone>): string {
  switch (tone) {
    case 'great': return 'bg-emerald-500 text-white';
    case 'good': return 'bg-gold-500 text-white';
    case 'ok': return 'bg-orange-400 text-white';
    case 'low': return 'bg-stone-400 text-white';
    default: return 'bg-stone-200 text-stone-500 dark:bg-ink-700 dark:text-stone-400';
  }
}

export const HOUSE_TYPE_LABEL: Record<string, string> = {
  designer: 'Designer', niche: 'Niche', indian_clone: 'Indian Clone House',
  middle_eastern: 'Middle Eastern', attar_maker: 'Attar House', artisan: 'Artisan',
  mass: 'Mass Market',
};

export const CONC_LABEL: Record<string, string> = {
  edp: 'Eau de Parfum', edt: 'Eau de Toilette', extrait: 'Extrait de Parfum',
  parfum: 'Parfum', oil: 'Perfume Oil', attar: 'Attar', edc: 'Eau de Cologne',
};
