export function inr(n: number | null | undefined): string {
  if (n === null || n === undefined) return '—';
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
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

const ACCORD_HUE: Record<string, [number, number]> = {
  citrus: [42, 96], fresh: [190, 70], aquatic: [200, 80], green: [140, 55],
  floral: [315, 70], 'white floral': [300, 60], fruity: [15, 85], sweet: [30, 90],
  gourmand: [28, 80], 'warm spicy': [12, 85], spicy: [5, 80], oriental: [35, 75],
  woody: [25, 45], smoky: [20, 20], musky: [270, 25], musk: [270, 25],
  amber: [38, 90], ambery: [38, 90], powdery: [290, 40], leathery: [18, 50],
  leather: [18, 50], resinous: [30, 60], earthy: [90, 35], natural: [100, 40],
  creamy: [40, 60], almond: [35, 55], tobacco: [22, 55], vanilla: [42, 85],
  incense: [25, 40], aromatic: [160, 50], chypre: [120, 40], fougere: [150, 45],
};

export function accordColor(name: string, dark = false): string {
  const key = Object.keys(ACCORD_HUE).find((k) => name.toLowerCase().includes(k));
  const [h, s] = key ? ACCORD_HUE[key] : [36, 60];
  return `hsl(${h} ${s}% ${dark ? 62 : 42}% / 0.9)`;
}

export function accordBg(name: string, dark = false): string {
  const key = Object.keys(ACCORD_HUE).find((k) => name.toLowerCase().includes(k));
  const [h, s] = key ? ACCORD_HUE[key] : [36, 60];
  return `hsl(${h} ${s}% ${dark ? 30 : 88}% / 0.55)`;
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
  parfum: 'Parfum', oil: 'Perfume Oil', attar: 'Attar',
};
