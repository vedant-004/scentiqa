// Weather & occasion recommendation engine.
// Scores perfumes against weather/occasion accord-affinity maps derived from
// the same accord vectors the site already uses for heat prediction.
// ALL scores are estimates from accord profiles — never lab measurements.

export interface AffinityProfile {
  id: string;
  label: string;
  icon: string;
  image: string;
  blurb: string;
  /** accord keyword (lowercase substring) -> fit weight 0-100 */
  affinity: Record<string, number>;
}

export interface ScoredPick {
  match: number;          // 0-100 weather/occasion fit
  matchedAccords: string[]; // top accords driving the score
  heatScore: number;      // supporting signal
  longevityHrs: number;   // estimated, from accords
  longevityNote: string;  // 'est.'
}

function scoreAccords(
  accords: Array<{ name: string; strength: number | null }>,
  affinity: Record<string, number>,
): { match: number; matchedAccords: string[] } {
  if (!accords.length) return { match: 0, matchedAccords: [] };
  let weighted = 0, total = 0;
  const hits: Array<{ name: string; w: number; s: number }> = [];
  for (const a of accords) {
    const nl = a.name.toLowerCase();
    let w = 45; // neutral default
    for (const [key, val] of Object.entries(affinity)) {
      if (nl.includes(key)) { w = val; break; }
    }
    const s = a.strength ?? 50;
    weighted += w * s;
    total += s;
    if (w >= 70) hits.push({ name: a.name, w, s });
  }
  const match = total > 0 ? Math.round(Math.min(99, Math.max(2, weighted / total))) : 0;
  hits.sort((x, y) => y.w * y.s - x.w * x.s);
  return { match, matchedAccords: hits.slice(0, 3).map((h) => h.name) };
}

/** Estimated longevity in hours from accord tenacity. Clearly an estimate. */
export function estimateLongevity(accords: Array<{ name: string; strength: number | null }>): number {
  const TENACITY: Record<string, number> = {
    oud: 95, amber: 92, leather: 90, tobacco: 90, musk: 88, vanilla: 85,
    balsamic: 85, woody: 82, incense: 82, patchouli: 80, 'warm spicy': 78,
    sweet: 75, powdery: 72, animalic: 88, mossy: 78, earthy: 75,
    floral: 55, rose: 60, fruity: 52, aromatic: 58, green: 50,
    herbal: 48, 'fresh spicy': 45, citrus: 32, aquatic: 28, marine: 28,
    ozonic: 25, fresh: 32, aldehydic: 40,
  };
  if (!accords.length) return 4;
  let weighted = 0, total = 0;
  for (const a of accords) {
    const nl = a.name.toLowerCase();
    let w = 55;
    for (const [key, val] of Object.entries(TENACITY)) {
      if (nl.includes(key)) { w = val; break; }
    }
    const s = a.strength ?? 50;
    weighted += w * s;
    total += s;
  }
  const score = total > 0 ? weighted / total : 55;
  // Map 0-100 tenacity to ~2-12 hours.
  return Math.round((2 + (score / 100) * 10) * 2) / 2;
}

// ================= WEATHER =================

export const WEATHER_TYPES: AffinityProfile[] = [
  {
    id: 'hot-humid', label: 'Hot & Humid', icon: '',
    image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&q=80',
    blurb: 'Delhi/Mumbai summer, coastal heat. Light, fresh scents that cut through humidity without turning cloying.',
    affinity: {
      citrus: 95, aquatic: 95, ozonic: 92, fresh: 90, green: 85, marine: 88,
      herbal: 80, aromatic: 78, 'fresh spicy': 75, fruity: 70, floral: 62,
      musky: 60, powdery: 55, rose: 55, aldehydic: 58,
      woody: 48, vanilla: 40, sweet: 32, 'warm spicy': 38, balsamic: 35,
      amber: 28, tobacco: 25, leather: 22, oud: 20, smoky: 22, incense: 30,
    },
  },
  {
    id: 'hot-dry', label: 'Hot & Dry', icon: '',
    image: 'https://images.unsplash.com/photo-1509316785289-025f5b846b35?w=400&q=80',
    blurb: 'Desert heat, low humidity. Bright citrus-aromatics that project cleanly in dry air.',
    affinity: {
      citrus: 95, aromatic: 90, 'fresh spicy': 88, fresh: 88, green: 82,
      herbal: 82, ozonic: 78, aquatic: 75, fruity: 70, floral: 62,
      musky: 62, woody: 55, rose: 58, aldehydic: 55,
      vanilla: 45, sweet: 40, 'warm spicy': 48, powdery: 52,
      amber: 35, oud: 28, leather: 30, tobacco: 30, smoky: 32,
    },
  },
  {
    id: 'monsoon', label: 'Monsoon / Rainy', icon: '',
    image: 'https://images.unsplash.com/photo-1428592953211-077101b2021b?w=400&q=80',
    blurb: 'Wet earth and petrichor season. Green, earthy and fresh scents that bloom in the rain.',
    affinity: {
      green: 95, fresh: 90, aquatic: 88, ozonic: 85, herbal: 85, citrus: 80,
      earthy: 88, mossy: 85, vetiver: 88, patchouli: 80, aromatic: 78,
      floral: 65, fruity: 62, musky: 60, 'fresh spicy': 70,
      woody: 58, rose: 60, powdery: 55,
      sweet: 42, vanilla: 45, amber: 40, 'warm spicy': 50,
      oud: 38, leather: 35, tobacco: 35, smoky: 40,
    },
  },
  {
    id: 'pleasant', label: 'Cool & Pleasant', icon: '',
    image: 'https://images.unsplash.com/photo-1507371341162-763b5e419408?w=400&q=80',
    blurb: 'Winter mornings, hill stations, breezy evenings. The most versatile weather — almost everything works.',
    affinity: {
      floral: 88, fruity: 85, musky: 85, citrus: 82, fresh: 82, aromatic: 82,
      woody: 80, rose: 85, green: 78, powdery: 78, 'fresh spicy': 78,
      herbal: 75, aquatic: 72, ozonic: 70, aldehydic: 75,
      vanilla: 78, sweet: 75, 'warm spicy': 78, amber: 75, balsamic: 72,
      oud: 68, leather: 65, tobacco: 65, incense: 70, smoky: 62,
    },
  },
  {
    id: 'cold', label: 'Cold Winter', icon: '',
    image: 'https://images.unsplash.com/photo-1418985991508-e47386d96a71?w=400&q=80',
    blurb: 'North-Indian December–January. Rich, warm scents with the density to project through cold air.',
    affinity: {
      amber: 95, vanilla: 93, oud: 92, tobacco: 90, leather: 90,
      'warm spicy': 90, sweet: 88, balsamic: 88, incense: 88, smoky: 85,
      woody: 85, powdery: 78, musky: 75, rose: 78, floral: 65,
      patchouli: 82, mossy: 75, earthy: 72,
      fruity: 55, aromatic: 58, green: 45, herbal: 45,
      citrus: 35, fresh: 32, aquatic: 25, ozonic: 22, marine: 25,
    },
  },
];

// ================= OCCASIONS =================

export const OCCASIONS: AffinityProfile[] = [
  {
    id: 'gym', label: 'Gym / Workout', icon: '',
    image: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400&q=80',
    blurb: 'Fresh and clean, never loud. Scents that survive sweat without choking the room.',
    affinity: {
      fresh: 95, citrus: 93, aquatic: 92, ozonic: 90, green: 85, marine: 88,
      herbal: 80, aromatic: 78, 'fresh spicy': 75, fruity: 68,
      musky: 65, floral: 55, aldehydic: 58,
      woody: 48, powdery: 45, rose: 48, sweet: 35, vanilla: 32,
      amber: 28, oud: 20, leather: 22, tobacco: 22, smoky: 25,
      'warm spicy': 40, balsamic: 30, incense: 28,
    },
  },
  {
    id: 'office', label: 'Office / Work', icon: '',
    image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=400&q=80',
    blurb: 'Polished and inoffensive. Clean scents colleagues notice pleasantly, never complain about.',
    affinity: {
      musky: 90, citrus: 88, fresh: 85, aromatic: 88, floral: 80, powdery: 82,
      green: 80, herbal: 78, 'fresh spicy': 78, aldehydic: 80, rose: 78,
      aquatic: 75, ozonic: 72, fruity: 68, woody: 72,
      vanilla: 60, sweet: 55, 'warm spicy': 62,
      amber: 50, oud: 35, leather: 38, tobacco: 35, smoky: 32, incense: 40,
      balsamic: 45, animalic: 25,
    },
  },
  {
    id: 'coffee-date', label: 'Coffee Date', icon: '',
    image: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400&q=80',
    blurb: 'Warm, approachable, a little sweet. Inviting at arm\u2019s length, not across the café.',
    affinity: {
      vanilla: 92, musky: 90, sweet: 88, floral: 82, rose: 85, fruity: 82,
      powdery: 85, 'warm spicy': 80, amber: 78, citrus: 75, fresh: 70,
      balsamic: 75, woody: 68, aromatic: 65, green: 60,
      gourmand: 90, lactonic: 88,
      oud: 45, leather: 42, tobacco: 48, smoky: 35, incense: 45, animalic: 30,
      aquatic: 45, ozonic: 42, marine: 40,
    },
  },
  {
    id: 'dinner-date', label: 'Dinner Date', icon: '',
    image: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&q=80',
    blurb: 'Magnetic and intimate. Dark warmth that draws someone closer as the evening cools.',
    affinity: {
      oud: 92, amber: 92, leather: 88, tobacco: 88, 'warm spicy': 88,
      vanilla: 85, sweet: 82, rose: 88, balsamic: 85, incense: 82, smoky: 78,
      musky: 82, powdery: 75, woody: 80, floral: 68, fruity: 65,
      patchouli: 80, mossy: 72, animalic: 75,
      citrus: 45, fresh: 35, aquatic: 28, ozonic: 25, green: 48, herbal: 45,
    },
  },
  {
    id: 'party', label: 'Party / Night Out', icon: '',
    image: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400&q=80',
    blurb: 'Loud and long-lasting. Sweet, bold scents built to project over music and crowds.',
    affinity: {
      sweet: 93, fruity: 90, vanilla: 90, amber: 88, gourmand: 92,
      'warm spicy': 85, tobacco: 82, oud: 80, leather: 78, balsamic: 82,
      floral: 75, rose: 78, musky: 75, powdery: 72, woody: 72,
      incense: 75, smoky: 70, lactonic: 85,
      citrus: 55, fresh: 45, aquatic: 35, ozonic: 32, green: 48, herbal: 45,
    },
  },
  {
    id: 'wedding', label: 'Wedding / Festive', icon: '',
    image: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=400&q=80',
    blurb: 'Rich and celebratory. Opulent florals, ouds and ambers worthy of the occasion.',
    affinity: {
      floral: 92, oud: 90, amber: 92, rose: 92, 'warm spicy': 88,
      vanilla: 88, sweet: 85, balsamic: 88, incense: 85, powdery: 85,
      musky: 82, leather: 78, tobacco: 78, woody: 80, fruity: 75,
      patchouli: 80, smoky: 70, animalic: 65,
      citrus: 55, fresh: 45, aquatic: 32, ozonic: 30, green: 55, herbal: 50,
    },
  },
  {
    id: 'daily', label: 'Everyday Casual', icon: '',
    image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&q=80',
    blurb: 'Easy, versatile, no-thought-needed. The jeans-and-t-shirt of fragrances.',
    affinity: {
      fresh: 90, citrus: 90, musky: 88, fruity: 85, aromatic: 85, floral: 82,
      green: 82, aquatic: 80, 'fresh spicy': 80, herbal: 78, ozonic: 75,
      woody: 75, rose: 78, powdery: 75, aldehydic: 75,
      vanilla: 68, sweet: 65, 'warm spicy': 68, amber: 60,
      oud: 45, leather: 45, tobacco: 45, smoky: 42, incense: 50, animalic: 35,
    },
  },
  {
    id: 'formal', label: 'Formal Event', icon: '',
    image: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=400&q=80',
    blurb: 'Refined and restrained. Quietly expensive-smelling, never trying too hard.',
    affinity: {
      woody: 90, aromatic: 90, musky: 88, powdery: 88, citrus: 85,
      floral: 82, aldehydic: 88, green: 82, 'fresh spicy': 82, herbal: 80,
      rose: 80, iris: 90, vetiver: 88, amber: 70, vanilla: 62,
      sweet: 55, fruity: 58, 'warm spicy': 68,
      oud: 55, leather: 60, tobacco: 55, smoky: 48, incense: 55,
      aquatic: 60, ozonic: 58, gourmand: 40, animalic: 40,
    },
  },
];

export function scoreForProfile(
  accords: Array<{ name: string; strength: number | null }>,
  profile: AffinityProfile,
  heatScore: number,
): ScoredPick {
  const { match, matchedAccords } = scoreAccords(accords, profile.affinity);
  const longevityHrs = estimateLongevity(accords);
  return {
    match,
    matchedAccords,
    heatScore,
    longevityHrs,
    longevityNote: 'est.',
  };
}
