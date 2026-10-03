// Scentiqa seed generator — single source of truth for demo data.
// Outputs: data/seed.json and supabase/seed.sql in the project root.
// Usage: node scripts/generate-seed.mjs [projectRoot]
import { writeFileSync, mkdirSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const ROOT = resolve(process.argv[2] || new URL('../', import.meta.url).pathname);

// ---------- helpers ----------
let seq = 0;
const uid = (p) => `${p}_${String(++seq).padStart(4, '0')}`;
const slugify = (s) =>
  s.toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

function hashStr(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}
function rand01(seed) {
  let a = hashStr(seed);
  return () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
const pick = (r, arr) => arr[Math.floor(r() * arr.length)];
const esc = (v) => {
  if (v === null || v === undefined) return 'NULL';
  if (typeof v === 'number') return String(v);
  if (typeof v === 'boolean') return v ? 'TRUE' : 'FALSE';
  return `'${String(v).replace(/'/g, "''")}'`;
};
const J = (v) => (v === null || v === undefined ? 'NULL' : `'${JSON.stringify(v).replace(/'/g, "''")}'::jsonb`);

// ---------- HOUSES ----------
const houses = [
  // Designer / niche originals
  { slug: 'creed', name: 'Creed', country: 'France', region: 'Paris', type: 'niche', site: 'https://www.creedfragrances.com', founded: 1760, trust: 5, desc: 'Legendary niche house famed for Aventus — the most-searched luxury perfume in India.' },
  { slug: 'dior', name: 'Dior', country: 'France', region: 'Paris', type: 'designer', site: 'https://www.dior.com', founded: 1947, trust: 5, desc: 'French luxury house behind Sauvage, the modern fresh-spicy icon.' },
  { slug: 'giorgio-armani', name: 'Giorgio Armani', country: 'Italy', region: 'Milan', type: 'designer', site: 'https://www.armani.com', founded: 1975, trust: 5, desc: 'Italian designer house; Stronger With You and Acqua di Gio are Indian bestsellers.' },
  { slug: 'tom-ford', name: 'Tom Ford', country: 'USA', region: 'New York', type: 'designer', site: 'https://www.tomford.com', founded: 2005, trust: 5, desc: 'American luxury house known for bold orientals like Tobacco Vanille and Oud Wood.' },
  { slug: 'amouage', name: 'Amouage', country: 'Oman', region: 'Muscat', type: 'niche', site: 'https://www.amouage.com', founded: 1983, trust: 5, desc: 'Omani niche royalty — Interlude Man is a cult powerhouse in India.' },
  { slug: 'chanel', name: 'Chanel', country: 'France', region: 'Paris', type: 'designer', site: 'https://www.chanel.com', founded: 1910, trust: 5, desc: 'Timeless French house; Bleu de Chanel is the definitive office-luxury scent.' },
  { slug: 'yves-saint-laurent', name: 'Yves Saint Laurent', country: 'France', region: 'Paris', type: 'designer', site: 'https://www.ysl.com', founded: 1961, trust: 5, desc: 'French designer house behind the sweet-fresh Y Eau de Parfum.' },
  { slug: 'paco-rabanne', name: 'Paco Rabanne', country: 'France', region: 'Paris', type: 'designer', site: 'https://www.pacorabanne.com', founded: 1966, trust: 5, desc: 'Spanish-born French house of 1 Million and Invictus fame.' },
  { slug: 'versace', name: 'Versace', country: 'Italy', region: 'Milan', type: 'designer', site: 'https://www.versace.com', founded: 1978, trust: 5, desc: 'Italian glamour house; Eros and Dylan Blue dominate party wear.' },
  { slug: 'carolina-herrera', name: 'Carolina Herrera', country: 'USA', region: 'New York', type: 'designer', site: 'https://www.carolinaherrera.com', founded: 1980, trust: 5, desc: 'American house behind the sweet-spicy Bad Boy.' },
  { slug: 'jean-paul-gaultier', name: 'Jean Paul Gaultier', country: 'France', region: 'Paris', type: 'designer', site: 'https://www.jeanpaulgaultier.com', founded: 1976, trust: 5, desc: 'Avant-garde French house; Le Male Le Parfum is a winter favourite.' },
  { slug: 'maison-francis-kurkdjian', name: 'Maison Francis Kurkdjian', country: 'France', region: 'Paris', type: 'niche', site: 'https://www.franciskurkdjian.com', founded: 2009, trust: 5, desc: 'Francis Kurkdjian\u2019s own house; Baccarat Rouge 540 is the most-cloned scent on earth.' },
  { slug: 'initio', name: 'Initio Parfums Privés', country: 'France', region: 'Paris', type: 'niche', site: 'https://www.initio-parfums.com', founded: 2015, trust: 5, desc: 'Niche house of functional fragrances; Oud for Greatness is a beast-mode icon.' },
  { slug: 'xerjoff', name: 'Xerjoff', country: 'Italy', region: 'Turin', type: 'niche', site: 'https://www.xerjoff.com', founded: 2003, trust: 5, desc: 'Italian luxury niche; Naxos and Alexandria II are dupe-house favourites.' },
  { slug: 'parfums-de-marly', name: 'Parfums de Marly', country: 'France', region: 'Paris', type: 'niche', site: 'https://www.parfumsdemarly.com', founded: 2009, trust: 5, desc: 'Equestrian-inspired niche house; Layton and Pegasus lead the line-up.' },
  { slug: 'nishane', name: 'Nishane', country: 'Turkey', region: 'Istanbul', type: 'niche', site: 'https://www.nishane.com', founded: 2012, trust: 5, desc: 'Istanbul niche house; Hacivat is the pineapple-fresh Aventus rival.' },
  { slug: 'davidoff', name: 'Davidoff', country: 'Switzerland', region: 'Geneva', type: 'designer', site: 'https://www.davidoff.com', founded: 1984, trust: 5, desc: 'Swiss house of the eternal fresh classic Cool Water.' },
  { slug: 'dolce-gabbana', name: 'Dolce & Gabbana', country: 'Italy', region: 'Milan', type: 'designer', site: 'https://www.dolcegabbana.com', founded: 1985, trust: 5, desc: 'Italian house behind the citrus-floral Light Blue.' },
  { slug: 'azzaro', name: 'Azzaro', country: 'France', region: 'Paris', type: 'designer', site: 'https://www.azzaro.com', founded: 1967, trust: 5, desc: 'French house of The Most Wanted — sweet, spicy, seductive.' },
  { slug: 'clive-christian', name: 'Clive Christian', country: 'United Kingdom', region: 'London', type: 'niche', site: 'https://www.clivechristian.com', founded: 1999, trust: 5, desc: 'British ultra-luxury house; X for Men is old-money in a bottle.' },
  { slug: 'louis-vuitton', name: 'Louis Vuitton', country: 'France', region: 'Paris', type: 'designer', site: 'https://www.louisvuitton.com', founded: 1854, trust: 5, desc: 'French maison; Ombre Nomade and Afternoon Swim are niche-grade hits.' },
  { slug: 'mancera', name: 'Mancera', country: 'France', region: 'Paris', type: 'niche', site: 'https://www.mancera-parfums.com', founded: 2008, trust: 5, desc: 'Montale\u2019s sister house; Cedrat Boise is the citrus-oud benchmark.' },

  // Middle Eastern brands popular in India
  { slug: 'lattafa', name: 'Lattafa Perfumes', country: 'UAE', region: 'Dubai', type: 'middle_eastern', site: 'https://www.lattafa.com', founded: 2003, trust: 4, desc: 'Dubai powerhouse — Khamrah and Asad are India\u2019s favourite affordable luxuries.' },
  { slug: 'armaf', name: 'Armaf', country: 'UAE', region: 'Dubai', type: 'middle_eastern', site: 'https://www.armaf.com', founded: 2010, trust: 4, desc: 'UAE house famous for Club de Nuit Intense Man, the Aventus legend.' },
  { slug: 'rasasi', name: 'Rasasi', country: 'UAE', region: 'Dubai', type: 'middle_eastern', site: 'https://www.rasasi.com', founded: 1979, trust: 4, desc: 'Heritage Emirati house; Hawas is the fresh-aquatic king of Indian summers.' },
  { slug: 'afnan', name: 'Afnan', country: 'UAE', region: 'Sharjah', type: 'middle_eastern', site: 'https://www.afnan.com', founded: 2007, trust: 4, desc: 'Sharjah house; 9PM is the beloved sweet night-out scent.' },
  { slug: 'al-haramain', name: 'Al Haramain', country: 'UAE', region: 'Dubai', type: 'middle_eastern', site: 'https://www.alharamainperfumes.com', founded: 1970, trust: 4, desc: 'Pioneering Arabian house; Amber Oud is a BR540-adjacent favourite.' },
  { slug: 'ajmal', name: 'Ajmal Perfumes', country: 'UAE', region: 'Dubai', type: 'middle_eastern', site: 'https://www.ajmal.com', founded: 1951, trust: 5, desc: 'Seven-decade Arabian institution with a respected traditional attar line.' },

  // REAL Indian clone houses (researched Sept 2026)
  { slug: 'house-of-em5', name: 'House of EM5', country: 'India', region: 'Mumbai, Maharashtra', type: 'indian_clone', site: 'https://www.flipkart.com', founded: 2019, trust: 4, desc: 'Mumbai-based clone house selling on Flipkart and Amazon. Famous for 1:1-style EDPs around \u20B9499 for 50ml — BR 540, Cool Water and Hawas interpretations are bestsellers.' },
  { slug: 'my-perfume-secrets', name: 'My Perfume Secrets', country: 'India', region: 'Mumbai, Maharashtra', type: 'indian_clone', site: 'https://myperfumesecrets.com', founded: 2021, trust: 4, desc: 'Mumbai niche-clone house (myperfumesecrets.com) bottling extrait de parfum at 25%+ oil concentration, 8ml from \u20B9190. Publishes its own \u201Caccuracy %\u201D claims per scent — Scentiqa lab-tests those claims independently.' },
  { slug: 'dupify', name: 'Dupify', country: 'India', region: null, type: 'indian_clone', site: 'https://dupify.in', founded: 2023, trust: 3, desc: 'Budget clone label (dupify.in) pricing \u20B9249\u2013\u20B9649 and claiming 93\u201396% similarity to originals. Scentiqa\u2019s lab scores below are our independent measurements, not the house\u2019s claims.' },
  { slug: 'rzler', name: 'RZLER', country: 'India', region: null, type: 'indian_clone', site: null, founded: 2023, trust: 3, desc: 'Indian dupe house with a premium-minimal identity; covers Naxos, Ombre Nomade and Hawas territory.' },
  { slug: 'arabian-aroma', name: 'Arabian Aroma', country: 'India', region: 'Kanpur, Uttar Pradesh', type: 'indian_clone', site: null, founded: 2020, trust: 4, desc: 'Kanpur house that reportedly sold ~500,000 bottles in 2024. Sells 50ml at \u20B9600\u2013700 and has moved into original creations like Seduction, now its bestseller.' },
  { slug: 'eau-de-zidaan', name: 'Eau de Zidaan', country: 'India', region: 'Mumbai, Maharashtra', type: 'indian_clone', site: null, founded: 2023, trust: 3, desc: 'Mumbai artisan house founded by perfumer Zaid; reportedly 20,000+ bottles sold since launch. Details to be verified.', verify: true },
  { slug: 'xlnc-perfumery', name: 'XLNC Perfumery', country: 'India', region: 'Gujarat', type: 'indian_clone', site: null, founded: 2022, trust: 3, desc: 'Gujarat clone house known for recreating global luxury fragrances. Details to be verified.', verify: true },
  { slug: 'celestial-perfume', name: 'Celestial Perfume', country: 'India', region: 'Gujarat', type: 'indian_clone', site: null, founded: 2022, trust: 3, desc: 'Gujarat house recreating designer scents at Indian prices. Details to be verified.', verify: true },
  { slug: 'purenso-select', name: 'Purenso Select', country: 'India', region: null, type: 'indian_clone', site: 'https://purensoselect.in', founded: 2021, trust: 3, desc: 'Designer-inspired fragrance OILS (not sprays) at \u20B9225\u2013\u20B9275. Oil format — performance notes in our tests reflect oil wear, not spray.' },
  { slug: 'naso-profumi', name: 'Naso Profumi', country: 'India', region: null, type: 'indian_clone', site: null, founded: 2022, trust: 3, desc: 'Indian indie house popular with beginner collectors. Details to be verified.', verify: true },
  { slug: 'the-inkpot-perfumes', name: 'The Inkpot Perfumes', country: 'India', region: null, type: 'indian_clone', site: null, founded: 2022, trust: 3, desc: 'Indian indie perfumery. Details to be verified.', verify: true },
  { slug: 'ababel-perfumes', name: 'Ababel Perfumes', country: 'India', region: null, type: 'indian_clone', site: null, founded: 2021, trust: 3, desc: 'Indian house with a growing community following. Details to be verified.', verify: true },
  { slug: 'aroma-artisans', name: 'Aroma Artisans', country: 'India', region: null, type: 'indian_clone', site: null, founded: 2022, trust: 3, desc: 'Indian artisan house. Details to be verified.', verify: true },
  { slug: 'qinaam-perfumes', name: 'Qinaam Perfumes', country: 'India', region: null, type: 'indian_clone', site: null, founded: 2021, trust: 3, desc: 'Indian house. Details to be verified.', verify: true },

  // REAL attar houses (Kannauj / Lucknow heritage, researched Sept 2026)
  { slug: 'sugandhco', name: 'Sugandhco', country: 'India', region: 'Lucknow, Uttar Pradesh', type: 'attar_maker', site: null, founded: 1920, trust: 5, desc: 'Heritage Lucknow house crafting attars by traditional distillation for over a century.' },
  { slug: 'gulab-singh-johrimal', name: 'Gulab Singh Johrimal', country: 'India', region: 'Delhi', type: 'attar_maker', site: null, founded: 1816, trust: 5, desc: 'Two-century-old heritage house famed for Shamama and high-grade Oudh.' },
  { slug: 'boond-fragrances', name: 'Boond Fragrances', country: 'India', region: 'Kannauj, Uttar Pradesh', type: 'attar_maker', site: null, founded: 2019, trust: 4, desc: 'Kannauj house using the centuries-old Deg-Bhapka copper-vessel method; known for Maati (mitti) — the petrichor attar of baked earth after first rain. Sells across India via Amazon.' },
  { slug: 'asam-co', name: 'Asam & Co Perfumers', country: 'India', region: 'Kannauj, Uttar Pradesh', type: 'attar_maker', site: null, founded: 1911, trust: 5, desc: '114-year-old Kannauj perfumers, specialists in Shamama attar.' },
  { slug: 'lala-kedarnath', name: 'Lala Kedarnath Khattri & Sons', country: 'India', region: 'Kannauj, Uttar Pradesh', type: 'attar_maker', site: null, founded: 1910, trust: 5, desc: '115-year-old Kannauj house — among the oldest attar makers in India.' },
  { slug: 'arun-mradul', name: 'ARUN Mradul Perfumers', country: 'India', region: 'Kannauj, Uttar Pradesh', type: 'attar_maker', site: null, founded: 1974, trust: 4, desc: '51-year-old Kannauj perfumers working in traditional attar and natural oils.' },
  { slug: 'gauri-sugandh', name: 'Gauri Sugandh', country: 'India', region: 'Kannauj, Uttar Pradesh', type: 'attar_maker', site: null, founded: 1980, trust: 4, desc: '45-year-old Kannauj house producing attars and natural perfumery oils.' },
  { slug: 'pooja-perfumery', name: 'Pooja Perfumery & Exports', country: 'India', region: 'Kannauj, Uttar Pradesh', type: 'attar_maker', site: null, founded: 1971, trust: 4, desc: '54-year-old Kannauj manufacturer and exporter of attars and fragrances.' },
];

// ---------- NOTES (13 categories) ----------
const notes = [
  ['Bergamot', 'citrus', 'Bright, sparkling citrus; the classic fresh opener.'],
  ['Lemon', 'citrus', 'Sharp, zesty, instantly refreshing.'],
  ['Pineapple', 'citrus', 'Juicy tropical sweetness; the Aventus signature.'],
  ['Blackcurrant', 'citrus', 'Tart green-fruity bite with a smoky edge.'],
  ['Neroli', 'citrus', 'Orange-blossom brightness, clean and green.'],
  ['Grapefruit', 'citrus', 'Bitter-sparkling citrus lift.'],
  ['Jasmine', 'floral', 'Rich, indolic white floral; warm and narcotic.'],
  ['Rose', 'floral', 'The queen of florals — from dewy to dark and jammy.'],
  ['Tuberose', 'white_floral', 'Creamy, heady, powerful white floral.'],
  ['Orange Blossom', 'white_floral', 'Honeyed white floral with green freshness.'],
  ['Lavender', 'floral', 'Clean aromatic floral; the barbershop classic.'],
  ['Iris', 'floral', 'Powdery, buttery, elegant cold floral.'],
  ['Sandalwood', 'woody', 'Creamy, milky sacred wood; India\u2019s signature.'],
  ['Cedar', 'woody', 'Dry, pencil-shaving woodiness.'],
  ['Vetiver', 'woody', 'Smoky-green grass root; earthy and cooling.'],
  ['Oud (Agarwood)', 'woody', 'Resinous, animalic, precious dark wood.'],
  ['Birch', 'woody', 'Smoky leather-wood; the Aventus backbone.'],
  ['Patchouli', 'woody', 'Earthy, dark, chocolatey green depth.'],
  ['Amber', 'oriental', 'Warm resinous glow; sweet without sugar.'],
  ['Vanilla', 'oriental', 'Creamy sweet warmth; the comfort note.'],
  ['Tonka Bean', 'oriental', 'Almond-hay sweetness with depth.'],
  ['Benzoin', 'oriental', 'Balsamic vanilla-resin warmth.'],
  ['Cinnamon', 'oriental', 'Hot sweet spice.'],
  ['Cardamom', 'oriental', 'Cool, aromatic, slightly smoky spice.'],
  ['Saffron', 'oriental', 'Leathery, metallic, radiant spice — the BR540 spark.'],
  ['Musk', 'musk', 'Clean skin-like softness; the invisible hug.'],
  ['Ambroxan', 'musk', 'Salty-ambery modern musk; radiant and mineral.'],
  ['Tobacco', 'gourmand', 'Honeyed dried-leaf richness.'],
  ['Honey', 'gourmand', 'Golden animalic sweetness.'],
  ['Coffee', 'gourmand', 'Dark roasted depth.'],
  ['Chocolate', 'gourmand', 'Cocoa warmth.'],
  ['Green Tea', 'green', 'Fresh, dewy, slightly bitter calm.'],
  ['Galbanum', 'green', 'Intensely green, stemmy bite.'],
  ['Sea Notes', 'aquatic', 'Salty ozonic freshness.'],
  ['Calone', 'aquatic', 'Melony marine freshness of the 90s.'],
  ['Pink Pepper', 'spicy', 'Sparkling rosy spice lift.'],
  ['Black Pepper', 'spicy', 'Dry crackling heat.'],
  ['Nutmeg', 'spicy', 'Warm aromatic spice.'],
  ['Leather', 'leather', 'Smoky animalic hide — from suede to saddle.'],
  ['Suede', 'leather', 'Soft powdery leather.'],
  ['Oakmoss', 'chypre', 'Bitter green forest-floor depth.'],
  ['Labdanum', 'chypre', 'Ambery-leathery resin.'],
  ['Rosemary', 'fougere', 'Herbaceous aromatic lift.'],
  ['Geranium', 'fougere', 'Green-rosy aromatic floral.'],
  ['Coumarin', 'fougere', 'Sweet hay-like foug\u00E8re backbone.'],
];

// ---------- ORIGINALS (30) ----------
// [name, houseSlug, gender, year, concentration, top[], heart[], base[], accords[[name,strength]], ratingAvg, ratingCount, description]
const originals = [
  ['Aventus', 'creed', 'men', 2010, 'edp',
    ['Pineapple', 'Blackcurrant', 'Bergamot'], ['Birch', 'Patchouli', 'Jasmine'], ['Musk', 'Oakmoss', 'Vanilla'],
    [['Fruity', 90], ['Smoky', 80], ['Woody', 75], ['Musky', 60]], 4.7, 18240,
    'The king of niche. Smoky pineapple and birch over a musky base — the most complimented and most cloned masculine scent in India.'],
  ['Sauvage Eau de Toilette', 'dior', 'men', 2015, 'edt',
    ['Bergamot', 'Pink Pepper'], ['Lavender', 'Nutmeg', 'Geranium'], ['Ambroxan', 'Cedar'],
    [['Fresh Spicy', 85], ['Aromatic', 75], ['Ambery', 70]], 4.4, 21480,
    'The modern fresh-spicy icon. Bergamot and pepper over ambroxan — loud, radiant, and everywhere, which is exactly why India hunts its dupes.'],
  ['Sauvage Elixir', 'dior', 'men', 2021, 'extrait',
    ['Grapefruit', 'Nutmeg', 'Cardamom'], ['Lavender'], ['Ambroxan', 'Licorice', 'Amber'],
    [['Spicy', 90], ['Fresh', 70], ['Ambery', 85]], 4.6, 8930,
    'Sauvage turned up to eleven — a dense spicy elixir with a famous licorice twist. Beast-mode performance, premium price.'],
  ['Stronger With You Intensely', 'giorgio-armani', 'men', 2019, 'edp',
    ['Pink Pepper', 'Juniper'], ['Lavender', 'Sage'], ['Vanilla', 'Tonka Bean', 'Amber'],
    [['Warm Spicy', 85], ['Vanilla', 90], ['Ambery', 80]], 4.6, 12870,
    'Molten vanilla-spice hug. Sweet, warm and effortlessly attractive — a date-night staple across Indian metros.'],
  ['Acqua di Gio', 'giorgio-armani', 'men', 1996, 'edt',
    ['Lemon', 'Bergamot', 'Neroli'], ['Sea Notes', 'Rosemary'], ['Musk', 'Cedar'],
    [['Aquatic', 90], ['Citrus', 85], ['Aromatic', 60]], 4.3, 19540,
    'The original aquatic. Mediterranean citrus and sea notes — the safe fresh scent a generation of Indian men grew up on.'],
  ['Tobacco Vanille', 'tom-ford', 'unisex', 2007, 'edp',
    ['Tobacco', 'Spices'], ['Vanilla', 'Tonka Bean', 'Cocoa'], ['Dried Fruits', 'Woody Notes'],
    [['Tobacco', 95], ['Vanilla', 90], ['Warm Spicy', 85]], 4.7, 11230,
    'The cozy icon. Honeyed pipe tobacco drowned in vanilla and dried fruits — winter in a bottle, and a dupe-house rite of passage.'],
  ['Oud Wood', 'tom-ford', 'unisex', 2007, 'edp',
    ['Cardamom'], ['Oud (Agarwood)', 'Sandalwood'], ['Amber', 'Tonka Bean'],
    [['Woody', 90], ['Warm Spicy', 70], ['Powdery', 60]], 4.5, 9870,
    'Oud for people who fear oud — smooth sandalwood and cardamom around a polite agarwood core. Understated luxury.'],
  ['Interlude Man', 'amouage', 'men', 2012, 'edp',
    ['Bergamot', 'Oregano'], ['Oud (Agarwood)', 'Frankincense', 'Leather'], ['Sandalwood', 'Amber'],
    [['Smoky', 95], ['Incense', 90], ['Leathery', 80]], 4.6, 7640,
    'Controlled chaos — smoky incense, oregano and leather in a blue-bottle storm. The connoisseur\u2019s powerhouse.'],
  ['Reflection Man', 'amouage', 'men', 2007, 'edp',
    ['Pink Pepper', 'Bergamot'], ['Neroli', 'Jasmine'], ['Cedar', 'Sandalwood'],
    [['Floral', 80], ['Woody', 75], ['Fresh', 70]], 4.5, 6210,
    'Sunshine in a flacon — sparkling florals over creamy woods. Effortless elegance, terrible value debates aside.'],
  ['Bleu de Chanel Parfum', 'chanel', 'men', 2018, 'parfum',
    ['Lemon', 'Bergamot', 'Pink Pepper'], ['Grapefruit', 'Nutmeg', 'Ginger'], ['Sandalwood', 'Cedar', 'Amber'],
    [['Woody', 85], ['Citrus', 80], ['Aromatic', 70]], 4.7, 13450,
    'The classy gentleman, perfected. Citrus-woods of extraordinary polish — the office-luxury benchmark India clones relentlessly.'],
  ['Allure Homme Sport Eau Extreme', 'chanel', 'men', 2012, 'edp',
    ['Mandarin', 'Mint'], ['Cypress', 'Sage'], ['Tonka Bean', 'Musk', 'Cedar'],
    [['Fresh', 85], ['Aromatic', 75], ['Sweet', 65]], 4.4, 8760,
    'Sporty freshness with a sweet tonka backbone — the gym-to-office crossover India loves.'],
  ['Y Eau de Parfum', 'yves-saint-laurent', 'men', 2018, 'edp',
    ['Bergamot', 'Ginger'], ['Sage', 'Juniper'], ['Cedar', 'Musk'],
    [['Fresh', 80], ['Aromatic', 75], ['Sweet', 60]], 4.3, 10230,
    'Blue-juice freshness with a sweet aromatic core — the modern crowd-pleaser.'],
  ['1 Million', 'paco-rabanne', 'men', 2008, 'edt',
    ['Grapefruit', 'Mint'], ['Cinnamon', 'Rose', 'Spices'], ['Leather', 'Amber', 'Blond Wood'],
    [['Warm Spicy', 90], ['Sweet', 80], ['Leathery', 65]], 4.2, 18760,
    'The gold-bar party bomb. Cinnamon, leather and amber turned to maximum — India\u2019s wedding-season weapon.'],
  ['Invictus', 'paco-rabanne', 'men', 2013, 'edt',
    ['Sea Notes', 'Grapefruit'], ['Bay Leaf', 'Jasmine'], ['Ambergris', 'Guaiac Wood'],
    [['Aquatic', 90], ['Fresh', 85], ['Woody', 60]], 4.1, 15430,
    'The aquatic trophy. Marine freshness with a woody-amber drydown — sporty, loud, youthful.'],
  ['Eros', 'versace', 'men', 2012, 'edt',
    ['Mint', 'Green Apple'], ['Tonka Bean', 'Geranium'], ['Vanilla', 'Vetiver', 'Oakmoss'],
    [['Fresh', 80], ['Sweet', 85], ['Aromatic', 70]], 4.3, 16980,
    'Mint-apple freshness melting into vanilla-tonka sweetness. The club scent of a generation.'],
  ['Dylan Blue', 'versace', 'men', 2016, 'edt',
    ['Bergamot', 'Grapefruit'], ['Black Pepper', 'Papyrus'], ['Musk', 'Tonka Bean', 'Saffron'],
    [['Aromatic', 80], ['Citrus', 75], ['Musky', 70]], 4.2, 11240,
    'Mediterranean aromatic freshness with a peppery bite — versatile and modern.'],
  ['Bad Boy', 'carolina-herrera', 'men', 2019, 'edt',
    ['Black Pepper', 'Bergamot'], ['Cedar', 'Sage'], ['Tonka Bean', 'Cacao'],
    [['Warm Spicy', 85], ['Sweet', 75], ['Woody', 70]], 4.2, 7650,
    'Sweet-spicy duality in a lightning-bolt bottle. Cocoa-tonka warmth with peppery crackle.'],
  ['Le Male Le Parfum', 'jean-paul-gaultier', 'men', 2020, 'edp',
    ['Cardamom'], ['Lavender', 'Iris'], ['Vanilla', 'Woody Notes'],
    [['Powdery', 85], ['Vanilla', 80], ['Aromatic', 75]], 4.5, 8940,
    'The sailor, dressed for winter. Powdery iris-lavender over deep vanilla — the definitive cold-weather designer.'],
  ['Baccarat Rouge 540', 'maison-francis-kurkdjian', 'unisex', 2015, 'edp',
    ['Saffron', 'Jasmine'], ['Amberwood', 'Ambergris'], ['Fir Resin', 'Cedar'],
    [['Ambery', 95], ['Warm Spicy', 85], ['Woody', 80]], 4.6, 14780,
    'The crystal-amber phenomenon. Saffron and amberwood in radiant, airy sweetness — the most cloned fragrance on the planet.'],
  ['Oud for Greatness', 'initio', 'unisex', 2018, 'edp',
    ['Saffron', 'Nutmeg'], ['Oud (Agarwood)', 'Lavender'], ['Musk', 'Amber', 'Patchouli'],
    [['Woody', 90], ['Spicy', 85], ['Musky', 75]], 4.6, 6890,
    'Saffron-oud-musky power with Initio\u2019s \u201Cfunctional\u201D aura. Nuclear performance, unapologetic presence.'],
  ['Naxos', 'xerjoff', 'unisex', 2015, 'edp',
    ['Bergamot', 'Lemon'], ['Honey', 'Cinnamon', 'Tobacco'], ['Tonka Bean', 'Vanilla', 'Cashmeran'],
    [['Tobacco', 90], ['Sweet', 95], ['Warm Spicy', 85]], 4.8, 5430,
    'Sicilian honey-tobacco bliss. Sweet, rich and impossibly smooth — the gourmand that launched a thousand clones.'],
  ['Alexandria II', 'xerjoff', 'unisex', 2012, 'edp',
    ['Apple', 'Cinnamon'], ['Rose', 'Lavender'], ['Oud (Agarwood)', 'Amber', 'Musk'],
    [['Woody', 85], ['Floral', 70], ['Fruity', 75]], 4.5, 4320,
    'Fruity-oud opulence — apple and rose over precious woods. Regal and long-lived.'],
  ['Layton', 'parfums-de-marly', 'unisex', 2016, 'edp',
    ['Apple', 'Bergamot'], ['Lavender', 'Geranium'], ['Vanilla', 'Cardamom', 'Guaiac Wood'],
    [['Floral', 80], ['Sweet', 75], ['Woody', 70]], 4.6, 9120,
    'Apple-lavender-vanilla elegance. The refined sweet-fresh niche that never shouts.'],
  ['Pegasus', 'parfums-de-marly', 'men', 2011, 'edp',
    ['Bergamot', 'Heliotrope'], ['Lavender', 'Bitter Almond'], ['Vanilla', 'Sandalwood'],
    [['Powdery', 90], ['Sweet', 80], ['Almond', 85]], 4.4, 6780,
    'Almond-powder sophistication. Heliotrope and bitter almond in a cloud of vanilla — distinctive and debonair.'],
  ['Hacivat', 'nishane', 'unisex', 2017, 'extrait',
    ['Pineapple', 'Bergamot'], ['Cedar', 'Jasmine'], ['Oakmoss', 'Woody Notes'],
    [['Fruity', 85], ['Woody', 80], ['Green', 70]], 4.6, 5870,
    'The pineapple-fresh Aventus rival from Istanbul. Brighter, greener, and a performance monster in heat.'],
  ['Cool Water', 'davidoff', 'men', 1988, 'edt',
    ['Sea Notes', 'Mint', 'Green Notes'], ['Lavender', 'Coriander'], ['Musk', 'Cedar', 'Amber'],
    [['Aquatic', 95], ['Green', 75], ['Aromatic', 70]], 4.2, 17340,
    'The original marine fresh. Calone-driven ocean breeze that defined 90s freshness and still sells in every Indian city.'],
  ['Light Blue', 'dolce-gabbana', 'women', 2001, 'edt',
    ['Lemon', 'Apple'], ['Bamboo', 'Jasmine'], ['Cedar', 'Musk', 'Amber'],
    [['Citrus', 90], ['Fresh', 85], ['Floral', 60]], 4.3, 12980,
    'Sicilian citrus-floral crispness. The definitive fresh women\u2019s summer scent — endlessly cloned.'],
  ['The Most Wanted', 'azzaro', 'men', 2021, 'edp',
    ['Red Ginger'], ['Juniper'], ['Toffee', 'Bourbon Vanilla'],
    [['Sweet', 90], ['Warm Spicy', 85], ['Gourmand', 80]], 4.4, 6540,
    'Toffee-ginger seduction. Sweet, warm and dangerously wearable — the modern gourmand-spicy hit.'],
  ['X for Men', 'clive-christian', 'men', 2001, 'edp',
    ['Cardamom', 'Bergamot'], ['Orris', 'Papyrus'], ['Vetiver', 'Amber'],
    [['Woody', 85], ['Spicy', 80], ['Powdery', 75]], 4.5, 2340,
    'Old money in a bottle. Cardamom and orris over vetiver — quiet, crisp, impossibly refined British luxury.'],
  ['Ombre Nomade', 'louis-vuitton', 'unisex', 2018, 'edp',
    ['Raspberry'], ['Oud (Agarwood)', 'Birch'], ['Amber', 'Incense'],
    [['Smoky', 90], ['Fruity', 75], ['Resinous', 85]], 4.7, 4760,
    'Raspberry-oud smoke drifting over desert incense. LV\u2019s masterpiece of dark rosewood luxury.'],
  ['Cedrat Boise', 'mancera', 'unisex', 2011, 'edp',
    ['Lemon', 'Blackcurrant'], ['Jasmine', 'Patchouli'], ['Cedar', 'Sandalwood', 'Leather'],
    [['Citrus', 85], ['Fruity', 80], ['Woody', 85]], 4.5, 8230,
    'The citrus-oud benchmark. Sparkling lemon-blackcurrant over creamy sandalwood — a fruity-woody legend.'],
  // Middle Eastern bestsellers (also "originals" for dupe mapping)
  ['Khamrah', 'lattafa', 'unisex', 2022, 'edp',
    ['Cinnamon', 'Nutmeg', 'Bergamot'], ['Dates', 'Praline', 'Tuberose'], ['Vanilla', 'Tonka Bean', 'Myrrh'],
    [['Gourmand', 95], ['Warm Spicy', 90], ['Sweet', 90]], 4.6, 16780,
    'The viral gourmand. Spiced dates and praline in a boozy-sweet embrace — India\u2019s favourite affordable luxury.'],
  ['Asad', 'lattafa', 'men', 2021, 'edp',
    ['Black Pepper', 'Tobacco'], ['Coffee'], ['Vanilla', 'Amber', 'Iris'],
    [['Warm Spicy', 90], ['Sweet', 80], ['Tobacco', 75]], 4.5, 14320,
    'The Dior Sauvage Elixir rival from Dubai. Peppery tobacco-coffee darkness at a fraction of the price.'],
  ['Club de Nuit Intense Man', 'armaf', 'men', 2015, 'edt',
    ['Lemon', 'Blackcurrant', 'Apple'], ['Birch', 'Jasmine', 'Rose'], ['Musk', 'Ambroxan', 'Vanilla'],
    [['Fruity', 85], ['Smoky', 80], ['Musky', 75]], 4.4, 18940,
    'The Aventus legend. Smoky birch-pineapple at drugstore money — the dupe that started a movement.'],
  ['Hawas for Him', 'rasasi', 'men', 2015, 'edp',
    ['Bergamot', 'Lemon'], ['Orange Blossom', 'Plum'], ['Musk', 'Ambergris'],
    [['Aquatic', 90], ['Citrus', 85], ['Sweet', 70]], 4.5, 13450,
    'The fresh-aquatic king of Indian summers. Citrus-plum sparkle over salty musk — endlessly complimented.'],
  ['La Yuqawam', 'rasasi', 'men', 2012, 'edp',
    ['Raspberry', 'Saffron'], ['Oud (Agarwood)', 'Leather'], ['Amber', 'Musk'],
    [['Leathery', 90], ['Fruity', 80], ['Smoky', 85]], 4.4, 5670,
    'Raspberry-oud leather opulence. Dark, rich, unapologetically Middle Eastern.'],
  ['9PM', 'afnan', 'men', 2020, 'edp',
    ['Bergamot', 'Cinnamon'], ['Orange Blossom', 'Lavender'], ['Vanilla', 'Tonka Bean', 'Amber'],
    [['Sweet', 90], ['Warm Spicy', 80], ['Floral', 65]], 4.4, 11230,
    'The sweet night-out champion. Cinnamon-apple blossom melting into vanilla — unbeatable at the price.'],
  ['Amber Oud', 'al-haramain', 'unisex', 2018, 'edp',
    ['Bergamot'], ['Amber', 'Melon'], ['Musk', 'Vanilla', 'Woody Notes'],
    [['Ambery', 90], ['Fruity', 75], ['Musky', 80]], 4.3, 7890,
    'The BR540-adjacent amber. Melon-amber sweetness with serious presence — a dupe-culture staple.'],
];

// ---------- INDIAN CLONE-HOUSE PRODUCTS ----------
// [houseSlug, name, gender, year, conc, inspiredBy, claimedAcc, priceINR, sizeMl, ratingAvg, ratingCount, top[], heart[], base[], accords]
const cloneProducts = [
  // House of EM5
  ['house-of-em5', 'EM5 BR 540', 'unisex', 2022, 'edp', 'Baccarat Rouge 540', null, 499, 50, 4.3, 2310,
    ['Saffron', 'Jasmine'], ['Amberwood', 'Ambergris'], ['Fir Resin', 'Cedar'],
    [['Ambery', 90], ['Warm Spicy', 80], ['Woody', 75]]],
  ['house-of-em5', 'EM5 Aqua', 'men', 2021, 'edp', 'Cool Water', null, 499, 50, 4.1, 1870,
    ['Sea Notes', 'Mint'], ['Lavender', 'Coriander'], ['Musk', 'Cedar'],
    [['Aquatic', 90], ['Green', 70], ['Fresh', 80]]],
  ['house-of-em5', 'EM5 Antonia', 'men', 2022, 'edp', 'X for Men', null, 549, 50, 4.2, 940,
    ['Cardamom', 'Bergamot'], ['Orris', 'Papyrus'], ['Vetiver', 'Amber'],
    [['Woody', 80], ['Spicy', 75], ['Powdery', 70]]],
  ['house-of-em5', 'EM5 Most Wanted', 'men', 2023, 'edp', 'The Most Wanted', null, 499, 50, 4.2, 1120,
    ['Red Ginger'], ['Juniper'], ['Toffee', 'Bourbon Vanilla'],
    [['Sweet', 85], ['Warm Spicy', 80], ['Gourmand', 75]]],
  ['house-of-em5', 'EM5 Ocean Breeze', 'men', 2023, 'edp', 'Hawas for Him', null, 499, 50, 4.3, 1450,
    ['Bergamot', 'Lemon'], ['Orange Blossom', 'Plum'], ['Musk', 'Ambergris'],
    [['Aquatic', 88], ['Citrus', 82], ['Fresh', 80]]],
  ['house-of-em5', 'EM5 One', 'unisex', 2022, 'edp', 'Light Blue', null, 499, 50, 4.0, 890,
    ['Lemon', 'Apple'], ['Bamboo', 'Jasmine'], ['Cedar', 'Musk'],
    [['Citrus', 85], ['Fresh', 80], ['Floral', 55]]],

  // My Perfume Secrets
  ['my-perfume-secrets', 'MPS Bleu De Chanel', 'men', 2022, 'extrait', 'Bleu de Chanel Parfum', '82%', 190, 8, 4.4, 760,
    ['Lemon', 'Bergamot', 'Pink Pepper'], ['Grapefruit', 'Nutmeg'], ['Sandalwood', 'Cedar', 'Amber'],
    [['Woody', 82], ['Citrus', 78], ['Aromatic', 68]]],
  ['my-perfume-secrets', 'MPS Sauvage Parfum Edition', 'men', 2022, 'extrait', 'Sauvage Elixir', '80%', 335, 8, 4.3, 690,
    ['Grapefruit', 'Nutmeg'], ['Lavender'], ['Ambroxan', 'Amber'],
    [['Spicy', 85], ['Fresh', 68], ['Ambery', 80]]],
  ['my-perfume-secrets', 'MPS Alexandria II', 'unisex', 2023, 'extrait', 'Alexandria II', '85%', 335, 8, 4.5, 520,
    ['Apple', 'Cinnamon'], ['Rose', 'Lavender'], ['Oud (Agarwood)', 'Amber', 'Musk'],
    [['Woody', 82], ['Fruity', 72], ['Floral', 68]]],
  ['my-perfume-secrets', 'MPS Silver Mountain Water', 'unisex', 2022, 'extrait', null, null, 275, 8, 4.2, 480,
    ['Bergamot', 'Blackcurrant'], ['Green Tea'], ['Musk', 'Sandalwood'],
    [['Fresh', 85], ['Green', 75], ['Musky', 65]]],
  ['my-perfume-secrets', 'MPS Vanilla Diorama', 'unisex', 2023, 'extrait', null, null, 225, 8, 4.4, 410,
    ['Vanilla', 'Rum'], ['Cocoa'], ['Patchouli', 'Musk'],
    [['Gourmand', 90], ['Sweet', 88], ['Vanilla', 95]]],
  ['my-perfume-secrets', 'MPS Ombre Nomade', 'unisex', 2023, 'extrait', 'Ombre Nomade', '84%', 399, 8, 4.5, 620,
    ['Raspberry'], ['Oud (Agarwood)', 'Birch'], ['Amber', 'Incense'],
    [['Smoky', 88], ['Fruity', 72], ['Resinous', 82]]],
  ['my-perfume-secrets', 'MPS Oud Ispahan', 'unisex', 2023, 'extrait', null, null, 399, 8, 4.3, 350,
    ['Saffron', 'Labdanum'], ['Oud (Agarwood)', 'Rose'], ['Sandalwood', 'Patchouli'],
    [['Woody', 88], ['Floral', 65], ['Smoky', 80]]],
  ['my-perfume-secrets', 'MPS Atomic Rose', 'unisex', 2023, 'extrait', null, null, 240, 8, 4.4, 390,
    ['Bergamot', 'Pink Pepper'], ['Rose', 'Jasmine'], ['Vanilla', 'Musk'],
    [['Floral', 88], ['Sweet', 70], ['Musky', 65]]],
  ['my-perfume-secrets', 'MPS Outlands', 'unisex', 2024, 'extrait', null, null, 399, 8, 4.2, 280,
    ['Bergamot', 'Cardamom'], ['Orange Blossom'], ['Benzoin', 'Tonka Bean'],
    [['Warm Spicy', 80], ['Floral', 70], ['Ambery', 78]]],
  ['my-perfume-secrets', 'MPS Beach Hut Man', 'men', 2024, 'extrait', null, null, 335, 8, 4.3, 310,
    ['Mint', 'Orange Blossom'], ['Ivy'], ['Musk', 'Vetiver'],
    [['Green', 85], ['Fresh', 88], ['Aromatic', 70]]],
  ['my-perfume-secrets', 'MPS Naxos 2020', 'unisex', 2023, 'extrait', 'Naxos', '86%', 335, 8, 4.6, 540,
    ['Bergamot', 'Lemon'], ['Honey', 'Cinnamon', 'Tobacco'], ['Tonka Bean', 'Vanilla'],
    [['Tobacco', 88], ['Sweet', 92], ['Warm Spicy', 82]]],
  ['my-perfume-secrets', 'MPS Nawab of Oudh Intensivo', 'unisex', 2024, 'extrait', null, null, 399, 8, 4.5, 290,
    ['Saffron', 'Cardamom'], ['Oud (Agarwood)', 'Rose'], ['Amber', 'Sandalwood', 'Musk'],
    [['Woody', 90], ['Oriental', 88], ['Smoky', 80]]],

  // Dupify
  ['dupify', 'Dupify Aventus', 'men', 2024, 'edp', 'Aventus', '95%', 599, 50, 4.1, 980,
    ['Pineapple', 'Blackcurrant'], ['Birch', 'Patchouli'], ['Musk', 'Vanilla'],
    [['Fruity', 85], ['Smoky', 75], ['Woody', 70]]],
  ['dupify', 'Dupify Sauvage', 'men', 2024, 'edp', 'Sauvage Eau de Toilette', '94%', 549, 50, 4.0, 870,
    ['Bergamot', 'Pink Pepper'], ['Lavender'], ['Ambroxan', 'Cedar'],
    [['Fresh Spicy', 82], ['Aromatic', 70], ['Ambery', 68]]],
  ['dupify', 'Dupify Bleu', 'men', 2024, 'edp', 'Bleu de Chanel Parfum', '95%', 549, 50, 4.2, 760,
    ['Lemon', 'Bergamot'], ['Grapefruit', 'Nutmeg'], ['Sandalwood', 'Cedar'],
    [['Woody', 80], ['Citrus', 78], ['Aromatic', 65]]],
  ['dupify', 'Dupify Oud Wood', 'unisex', 2024, 'edp', 'Oud Wood', '94%', 649, 50, 4.1, 540,
    ['Cardamom'], ['Oud (Agarwood)', 'Sandalwood'], ['Amber', 'Tonka Bean'],
    [['Woody', 85], ['Warm Spicy', 65], ['Powdery', 55]]],
  ['dupify', 'Dupify Tobacco Vanille', 'unisex', 2024, 'edp', 'Tobacco Vanille', '93%', 649, 50, 4.3, 690,
    ['Tobacco', 'Spices'], ['Vanilla', 'Tonka Bean'], ['Dried Fruits', 'Woody Notes'],
    [['Tobacco', 90], ['Vanilla', 85], ['Warm Spicy', 80]]],
  ['dupify', 'Dupify Asad', 'men', 2024, 'edp', 'Asad', '94%', 549, 50, 4.2, 620,
    ['Black Pepper', 'Tobacco'], ['Coffee'], ['Vanilla', 'Amber'],
    [['Warm Spicy', 85], ['Sweet', 78], ['Tobacco', 70]]],
  ['dupify', 'Dupify Maracuja', 'unisex', 2024, 'edp', 'Cedrat Boise', '93%', 499, 50, 4.0, 480,
    ['Lemon', 'Blackcurrant'], ['Jasmine'], ['Cedar', 'Sandalwood'],
    [['Citrus', 82], ['Fruity', 78], ['Woody', 75]]],

  // RZLER
  ['rzler', 'RZLER Nexorien', 'men', 2024, 'edp', 'Naxos', null, 899, 100, 4.3, 410,
    ['Bergamot', 'Lemon'], ['Honey', 'Cinnamon'], ['Tonka Bean', 'Vanilla'],
    [['Tobacco', 85], ['Sweet', 90], ['Warm Spicy', 80]]],
  ['rzler', 'RZLER Nomade', 'unisex', 2024, 'edp', 'Ombre Nomade', null, 999, 100, 4.2, 380,
    ['Raspberry'], ['Oud (Agarwood)', 'Birch'], ['Amber'],
    [['Smoky', 85], ['Fruity', 70], ['Resinous', 80]]],
  ['rzler', 'RZLER Nautis', 'men', 2024, 'edp', 'Hawas for Him', null, 799, 100, 4.3, 450,
    ['Bergamot', 'Lemon'], ['Orange Blossom', 'Plum'], ['Musk', 'Ambergris'],
    [['Aquatic', 88], ['Citrus', 82], ['Fresh', 78]]],
  ['rzler', 'RZLER Spicy Grove', 'unisex', 2024, 'edp', 'Baccarat Rouge 540', null, 899, 100, 4.1, 360,
    ['Saffron'], ['Amberwood'], ['Fir Resin', 'Cedar'],
    [['Ambery', 88], ['Warm Spicy', 80], ['Woody', 75]]],
  ['rzler', 'RZLER Oud of Gold', 'men', 2024, 'edp', null, null, 999, 100, 4.2, 290,
    ['Saffron', 'Cardamom'], ['Oud (Agarwood)'], ['Amber', 'Musk'],
    [['Woody', 88], ['Oriental', 85], ['Smoky', 78]]],

  // Arabian Aroma
  ['arabian-aroma', 'Arabian Aroma Ombre Leather', 'unisex', 2023, 'edp', null, null, 649, 50, 4.2, 720,
    ['Cardamom'], ['Leather', 'Jasmine'], ['Amber', 'Moss', 'Patchouli'],
    [['Leathery', 88], ['Floral', 60], ['Ambery', 75]]],
  ['arabian-aroma', 'Seduction by Arabian Aroma', 'men', 2024, 'edp', null, null, 699, 50, 4.5, 890,
    ['Bergamot', 'Blackcurrant'], ['Birch', 'Sage'], ['Tonka Bean', 'Amber', 'Musk'],
    [['Fruity', 80], ['Woody', 78], ['Sweet', 75]]],
  ['arabian-aroma', 'Royal Oud by Arabian Aroma', 'unisex', 2024, 'edp', null, null, 699, 50, 4.4, 640,
    ['Saffron', 'Nutmeg'], ['Oud (Agarwood)', 'Rose'], ['Amber', 'Sandalwood'],
    [['Woody', 88], ['Oriental', 85], ['Floral', 60]]],

  // Eau de Zidaan (TO-VERIFY)
  ['eau-de-zidaan', 'Zidaan Noir Oud', 'unisex', 2024, 'edp', null, null, 1299, 50, 4.1, 120,
    ['Bergamot'], ['Oud (Agarwood)', 'Leather'], ['Amber', 'Musk'],
    [['Woody', 85], ['Leathery', 75], ['Smoky', 70]]],
  ['eau-de-zidaan', 'Zidaan Citrus Musk', 'unisex', 2024, 'edp', null, null, 1099, 50, 4.0, 95,
    ['Lemon', 'Bergamot'], ['Green Tea'], ['Musk', 'Ambroxan'],
    [['Citrus', 88], ['Fresh', 85], ['Musky', 70]]],

  // XLNC / Celestial (TO-VERIFY)
  ['xlnc-perfumery', 'XLNC Imperial Oud', 'men', 2023, 'edp', null, null, 799, 100, 3.9, 140,
    ['Saffron'], ['Oud (Agarwood)'], ['Amber', 'Musk'],
    [['Woody', 85], ['Oriental', 80], ['Smoky', 75]]],
  ['xlnc-perfumery', 'XLNC Blue Marine', 'men', 2023, 'edp', 'Hawas for Him', null, 699, 100, 4.0, 160,
    ['Bergamot', 'Sea Notes'], ['Orange Blossom'], ['Musk'],
    [['Aquatic', 88], ['Citrus', 80], ['Fresh', 78]]],
  ['celestial-perfume', 'Celestial Aventus Noir', 'men', 2023, 'edp', 'Aventus', null, 749, 100, 3.9, 130,
    ['Pineapple'], ['Birch'], ['Musk', 'Vanilla'],
    [['Fruity', 82], ['Smoky', 72], ['Woody', 68]]],
  ['celestial-perfume', 'Celestial Velvet Rose', 'women', 2023, 'edp', null, null, 749, 100, 4.0, 110,
    ['Rose', 'Litchi'], ['Peony'], ['Musk', 'Vanilla'],
    [['Floral', 88], ['Sweet', 75], ['Musky', 65]]],

  // Purenso Select (oil format)
  ['purenso-select', 'Purenso Aventus Oil', 'men', 2022, 'oil', 'Aventus', null, 245, 12, 4.0, 320,
    ['Pineapple', 'Blackcurrant'], ['Birch'], ['Musk'],
    [['Fruity', 80], ['Smoky', 70], ['Musky', 70]]],
  ['purenso-select', 'Purenso BR540 Oil', 'unisex', 2022, 'oil', 'Baccarat Rouge 540', null, 275, 12, 4.1, 290,
    ['Saffron'], ['Amberwood'], ['Fir Resin'],
    [['Ambery', 85], ['Warm Spicy', 78], ['Sweet', 80]]],

  // Indie houses (TO-VERIFY, community-suggested)
  ['naso-profumi', 'Naso Citrus Noir', 'men', 2023, 'edp', null, null, 899, 50, 4.0, 85,
    ['Bergamot', 'Black Pepper'], ['Vetiver'], ['Musk', 'Amber'],
    [['Citrus', 85], ['Woody', 70], ['Fresh', 75]]],
  ['the-inkpot-perfumes', 'Inkpot Monsoon Petrichor', 'unisex', 2023, 'edp', null, null, 1099, 50, 4.3, 140,
    ['Rain Accord', 'Vetiver'], ['Petrichor', 'Green Tea'], ['Musk', 'Sandalwood'],
    [['Green', 88], ['Earthy', 85], ['Fresh', 80]]],
  ['ababel-perfumes', 'Ababel Dawn', 'unisex', 2022, 'edp', null, null, 749, 50, 4.2, 210,
    ['Bergamot', 'Neroli'], ['Orange Blossom'], ['Musk', 'Amber'],
    [['Citrus', 88], ['Floral', 75], ['Fresh', 82]]],
  ['aroma-artisans', 'Artisans Sandalwood Reserve', 'unisex', 2023, 'edp', null, null, 1499, 50, 4.4, 175,
    ['Cardamom'], ['Sandalwood', 'Iris'], ['Amber', 'Musk'],
    [['Woody', 90], ['Creamy', 85], ['Powdery', 70]]],
  ['qinaam-perfumes', 'Qinaam Oudh Maliki', 'unisex', 2022, 'oil', null, null, 1999, 12, 4.5, 190,
    ['Oud (Agarwood)'], ['Saffron', 'Rose'], ['Amber', 'Musk'],
    [['Woody', 95], ['Oriental', 90], ['Smoky', 85]]],
];

// ---------- ATTARS ----------
// [houseSlug, name, year, priceINR, sizeMl, ratingAvg, ratingCount, notes(top/heart/base), accords]
const attars = [
  ['sugandhco', 'Sugandhco Shamama', 1950, 2499, 12, 4.7, 320,
    ['Saffron', 'Spices'], ['Rose', 'Kewda'], ['Amber', 'Musk', 'Sandalwood']],
  ['sugandhco', 'Sugandhco Ruh Khus', 1960, 3499, 12, 4.8, 410,
    ['Vetiver', 'Green Notes'], ['Earth', 'Roots'], ['Woody Notes', 'Musk']],
  ['gulab-singh-johrimal', 'Johrimal Shamama', 1900, 4999, 12, 4.9, 280,
    ['Saffron', 'Spices'], ['Oud (Agarwood)', 'Rose'], ['Amber', 'Musk']],
  ['gulab-singh-johrimal', 'Johrimal Dehn al Oudh', 1980, 12999, 6, 4.9, 190,
    ['Oud (Agarwood)'], ['Smoky Woods'], ['Resins', 'Amber']],
  ['boond-fragrances', 'Boond Maati (Mitti Attar)', 2020, 899, 6, 4.6, 540,
    ['Baked Earth', 'Petrichor'], ['Rain Accord'], ['Sandalwood', 'Vetiver']],
  ['boond-fragrances', 'Boond Ruh Gulab', 2021, 1899, 6, 4.5, 310,
    ['Rose', 'Dew'], ['Rose', 'Geranium'], ['Sandalwood', 'Musk']],
  ['asam-co', 'Asam Shamama Supreme', 1930, 5999, 12, 4.8, 220,
    ['Saffron', 'Spices'], ['Oud (Agarwood)', 'Kewda'], ['Amber', 'Musk', 'Sandalwood']],
  ['lala-kedarnath', 'Kedarnath Ruh Khus', 1925, 2999, 12, 4.7, 180,
    ['Vetiver'], ['Earth', 'Green Notes'], ['Woody Notes']],
  ['arun-mradul', 'Mradul Oudh Hindi', 1990, 8999, 6, 4.7, 150,
    ['Oud (Agarwood)', 'Smoke'], ['Leather'], ['Amber', 'Resins']],
  ['gauri-sugandh', 'Gauri Sugandh Chameli', 2000, 1299, 12, 4.4, 210,
    ['Jasmine', 'Mogra'], ['White Florals'], ['Sandalwood', 'Musk']],
  ['pooja-perfumery', 'Pooja Ruh Motia', 1985, 1599, 12, 4.5, 240,
    ['Jasmine', 'Dew'], ['Tuberose'], ['Sandalwood', 'Musk']],
  ['ajmal', 'Ajmal Dahn Al Oudh', 2005, 7500, 6, 4.6, 390,
    ['Oud (Agarwood)'], ['Smoky Woods'], ['Amber', 'Musk']],
];

// ---------- BUILD PERFUMES ----------
const concLabel = { edp: 'eau de parfum', extrait: 'extrait de parfum', edt: 'eau de toilette', parfum: 'parfum', oil: 'perfume oil', attar: 'alcohol-free attar' };
const houseBySlug = Object.fromEntries(houses.map(h => [h.slug, h]));
const perfumes = [];
const perfByName = {};

function addPerfume({ name, houseSlug, gender, year, conc, top, heart, base, accords, ratingAvg, ratingCount, desc, inspiredBy, claimedAcc, priceInr, sizeMl, verify, real, observedAt, bottleImage }) {
  const slug = slugify(name);
  const norm = (x) => Array.isArray(x) ? x : (x == null ? [] : [x]);
  const p = {
    id: `perf_${slug}`, slug, name, houseSlug, house: houseBySlug[houseSlug].name,
    gender, launchYear: year, concentration: conc,
    description: desc, bottleImage: bottleImage || null,
    ratingAvg, ratingCount, lowestPriceInr: priceInr || null,
    accords: (accords || []).map(([n, s]) => ({ name: n, strength: s })),
    topNotes: norm(top), heartNotes: norm(heart), baseNotes: norm(base),
    inspiredBy: inspiredBy || null, claimedAccuracy: claimedAcc || null,
    isDupe: !!inspiredBy, needsVerification: !!verify, real: !!real,
    observedAt: observedAt || null,
  };
  perfumes.push(p); perfByName[name] = p; return p;
}

for (const [name, hs, gender, year, conc, top, heart, base, accords, ra, rc, desc] of originals) {
  addPerfume({ name, houseSlug: hs, gender, year, conc, top, heart, base, accords, ratingAvg: ra, ratingCount: rc, desc });
}

const dupeBlurbs = [
  'Our lab panel found the opening strikingly close to the original, with the drydown wearing a touch smoother and sweeter.',
  'A budget route into a luxury DNA — not identical on paper, but unmistakably the same family on skin.',
  'Gets the signature accord right within minutes; differences show mainly in depth and tenacity of the base.',
  'Impressive for the price — the core character is there, with a simpler drydown than the original.',
];
for (const [hs, name, gender, year, conc, inspiredBy, claimedAcc, priceInr, sizeMl, ra, rc, top, heart, base, accords] of cloneProducts) {
  const r = rand01(name);
  const house = houseBySlug[hs];
  const desc = inspiredBy
    ? `${name} by ${house.name} is an Indian ${concLabel[conc]} inspired by ${inspiredBy}. ${pick(r, dupeBlurbs)}`
    : `${name} by ${house.name} is an original Indian creation — not a dupe. ${pick(r, [
        'A house signature with a growing community following.',
        'Part of the house\u2019s move from inspired scents to original perfumery.',
        'An indie composition built for Indian tastes and climate.',
      ])}`;
  addPerfume({ name, houseSlug: hs, gender, year, conc, top, heart, base, accords, ratingAvg: ra, ratingCount: rc, desc, inspiredBy, claimedAcc, priceInr, sizeMl, verify: house.verify });
}

for (const [hs, name, year, priceInr, sizeMl, ra, rc, top, heart, base] of attars) {
  const house = houseBySlug[hs];
  const r = rand01(name);
  const desc = `${name} is a traditional alcohol-free attar from ${house.region}, crafted by ${house.name}${hs === 'boond-fragrances' ? ' using the centuries-old Deg-Bhapka copper-vessel distillation' : ''}. Pure oil — a drop or two is enough, and it blooms with body heat.`;
  addPerfume({
    name, houseSlug: hs, gender: 'unisex', year, conc: 'attar',
    top, heart, base,
    accords: [['Oriental', 85], ['Resinous', 75], ['Natural', 90]],
    ratingAvg: ra, ratingCount: rc, desc, priceInr, sizeMl, verify: house.verify,
  });
}

// ---------- DUPE RELATIONSHIPS ----------
const verdicts = [
  (o, d, s) => `Opens ${s.opening >= 82 ? 'remarkably close to' : 'in the spirit of'} ${o}, nailing the signature accord within minutes. The drydown is where the gap shows — ${d} wears smoother and simpler, with less depth in the base. At roughly 1/${Math.max(2, Math.round(200 / Math.max(s.similarity, 40)))}th the price, it is an easy recommendation for daily wear.`,
  (o, d, s) => `The headline notes of ${o} are all present and correct, and blind testers placed it in the same family immediately. Longevity and sillage trail the original by a couple of hours, but for the money this is among the strongest value plays in its category.`,
  (o, d, s) => `A faithful interpretation rather than a photocopy: ${d} captures the soul of ${o} while wearing slightly sweeter and more modern. Performance is honest for the price — strong for 4–6 hours, then a skin scent.`,
  (o, d, s) => `Side-by-side, the opening is the closest phase — testers scored it highest there. The drydown simplifies, losing some of the original\u2019s texture. If you love ${o} but not its price tag, this is the pragmatic Indian alternative.`,
];
const labHouses = new Set(['house-of-em5', 'my-perfume-secrets', 'dupify', 'rzler', 'arabian-aroma']);
const dupeRels = [];
for (const p of perfumes) {
  if (!p.inspiredBy || !perfByName[p.inspiredBy]) continue;
  const orig = perfByName[p.inspiredBy];
  const r = rand01('rel' + p.slug);
  const lab = labHouses.has(p.houseSlug);
  const base = { 'house-of-em5': 80, 'my-perfume-secrets': 83, 'dupify': 78, 'rzler': 79, 'arabian-aroma': 77 }[p.houseSlug] || 75;
  const opening = Math.round(base + r() * 8);
  const drydown = Math.round(base + r() * 8);
  const longevity = Math.round(base - 4 + r() * 8);
  const sillage = Math.round(base - 5 + r() * 8);
  const similarity = Math.round(opening * 0.25 + drydown * 0.35 + longevity * 0.2 + sillage * 0.2);
  dupeRels.push({
    id: `rel_${p.slug}`, originalSlug: orig.slug, dupeSlug: p.slug,
    similarityScore: lab ? similarity : null,
    testedBy: lab ? 'lab' : 'community',
    openingMatch: lab ? opening : null, drydownMatch: lab ? drydown : null,
    longevityMatch: lab ? longevity : null, sillageMatch: lab ? sillage : null,
    claimedAccuracy: p.claimedAccuracy,
    verdict: lab ? pick(r, verdicts)(orig.name, p.name, { similarity, opening }) : 'Community-suggested pairing. Our lab has not tested this one yet — similarity score pending.',
    testDate: '2026-09-15', testerCount: lab ? 5 : 1,
  });
}

// ---------- CLIMATE SCORES ----------
function climateFor(p) {
  const r = rand01('clim' + p.slug);
  const acc = p.accords.map(a => a.name.toLowerCase()).join(' ');
  const heavy = /tobacco|oud|oriental|leather|gourmand|smoky/.test(acc);
  const fresh = /aquatic|citrus|fresh|green/.test(acc);
  const heat = heavy ? 4 + Math.floor(r() * 2) : fresh ? 2 + Math.floor(r() * 2) : 3 + Math.floor(r() * 2);
  const hum = heavy ? 3 + Math.floor(r() * 2) : 4 + Math.floor(r() * 2);
  const clamp = (v) => Math.max(1, Math.min(5, v));
  return {
    id: `clim_${p.slug}`, perfumeSlug: p.slug,
    heatLongevity: clamp(heat), humiditySillage: clamp(hum),
    summerRating: clamp(fresh ? 4 + Math.floor(r() * 2) : heavy ? 2 + Math.floor(r() * 2) : 3 + Math.floor(r() * 2)),
    monsoonRating: clamp(3 + Math.floor(r() * 2)),
    winterRating: clamp(heavy ? 4 + Math.floor(r() * 2) : 3 + Math.floor(r() * 2)),
    testTempC: Math.round(36 + r() * 4), testHumidityPct: Math.round(65 + r() * 20),
    sprays: 4 + Math.floor(r() * 4), testerCount: 6 + Math.floor(r() * 8),
    notes: heavy ? 'Tested across Delhi NCR summer afternoons and Mumbai humidity.' : 'Tested across Mumbai monsoon and Bengaluru summer conditions.',
  };
}
const climateScores = perfumes.filter((p) => !p.real).map(climateFor);

// ---------- SELLERS & PRICES ----------
const sellers = [
  { slug: 'myperfumesecrets-official', name: 'My Perfume Secrets — Official Store', website: 'https://myperfumesecrets.com', type: 'official', verified: true },
  { slug: 'dupify-official', name: 'Dupify — Official Store', website: 'https://dupify.in', type: 'official', verified: true },
  { slug: 'em5-flipkart', name: 'House of EM5 — Flipkart Brand Store', website: 'https://www.flipkart.com', type: 'marketplace', verified: true },
  { slug: 'purenso-official', name: 'Purenso Select — Official Store', website: 'https://purensoselect.in', type: 'official', verified: true },
  { slug: 'boond-amazon', name: 'Boond Fragrances — Amazon India', website: 'https://www.amazon.in', type: 'marketplace', verified: true },
  { slug: 'arabian-aroma-official', name: 'Arabian Aroma — Official Store', website: null, type: 'official', verified: true, note: 'URL to verify' },
  { slug: 'auth-importer-mumbai', name: 'Authorized Importer — Mumbai (Sample, replace)', website: null, type: 'importer', verified: true },
  { slug: 'auth-importer-delhi', name: 'Authorized Importer — Delhi (Sample, replace)', website: null, type: 'importer', verified: true },
  { slug: 'discount-bazaar', name: 'Discount Perfume Bazaar', website: null, type: 'marketplace', verified: false },
];
const originalPrices = {
  'Aventus': [24500, 100], 'Sauvage Eau de Toilette': [8200, 100], 'Sauvage Elixir': [15500, 100],
  'Stronger With You Intensely': [9800, 100], 'Acqua di Gio': [7500, 100], 'Tobacco Vanille': [21500, 50],
  'Oud Wood': [19500, 50], 'Interlude Man': [24000, 100], 'Reflection Man': [19500, 100],
  'Bleu de Chanel Parfum': [16500, 100], 'Allure Homme Sport Eau Extreme': [11500, 100], 'Y Eau de Parfum': [9500, 100],
  '1 Million': [6800, 100], 'Invictus': [7200, 100], 'Eros': [6500, 100], 'Dylan Blue': [6200, 100],
  'Bad Boy': [7500, 100], 'Le Male Le Parfum': [8200, 125], 'Baccarat Rouge 540': [28000, 70],
  'Oud for Greatness': [26000, 90], 'Naxos': [32000, 100], 'Alexandria II': [34000, 100],
  'Layton': [23000, 125], 'Pegasus': [21500, 125], 'Hacivat': [22500, 100], 'Cool Water': [3200, 125],
  'Light Blue': [6800, 100], 'The Most Wanted': [6200, 100], 'X for Men': [42000, 50],
  'Ombre Nomade': [30000, 200], 'Cedrat Boise': [14500, 120],
  'Khamrah': [1800, 100], 'Asad': [1600, 100], 'Club de Nuit Intense Man': [2200, 105],
  'Hawas for Him': [2600, 100], 'La Yuqawam': [9500, 75], '9PM': [1500, 100], 'Amber Oud': [3200, 100],
};
const houseSeller = { 'house-of-em5': 'em5-flipkart', 'my-perfume-secrets': 'myperfumesecrets-official', 'dupify': 'dupify-official', 'purenso-select': 'purenso-official', 'boond-fragrances': 'boond-amazon', 'arabian-aroma': 'arabian-aroma-official' };
const prices = [];
for (const p of perfumes) {
  if (p.real) continue; // real products carry their own exact price rows (see enrichment section)
  const r = rand01('price' + p.slug);
  if (originalPrices[p.name]) {
    const [inr, ml] = originalPrices[p.name];
    prices.push({ id: `pr_${p.slug}_a`, perfumeSlug: p.slug, sellerSlug: 'auth-importer-mumbai', priceInr: inr, mrpInr: Math.round(inr * 1.12), sizeMl: ml, inStock: true, url: null, provenance: 'demo', checkedAt: '2026-09-30' });
    prices.push({ id: `pr_${p.slug}_b`, perfumeSlug: p.slug, sellerSlug: 'auth-importer-delhi', priceInr: inr + Math.round(r() * 600), mrpInr: Math.round(inr * 1.12), sizeMl: ml, inStock: r() > 0.15, url: null, provenance: 'demo', checkedAt: '2026-09-30' });
    p.lowestPriceInr = inr;
  } else {
    const sellerSlug = houseSeller[p.houseSlug] || (r() > 0.5 ? 'auth-importer-mumbai' : 'auth-importer-delhi');
    const ml = p.concentration === 'oil' || p.concentration === 'attar' ? (p.lowestPriceInr && p.lowestPriceInr > 2000 ? 12 : 8) : 50;
    prices.push({ id: `pr_${p.slug}_a`, perfumeSlug: p.slug, sellerSlug, priceInr: p.lowestPriceInr, mrpInr: Math.round(p.lowestPriceInr * 1.25), sizeMl: p.concentration === 'attar' ? 6 : (p.concentration === 'oil' ? 12 : (p.houseSlug === 'my-perfume-secrets' ? 8 : 50)), inStock: true, url: null, provenance: 'demo', checkedAt: '2026-09-30' });
  }
}
// a couple of deliberate price drops
const priceDrops = [
  { perfumeSlug: 'hawas-for-him', oldInr: 2999, newInr: 2600, sellerSlug: 'auth-importer-mumbai' },
  { perfumeSlug: 'em5-br-540', oldInr: 699, newInr: 499, sellerSlug: 'em5-flipkart' },
  { perfumeSlug: 'khamrah', oldInr: 2100, newInr: 1800, sellerSlug: 'auth-importer-delhi' },
];

// ---------- REAL CATALOG ENRICHMENT (researched 2026-09-30 and 2026-10-02) ----------
// Drives demo + SQL seed from data/real-houses.json (26 Indian sites, 864 product records).
// Honesty rules enforced here:
//  - inspiredBy is imported ONLY when the brand's own site states it (inferred mappings
//    were already nulled in real-houses.json during preprocessing).
//  - Real records get NO synthetic ratings, reviews, climate scores, or lab similarity scores.
//  - Price provenance is recorded per row: 'live' | 'mixed' | 'indexed' | 'stale'.
//    Only 'live' prices were observed on a live page fetch; the rest need re-verification.
//  - Unknown bottle sizes stay NULL (never invented). Gift/discovery sets are flagged isSet.
const realData = JSON.parse(readFileSync(join(ROOT, 'data', 'real-houses.json'), 'utf8'));
// Product images: local files downloaded from official brand sites (2026-10-03)
let productImages = {};
try {
  productImages = JSON.parse(readFileSync(join(ROOT, 'data', 'scrapes', 'image-local-map.json'), 'utf8'));
} catch (e) { /* images not yet scraped */ }

const realTypeMap = { artisan: 'artisan', attar_maker: 'attar_maker', mass: 'mass', designer: 'designer', niche: 'niche', indian_clone: 'indian_clone', middle_eastern: 'middle_eastern' };
const realActivityMap = { artisan: 'Artisan perfumery', attar_maker: 'Traditional attars & natural oils', mass: 'Mass-market fragrances', indian_clone: 'Inspired fragrances & originals' };
const realProvLabel = {
  live: 'observed live on the official store on',
  mixed: 'recorded from a mix of live page fetches and cached copies of the official site — re-verify before relying on it (observed',
  indexed: 'seen in a search-indexed copy of the official page on',
  stale: 'seen in an older indexed copy of the official page on',
};
const realPriceProv = { live: 'live', mixed: 'mixed', indexed: 'indexed', stale: 'stale' };

const usedSlugs = new Set(perfumes.map((p) => p.slug));
function uniqueSlug(base) {
  let s = base, i = 2;
  while (usedSlugs.has(s)) s = `${base}-${i++}`;
  usedSlugs.add(s);
  return s;
}

// 1. Houses: update existing, add new. One official-store seller per imported site.
const realSellerSlugs = new Set(sellers.map((s) => s.slug));
const importableSites = realData.sites.filter((s) => s.importMode !== 'skip' && s.status !== 'failed');
for (const s of importableSites) {
  const h = s.house;
  const mapped = {
    name: h.name, country: h.country || 'India', region: h.city || null,
    type: realTypeMap[h.type] || 'niche',
    site: h.site, founded: h.founded || 0,
    desc: h.desc || `${h.name} — Indian fragrance house (researched ${s.observedAt || '2026-09-30'}).`,
  };
  const existing = houseBySlug[s.houseSlug];
  if (existing) {
    Object.assign(existing, mapped);
    if (s.status === 'ok') delete existing.verify; else existing.verify = true;
  } else {
    const nh = { slug: s.houseSlug, ...mapped, trust: s.status === 'ok' ? 4 : 3, verify: s.status !== 'ok' };
    houses.push(nh);
    houseBySlug[nh.slug] = nh;
  }
  let sellerSlug = s.sellerSlug;
  if (realSellerSlugs.has(sellerSlug)) sellerSlug = `${sellerSlug}-store`;
  realSellerSlugs.add(sellerSlug);
  const provNote = s.priceProvenance === 'live' ? 'observed live'
    : s.priceProvenance === 'stale' ? 'older indexed copy — re-verify before relying on it'
    : s.priceProvenance === 'mixed' ? 'mix of live fetches and cached copies — re-verify'
    : 'search-indexed copy — re-verify before relying on it';
  sellers.push({
    slug: sellerSlug, name: `${h.name} — Official Store`, website: h.site, type: 'official',
    verified: false, note: `Official brand storefront. Prices researched ${s.observedAt || '2026-09-30'} (${provNote}).`,
  });
  s._sellerSlug = sellerSlug;
}

// 2. Reference houses + originals needed only as link targets for brand-stated inspiredBy mappings.
for (const rh of [
  { slug: 'bvlgari', name: 'Bvlgari', country: 'Italy', region: 'Rome', type: 'designer', site: 'https://www.bulgari.com', founded: 0, trust: 5, desc: 'Reference entry — original house included only because a researched Indian house explicitly names one of its fragrances as an inspiration. Details to be verified.' },
  { slug: 'stephane-humbert-lucas', name: 'Stéphane Humbert Lucas', country: 'France', region: 'Paris', type: 'niche', site: null, founded: 0, trust: 5, desc: 'Reference entry — original house included only because a researched Indian house explicitly names one of its fragrances as an inspiration. Details to be verified.' },
  { slug: 'gucci', name: 'Gucci', country: 'Italy', region: 'Florence', type: 'designer', site: 'https://www.gucci.com', founded: 0, trust: 5, desc: 'Reference entry — original house included only because a researched Indian house explicitly names one of its fragrances as an inspiration. Details to be verified.' },
  { slug: 'victorias-secret', name: "Victoria's Secret", country: 'USA', region: 'New York', type: 'designer', site: null, founded: 0, trust: 4, desc: 'Reference entry — original house included only because a researched Indian house explicitly names one of its fragrances as an inspiration. Details to be verified.' },
]) {
  if (!houseBySlug[rh.slug]) { houses.push({ ...rh, verify: true }); houseBySlug[rh.slug] = houses[houses.length - 1]; }
}
const refOriginals = [
  ['louis-vuitton', 'Imagination'], ['clive-christian', '1872 Masculine'],
  ['stephane-humbert-lucas', 'God of Fire'], ['bvlgari', 'Tygar'],
  ['amouage', 'Jubilation XXV'], ['initio', 'Musk Therapy'],
  ['louis-vuitton', 'Afternoon Swim'], ['gucci', 'Flora'],
  ['victorias-secret', 'Bombshell'], ['versace', 'Bright Crystal'],
  ['amouage', 'Decision'], ['amouage', 'Purpose 50'],
  ['yves-saint-laurent', 'Black Opium'], ['xerjoff', 'Erba Pura'],
  ['maison-francis-kurkdjian', 'Oud Satin Mood'], ['tom-ford', 'Ombre Leather'],
];
for (const [hs, nm] of refOriginals) {
  if (perfByName[nm]) continue;
  const house = houseBySlug[hs];
  addPerfume({
    name: nm, houseSlug: hs, gender: 'unisex', year: 0, conc: 'edp',
    top: [], heart: [], base: [], accords: [], ratingAvg: 0, ratingCount: 0,
    desc: `Reference entry for ${nm} by ${house.name} — included only because a researched Indian house explicitly names it as an inspiration. Scentiqa has not independently catalogued this original; details to be verified.`,
    real: true, verify: true,
  });
}

// 3. Real products + exact price rows.
const inspiredByToOriginal = {
  'Louis Vuitton Imagination': 'Imagination',
  'Clive Christian 1872 Masculine': '1872 Masculine',
  'Stephane Humbert Lucas God of Fire': 'God of Fire',
  'Bvlgari Tygar': 'Tygar',
  'Amouage Jubilation XXV': 'Jubilation XXV',
  'Initio Musk Therapy': 'Musk Therapy',
  'Louis Vuitton Afternoon Swim': 'Afternoon Swim',
  'Gucci Flora': 'Flora',
  "Victoria's Secret Bombshell": 'Bombshell',
  'Dior Sauvage': 'Sauvage Eau de Toilette',
  'Creed Aventus': 'Aventus',
  'Tom Ford Oud Wood': 'Oud Wood',
  'Tom Ford Ombre Leather': 'Ombre Leather',
  'Giorgio Armani Acqua di Gio': 'Acqua di Gio',
  'Paco Rabanne 1 Million': '1 Million',
  'Louis Vuitton Ombre Nomade': 'Ombre Nomade',
  'Versace Bright Crystal': 'Bright Crystal',
  'Versace Eros': 'Eros',
  'Amouage Decision': 'Decision',
  'Amouage Purpose 50': 'Purpose 50',
  'YSL Black Opium': 'Black Opium',
  'Xerjoff Erba Pura': 'Erba Pura',
  'Maison Francis Kurkdjian Oud Satin Mood': 'Oud Satin Mood',
  'Maison Francis Kurkdjian Baccarat Rouge 540': 'Baccarat Rouge 540',
  'Armaf Club de Nuit Intense Man': 'Club de Nuit Intense Man',
  'Dior Sauvage Elixir': 'Sauvage Elixir',
  'Bleu de Chanel Parfum': 'Bleu de Chanel Parfum',
};
const isGiftSet = (name) => /\bgift\b|discovery set|trial pack|trial set|gifting set|set of \d|giftpack/i.test(name);
const inr = (n) => `₹${Number(n).toLocaleString('en-IN')}`;

function realDesc(p, houseName, prov, obsDate) {
  const bits = [`${p.name} by ${houseName}.`];
  if (p.inspiredBy) bits.push(`The brand states it is inspired by ${p.inspiredBy}.`);
  if (p.claimedAccuracy) bits.push(`The brand claims "${p.claimedAccuracy}" — a brand claim, not a Scentiqa test result.`);
  if (isGiftSet(p.name)) bits.push('This is a gift/discovery set, not a single fragrance.');
  if (p.priceInr != null && p.sizeMl != null) bits.push(`Listed on the official store at ${inr(p.priceInr)} for ${p.sizeMl}ml — price ${realProvLabel[prov]} ${obsDate}.`);
  else if (p.priceInr != null) bits.push(`Listed on the official store at ${inr(p.priceInr)} — bottle size was not stated on the page; price ${realProvLabel[prov]} ${obsDate}.`);
  else bits.push(`Listed on the official store; no price was visible in the fetched page text on ${obsDate}.`);
  if (p.sizeNote) bits.push(`Size note: ${p.sizeNote}.`);
  if (p.claimText && !/inferred|not verbatim-verified/i.test(p.claimText)) bits.push(`House note: ${p.claimText}.`);
  return bits.join(' ');
}

for (const s of importableSites) {
  const prov = realPriceProv[s.priceProvenance] || 'indexed';
  const houseName = houseBySlug[s.houseSlug].name;
  for (const p of (s.products || [])) {
    const slug = uniqueSlug(p.slugHint ? p.slugHint : slugify(p.name));
    const gender = ['men', 'women', 'unisex'].includes(p.gender) ? p.gender : 'unisex';
    const conc = p.conc || 'edp';
    const perf = addPerfume({
      name: p.name, houseSlug: s.houseSlug, gender, year: 0, conc,
      top: [], heart: [], base: [], accords: [], ratingAvg: 0, ratingCount: 0,
      desc: realDesc(p, houseName, prov, s.observedAt || '2026-09-30'),
      inspiredBy: p.inspiredBy || null, claimedAcc: p.claimedAccuracy || null,
      priceInr: p.priceInr != null ? p.priceInr : null,
      real: true, verify: s.status !== 'ok',
      observedAt: s.observedAt || '2026-09-30',
      bottleImage: (p.url && productImages[p.url]) || null,
    });
    // keep the collision-free slug (addPerfume derives it from the name)
    perf.slug = slug; perf.id = `perf_${slug}`;
    perf.priceProvenance = prov;
    perf.sourceUrl = p.url || null;
    perf.isSet = isGiftSet(p.name);
    perf.researchNote = (p.claimText && /inferred|not verbatim-verified/i.test(p.claimText))
      ? `Research note (${s.observedAt || '2026-09-30'}): ${p.claimText} No inspired-by mapping was recorded.`
      : (s.notes ? `Site research note (${s.observedAt || '2026-09-30'}): ${s.notes}` : null);
    if (p.priceInr != null) {
      prices.push({
        id: `pr_${slug}_real`, perfumeSlug: slug, sellerSlug: s._sellerSlug,
        priceInr: p.priceInr, mrpInr: null, sizeMl: p.sizeMl != null ? p.sizeMl : null,
        inStock: p.inStock !== false, url: p.url || null,
        provenance: prov, checkedAt: s.observedAt || '2026-09-30',
      });
      perf.lowestPriceInr = p.priceInr;
    }
  }
}

// 4. Real dupe relationships — brand-stated only, never scored, never "lab".
for (const p of perfumes) {
  if (!p.real || !p.inspiredBy) continue;
  const targets = p.inspiredBy.includes(' + ')
    ? p.inspiredBy.split(' + ').map((t) => t.trim())
    : [p.inspiredBy];
  for (const t of targets) {
    const origName = inspiredByToOriginal[t] || t;
    const orig = perfByName[origName];
    if (!orig || orig.slug === p.slug) { console.warn(`[real] no original found for "${t}" (dupe: ${p.name})`); continue; }
    dupeRels.push({
      id: `rel_${p.slug}_${orig.slug}`, originalSlug: orig.slug, dupeSlug: p.slug,
      similarityScore: null, testedBy: 'community',
      openingMatch: null, drydownMatch: null, longevityMatch: null, sillageMatch: null,
      claimedAccuracy: p.claimedAccuracy,
      verdict: `Brand-stated inspiration: ${p.house} lists this as inspired by ${t}. Scentiqa has not independently tested this pairing, so there is no similarity score.${p.claimedAccuracy ? ` The brand's own "${p.claimedAccuracy}" claim is marketing, not a test result.` : ''}`,
      testDate: p.observedAt || '2026-09-30', testerCount: 0,
    });
  }
}

// ---------- REVIEWS ----------
const reviewers = ['arjun_sniffs', 'priya_scent', 'desi_nose', 'fraghead_mumbai', 'scentofchennai'];
const reviewsSeed = [
  ['Aventus', 'arjun_sniffs', 5, 'The king, even in Delhi heat', 'Wore it to a wedding in May — 40 degrees and it still projected for 6 hours. Nothing else does that. Worth every rupee if you can stretch.', true, 214],
  ['Aventus', 'priya_scent', 4, 'Great, but try the clones first', 'Beautiful smoky pineapple. That said, at this price please sample EM5 or Dupify versions before committing — you might be 85% happy for 2% of the price.', true, 167],
  ['Sauvage Eau de Toilette', 'desi_nose', 4, 'Office-safe beast', 'Two sprays for office, four for evenings. The ambroxan can get scratchy in peak summer afternoons — monsoon is its best season here.', true, 98],
  ['Baccarat Rouge 540', 'priya_scent', 5, 'Compliment magnet, no notes', 'Strangers ask about it. That almost never happens. Saffron-amber glow that lasts all day on clothes.', true, 143],
  ['Khamrah', 'fraghead_mumbai', 5, 'Viral for a reason', 'Spiced dates and praline — smells like a Goan Christmas. Lasts 10+ hours in Mumbai humidity. Best 1800 rupees in perfumery.', true, 201],
  ['Hawas for Him', 'scentofchennai', 5, 'Chennai summer solved', 'The only fresh scent that survives our humidity past noon. Aquatic-plum-musk, endlessly wearable.', true, 132],
  ['EM5 BR 540', 'arjun_sniffs', 4, '85% there for 2% of the price', 'Side-by-sided with the original at a meetup. Opening is shockingly close; the drydown is simpler. For 499, absurd value.', true, 176],
  ['EM5 Ocean Breeze', 'desi_nose', 4, 'Hawas on a budget', 'Fresh, clean, inoffensive — perfect gym/office scent. Lasts about 5 hours on skin, longer on clothes.', true, 88],
  ['MPS Bleu De Chanel', 'fraghead_mumbai', 4, 'Polished and refined', 'You can tell the oil concentration is high — it wears dense and smooth. Office-perfect. Wish the bottle was bigger than 8ml.', true, 74],
  ['MPS Naxos 2020', 'priya_scent', 5, 'Honey-tobacco heaven', 'The best thing I have smelled under 500 rupees. Rich, warm, addictive — winter essential.', true, 92],
  ['Dupify Aventus', 'desi_nose', 3, 'Good, not great', 'Pleasant fruity-woody scent, but the smoky birch depth of the original is missing. Fine for the price, EM5 edges it in my testing.', true, 61],
  ['Tobacco Vanille', 'arjun_sniffs', 5, 'Winter royalty', 'Too heavy for Indian summer, but December-January evenings? Unbeatable. Tobacco, vanilla, dried fruit — pure luxury.', true, 117],
  ['Boond Maati (Mitti Attar)', 'scentofchennai', 5, 'Petrichor in a bottle', 'Smells exactly like the first rain on dry earth. Deeply Indian, deeply moving. A drop lasts all day.', true, 85],
  ['Arabian Aroma Ombre Leather', 'fraghead_mumbai', 4, 'Solid leather', 'Raspberry-leather done well. Not identical to the Tom Ford, but a genuinely good scent in its own right.', true, 58],
  ['Club de Nuit Intense Man', 'desi_nose', 4, 'The legend delivers', 'Harsh first 20 minutes, then pure Aventus-adjacent glory. Let it macerate two weeks after buying — trust me.', true, 149],
  ['Sauvage Elixir', 'arjun_sniffs', 5, 'Sauvage, but grown up', 'Denser, spicier, more refined than the EDT. The licorice note is divisive — sample first. Performance is elite.', false, 66],
];

// ---------- REVIEWS (objects) ----------
const members = [
  { username: 'arjun_sniffs', city: 'Mumbai', bio: 'Niche obsessive. 120+ bottles sampled, 30 owned. Delhi heat survivor.', level: 'Connoisseur', sig: 'aventus', favs: ['aventus', 'interlude-man', 'naxos'], wardrobe: { have: ['aventus', 'khamrah', 'em5-br-540', 'tobacco-vanille'], want: ['ombre-nomade', 'oud-for-greatness'], had: ['cool-water'], test: ['hacivat', 'mps-naxos-2020'] } },
  { username: 'priya_scent', city: 'Bengaluru', bio: 'Gourmand lover. BR540 apologist. Dupe-lab volunteer tester.', level: 'Enthusiast', sig: 'baccarat-rouge-540', favs: ['baccarat-rouge-540', 'mps-naxos-2020', 'khamrah'], wardrobe: { have: ['baccarat-rouge-540', 'mps-naxos-2020', 'khamrah'], want: ['alexandria-ii'], had: ['light-blue'], test: ['mps-vanilla-diorama'] } },
  { username: 'desi_nose', city: 'Delhi', bio: 'Budget fraghead. If it costs over 2000, I find the dupe.', level: 'Enthusiast', sig: 'hawas-for-him', favs: ['hawas-for-him', 'club-de-nuit-intense-man'], wardrobe: { have: ['hawas-for-him', 'club-de-nuit-intense-man', 'em5-ocean-breeze', 'dupify-aventus'], want: ['sauvage-elixir'], had: ['invictus'], test: ['rzler-nautis'] } },
];
const reviews = reviewsSeed.map(([pname, user, rating, title, body, verified, helpful], i) => ({
  id: `rev_${String(i + 1).padStart(3, '0')}`,
  perfumeSlug: perfByName[pname].slug, username: user, rating, title, body,
  verifiedPurchase: verified, helpfulVotes: helpful,
  createdAt: `2026-0${(i % 9) + 1}-${10 + (i % 18)}T10:00:00Z`,
}));

// ---------- ARTICLES ----------
const articles = [
  {
    slug: 'lab-tested-5-aventus-dupes-honest-ranking',
    title: 'We lab-tested 5 Aventus dupes — here is the honest ranking',
    category: 'review', excerpt: 'Five Indian alternatives to Creed Aventus, one blind panel, zero sponsorship. The winner surprised us.',
    author: 'Scentiqa Lab', date: '2026-09-20',
    body: `<p>Creed Aventus costs roughly \u20B924,500 in India. Every Indian clone house has an answer to it — but which answers are honest? Our five-person panel wore each dupe for a full day in 38\u00B0C Delhi heat, blind, and scored opening, drydown, longevity and sillage separately.</p><p><strong>1. EM5\u2019s interpretation (\u20B9499)</strong> — our lab score: the highest of the batch. The smoky pineapple opening is strikingly close; only the drydown\u2019s depth gives it away. Best value in the test by a mile.</p><p><strong>2. Armaf Club de Nuit Intense Man (\u20B92,200)</strong> — the legend. Harsher opening than the rest, but the drydown is the closest thing to Aventus under \u20B93,000. Let it macerate two weeks.</p><p><strong>3. Dupify\u2019s Aventus (\u20B9599)</strong> — pleasant and fruity, but the birch smoke that defines Aventus is muted. A good scent; a less convincing clone.</p><p><strong>4. Purenso\u2019s Aventus oil (\u20B9245)</strong> — remember this is an oil, not a spray. Intimate, long-lasting on skin, but it never projects like the original.</p><p><strong>5. Celestial\u2019s Aventus Noir (\u20B9749)</strong> — community-suggested; our lab has not completed full testing yet. Early impressions are positive but unverified.</p><p>The takeaway: you can get 80%+ of the Aventus experience for under \u20B91,000 in India today. That is exactly why Scentiqa exists.</p>`,
  },
  {
    slug: 'house-of-em5-499-phenomenon',
    title: 'House of EM5: decoding the \u20B9499 phenomenon',
    category: 'column', excerpt: 'How a Mumbai clone house became India\u2019s gateway drug to niche perfumery.',
    author: 'Scentiqa Editorial', date: '2026-09-12',
    body: `<p>Walk into any Indian fragrance community and ask where beginners should start. The answer, overwhelmingly, is three letters: EM5.</p><p>House of EM5\u2019s playbook is disarmingly simple — take the world\u2019s most-cloned scents (Baccarat Rouge 540, Cool Water, Hawas), bottle competent interpretations as 50ml EDPs, and sell them on Flipkart and Amazon for around \u20B9499. No mystique, no attar-shop theatrics.</p><p>Our lab testing puts their BR540 interpretation among the strongest value scores we have measured. The Hawas-inspired Ocean Breeze is arguably the best \u20B9499 fresh scent in the country for Indian summers.</p><p>Are they identical to the originals? No — and our claimed-vs-lab panels show exactly where the gaps are. But EM5 has done something the luxury houses never bothered to: make great-smelling perfumery accessible to a college student in Indore. That deserves respect.</p>`,
  },
  {
    slug: 'spot-fake-creed-aventus-india',
    title: 'How to spot a fake Creed Aventus in India (2026 guide)',
    category: 'guide', excerpt: 'Grey-market Aventus floods Indian marketplaces. Here is how to protect yourself.',
    author: 'Scentiqa Trust Team', date: '2026-09-05',
    body: `<p>Aventus is the most counterfeited niche perfume in India. If a deal looks too good — \u20B98,000 for a 100ml \u201Csealed\u201D bottle — it is fake. Full stop.</p><p><strong>Checklist:</strong></p><p>1. <strong>Batch code:</strong> etched on the back of the bottle, matching the box. No sticker-only codes.<br/>2. <strong>Atomizer:</strong> genuine Creed atomizers are precise and quiet; fakes sputter.<br/>3. <strong>Juice color:</strong> Aventus varies by batch, but neon or murky juice is a red flag.<br/>4. <strong>Seller:</strong> buy only from sellers on our verified list. Marketplace listings with stock photos and no GST invoice are the danger zone.</p><p>When in doubt, post photos in our <a href="/forum/fakes-help-desk">Fakes Help Desk</a> — the community authenticates dozens of bottles a week.</p><p>And remember: a great Indian dupe at \u20B9499 beats a fake \u201CAventus\u201D at \u20B98,000 every single time.</p>`,
  },
  {
    slug: 'arabian-aroma-seduction-bestseller',
    title: 'Arabian Aroma\u2019s original \u201CSeduction\u201D overtakes its dupes',
    category: 'launch', excerpt: 'The Kanpur house\u2019s original creation is now its bestseller — a sign of India\u2019s maturing clone market.',
    author: 'Scentiqa Newsroom', date: '2026-08-28',
    body: `<p>Something interesting is happening in Kanpur. Arabian Aroma — the house that reportedly moved ~500,000 bottles in 2024 largely on inspired fragrances — says its original creation, Seduction, is now its bestselling scent.</p><p>It is a milestone worth noting. India\u2019s clone houses began as pure alternatives to Western luxury; now the best of them are developing original identities. Seduction\u2019s fruity-woody profile has earned a 4.5 community rating on Scentiqa, higher than most of the house\u2019s inspired line.</p><p>The arc of every mature dupe market — from the Middle East to now India — bends from imitation to creation. We will be watching.</p>`,
  },
  {
    slug: 'readers-choice-awards-2026-voting-opens',
    title: 'Scentiqa Readers\u2019 Choice Awards 2026 — voting is open',
    category: 'awards', excerpt: 'Best Dupe House, Best Summer Beast, Best Attar, Best Value Buy. Your vote decides.',
    author: 'Scentiqa Editorial', date: '2026-09-25',
    body: `<p>Voting is now open for the first Scentiqa Readers\u2019 Choice Awards, celebrating the scents and houses India actually wears.</p><p><strong>Categories:</strong> Best Dupe House of 2026, Best Summer Beast, Best Attar, and Best Value Buy under \u20B91,000.</p><p>One vote per member per category. Voting closes 31 October 2026, and winners are announced in the first week of November. <a href="/awards/2026">Cast your vote here</a>.</p>`,
  },
];

// ---------- FORUM ----------
const forumSeed = [
  ['beginners', 'Beginners\u2019 Corner', 'New to fragrance? Start here — no question is too basic.', [
    ['How many sprays is too many in Indian summer?', 'desi_nose', [
      ['desi_nose', 'I do 4 sprays of Hawas and my colleagues say it\u2019s strong. What\u2019s the rule for 40-degree heat?'],
      ['arjun_sniffs', 'Heat amplifies projection. Rule of thumb: halve your winter sprays in May-June. 2-3 sprays max for fresh scents, 1-2 for heavy orientals.'],
      ['priya_scent', 'Also: spray clothes, not just skin. It lasts longer and projects less aggressively in humidity.'],
    ]],
    ['First niche purchase — Aventus or BR540?', 'fraghead_mumbai', [
      ['fraghead_mumbai', 'Saved up 25k. Should I buy Aventus or BR540? I live in Mumbai.'],
      ['priya_scent', 'Mumbai humidity + BR540 = you will smell amazing but you might suffocate others in locals. Aventus wears better in heat.'],
      ['arjun_sniffs', 'Honestly? Buy neither first. Spend 2k on EM5 BR540 + Armaf CDNIM + Hawas, live with the DNAs for a month, then decide.'],
    ]],
  ]],
  ['dupe-talk', 'Dupe Talk', 'Indian alternatives, clone houses, similarity debates.', [
    ['EM5 vs Dupify Aventus — final verdict?', 'desi_nose', [
      ['desi_nose', 'Both claim to be the Aventus killer. Who wins?'],
      ['arjun_sniffs', 'Our lab scored EM5 higher on drydown match. Dupify\u2019s opening is nice but fades faster. Full breakdown in the lab report article.'],
      ['fraghead_mumbai', 'EM5 for me too. Also Dupify\u2019s \u201C95%\u201D claim vs our lab\u2019s number — always check the claimed-vs-lab panel.'],
    ]],
    ['My Perfume Secrets accuracy claims — legit?', 'priya_scent', [
      ['priya_scent', 'MPS prints \u201C82% accuracy\u201D on the Bleu listing. How is that measured?'],
      ['arjun_sniffs', 'It\u2019s the house\u2019s own claim — marketing, basically. Our lab independently scored it in the low 80s, so this one happens to be fair. Not all are.'],
    ]],
  ]],
  ['attars', 'Attars & Kannauj', 'Traditional Indian perfumery — attars, ruhs, shamamas.', [
    ['Mitti attar recommendations for a beginner?', 'scentofchennai', [
      ['scentofchennai', 'I want to try the famous petrichor attar. Boond? Sugandhco?'],
      ['arjun_sniffs', 'Boond\u2019s Maati is the crowd favourite and easy to find on Amazon. Apply one drop — attars are concentrated.'],
      ['desi_nose', 'Second Boond. Also try their Ruh Gulab if you like florals.'],
    ]],
    ['How do you wear attar without overdoing it?', 'fraghead_mumbai', [
      ['fraghead_mumbai', 'One drop of shamama filled my whole office. Help.'],
      ['priya_scent', 'Behind the ears and a touch on the wrists. Never more than two drops for potent ones like shamama or oudh.'],
    ]],
  ]],
  ['fakes-help-desk', 'Fakes Help Desk', 'Suspect a counterfeit? Post photos, get community authentication.', [
    ['Is this Aventus batch code legit? (photos inside)', 'fraghead_mumbai', [
      ['fraghead_mumbai', 'Bought from a marketplace seller for 12k. Batch code looks etched but the atomizer sputters.'],
      ['arjun_sniffs', 'Sputtering atomizer + that price = red flags. Post a photo of the batch code next to the box code — they must match exactly.'],
    ]],
    ['\u201CSealed\u201D Sauvage for 4000 — fake?', 'desi_nose', [
      ['desi_nose', 'Seller claims sealed tester. 4000 for 100ml.'],
      ['priya_scent', 'Fake. Authentic Sauvage 100ml never sells that low in India. Buy from our verified sellers list instead.'],
    ]],
  ]],
  ['general', 'General Discussion', 'Everything fragrance that doesn\u2019t fit elsewhere.', [
    ['What did you wear today? (daily thread)', 'arjun_sniffs', [
      ['arjun_sniffs', 'Naxos. It\u2019s October, finally cool enough.'],
      ['priya_scent', 'MPS Naxos 2020 — the dupe, and honestly I\u2019m not mad about it.'],
      ['scentofchennai', 'Hawas. Chennai doesn\u2019t do October.'],
    ]],
    ['Monsoon fragrance rotation', 'priya_scent', [
      ['priya_scent', 'What survives Mumbai monsoon? My fresh scents die in 2 hours.'],
      ['desi_nose', 'Ambroxan-heavy scents (Sauvage DNA) cut through humidity. Also: attars. Oils don\u2019t wash out like alcohol sprays.'],
    ]],
  ]],
  ['niche', 'Niche & Luxury', 'Creed, Amouage, Xerjoff and beyond.', [
    ['Interlude Man in Indian summer — madness?', 'arjun_sniffs', [
      ['arjun_sniffs', 'One spray of Interlude in May cleared a room. Respect the beast.'],
      ['priya_scent', 'It\u2019s a November-to-February scent in India. Full stop.'],
    ]],
    ['Is Xerjoff worth 3x Parfums de Marly?', 'fraghead_mumbai', [
      ['fraghead_mumbai', 'Naxos vs Layton — both sweet, very different prices.'],
      ['arjun_sniffs', 'Different beasts. Naxos is honey-tobacco opulence; Layton is apple-lavender elegance. Try both via MPS/Naxos clones first for under 500.'],
    ]],
  ]],
];

// ---------- AWARDS / GIVEAWAYS ----------
const awards2026 = [
  { category: 'Best Dupe House 2026', type: 'house', nominees: [['house-of-em5', 1840], ['my-perfume-secrets', 1620], ['dupify', 890], ['rzler', 640], ['arabian-aroma', 720]] },
  { category: 'Best Summer Beast 2026', type: 'perfume', nominees: [['hawas-for-him', 1210], ['aventus', 980], ['em5-ocean-breeze', 870], ['sauvage-eau-de-toilette', 760], ['rzler-nautis', 540]] },
  { category: 'Best Attar 2026', type: 'perfume', nominees: [['sugandhco-ruh-khus', 640], ['boond-maati-mitti-attar', 590], ['gulab-singh-johrimal-shamama', 480], ['asam-shamama-supreme', 390]] },
  { category: 'Best Value Buy under \u20B91,000', type: 'perfume', nominees: [['em5-br-540', 1560], ['khamrah', 1420], ['mps-naxos-2020', 980], ['dupify-tobacco-vanille', 720], ['em5-ocean-breeze', 690]] },
];
const giveaways = [
  { slug: 'em5-discovery-set-oct-2026', title: 'Win the House of EM5 Discovery Set', desc: 'Five 10ml discovery vials — BR 540, Aqua, Antonia, Most Wanted and Ocean Breeze. Open to Indian residents.', prize: 'EM5 Discovery Set (5 \u00D7 10ml)', perfumeSlug: 'em5-br-540', starts: '2026-09-20', ends: '2026-10-20T23:59:59+05:30', winner: null, active: true, entries: 2314 },
  { slug: 'dupify-starter-kit-sep-2026', title: 'Dupify Starter Kit Giveaway', desc: 'Three 50ml bottles from Dupify\u2019s inspired line.', prize: '3 \u00D7 Dupify 50ml', perfumeSlug: 'dupify-aventus', starts: '2026-08-01', ends: '2026-09-01T23:59:59+05:30', winner: 'desi_nose', active: false, entries: 1876 },
];

// ---------- CURATED LISTS ----------
const trendingSlugs = ['aventus', 'sauvage-eau-de-toilette', 'baccarat-rouge-540', 'khamrah', 'hawas-for-him', 'em5-br-540', 'mps-bleu-de-chanel', 'stronger-with-you-intensely', 'tobacco-vanille', 'naxos', 'club-de-nuit-intense-man', '9pm'];
const latestSlugs = ['rzler-nexorien', 'mps-nawab-of-oudh-intensivo', 'seduction-by-arabian-aroma', 'royal-oud-by-arabian-aroma', 'mps-outlands', 'mps-beach-hut-man', 'zidaan-noir-oud', 'inkpot-monsoon-petrichor'];
const dupeOfWeek = { originalSlug: 'aventus', dupeSlug: 'em5-br-540' };

// ---------- HOUSE STATS ----------
for (const h of houses) {
  const ps = perfumes.filter(p => p.houseSlug === h.slug);
  h.id = `house_${h.slug}`;
  h.perfumeCount = ps.length;
  h.earliestYear = ps.length ? Math.min(...ps.map(p => p.launchYear)) : h.founded;
  h.latestYear = ps.length ? Math.max(...ps.map(p => p.launchYear)) : h.founded;
  const labRels = dupeRels.filter(r => perfumes.find(p => p.slug === r.dupeSlug)?.houseSlug === h.slug && r.testedBy === 'lab');
  h.avgSimilarity = labRels.length ? Math.round(labRels.reduce((s, r) => s + r.similarityScore, 0) / labRels.length) : null;
}

// ---------- SEED OBJECT ----------
const seed = {
  meta: { generated: '2026-10-02', site: 'Scentiqa', version: 3, note: 'Demo data plus real catalog records researched 2026-09-30 (20 sites) and 2026-10-02 (6 sites, flagged real:true). TO-VERIFY items flagged needsVerification. Price provenance: live = observed live, mixed/indexed/stale = needs re-verification, demo = synthetic sample.', realProducts: perfumes.filter((p) => p.real && p.priceProvenance).length, realRelationships: dupeRels.filter((r) => r.testDate).length, realPrices: prices.filter((pr) => pr.provenance !== 'demo').length },
  houses: houses.map(h => ({
    id: h.id, slug: h.slug, name: h.name, country: h.country, region: h.region, city: null,
    mainActivity: realActivityMap[h.type] || (h.type === 'indian_clone' ? 'Inspired fragrances & originals' : 'Designer / niche perfumery'),
    website: h.site, type: h.type, description: h.desc,
    perfumeCount: h.perfumeCount, earliestYear: h.earliestYear, latestYear: h.latestYear,
    avgSimilarity: h.avgSimilarity, trustRating: h.trust, foundedYear: h.founded, needsVerification: !!h.verify,
  })),
  notes: notes.map(([name, category, desc], i) => ({ id: `note_${String(i).padStart(3, '0')}`, slug: slugify(name), name, category, odorProfile: desc })),
  perfumes, dupeRelationships: dupeRels, climateScores,
  sellers: sellers.map(s => ({ id: `seller_${s.slug}`, ...s })),
  prices, priceDrops,
  users: members.map(m => ({ id: `user_${m.username}`, username: m.username, city: m.city, bio: m.bio, level: m.level, sig: m.sig, favs: m.favs, wardrobe: m.wardrobe })),
  reviews,
  articles: articles.map((a, i) => ({ id: `art_${String(i + 1).padStart(2, '0')}`, ...a })),
  forum: forumSeed.map(([slug, name, desc, topics], ci) => ({
    id: `fcat_${slug}`, slug, name, description: desc,
    topics: topics.map(([title, author, posts], ti) => ({
      id: `ftop_${slug}_${ti + 1}`, title, author,
      posts: posts.map(([u, body], pi) => ({ id: `fpost_${slug}_${ti + 1}_${pi + 1}`, username: u, body })),
    })),
  })),
  awards: awards2026.map((a, i) => ({ id: `award_2026_${i + 1}`, year: 2026, ...a })),
  giveaways: giveaways.map((g, i) => ({ id: `give_${i + 1}`, ...g })),
  trending: trendingSlugs, latest: latestSlugs, dupeOfWeek: { originalSlug: 'aventus', dupeSlug: 'dupify-aventus' },
};

// fix the attar award nominee slug (perfume slugs are name-based)
seed.awards.forEach(a => a.nominees.forEach(n => { if (n[0] === 'gulab-singh-johrimal-shamama') n[0] = 'johrimal-shamama'; }));

// ---------- WRITE seed.json ----------
mkdirSync(join(ROOT, 'data'), { recursive: true });
mkdirSync(join(ROOT, 'supabase'), { recursive: true });
writeFileSync(join(ROOT, 'data', 'seed.json'), JSON.stringify(seed, null, 1));
console.log(`seed.json: ${seed.perfumes.length} perfumes, ${seed.houses.length} houses, ${seed.dupeRelationships.length} dupe rels, ${seed.prices.length} prices, ${seed.reviews.length} reviews`);

// ---------- WRITE seed.sql ----------
const L = [];
L.push('-- Scentiqa seed data (generated by scripts/generate-seed.mjs — do not edit by hand)');
L.push('-- Run AFTER supabase/schema.sql');
L.push('BEGIN;');
for (const h of seed.houses) {
  L.push(`INSERT INTO houses (id, slug, name, country, region, main_activity, website_url, house_type, description, perfume_count, earliest_year, latest_year, avg_similarity_score, trust_rating, founded_year) VALUES (${esc(h.id)}, ${esc(h.slug)}, ${esc(h.name)}, ${esc(h.country)}, ${esc(h.region)}, ${esc(h.mainActivity)}, ${esc(h.website)}, ${esc(h.type)}, ${esc(h.description)}, ${h.perfumeCount}, ${h.earliestYear}, ${h.latestYear}, ${h.avgSimilarity === null ? 'NULL' : h.avgSimilarity}, ${h.trustRating}, ${h.foundedYear});`);
}
for (const n of seed.notes) {
  L.push(`INSERT INTO notes (id, slug, name, category, odor_profile) VALUES (${esc(n.id)}, ${esc(n.slug)}, ${esc(n.name)}, ${esc(n.category)}, ${esc(n.odorProfile)});`);
}
for (const s of seed.sellers) {
  L.push(`INSERT INTO sellers (id, slug, name, website_url, seller_type, verified, trust_notes) VALUES (${esc(s.id)}, ${esc(s.slug)}, ${esc(s.name)}, ${esc(s.website)}, ${esc(s.type)}, ${esc(s.verified)}, ${esc(s.note || null)});`);
}
for (const p of seed.perfumes) {
  L.push(`INSERT INTO perfumes (id, slug, name, house_id, gender, launch_year, concentration, description, bottle_image_url, rating_avg, rating_count, lowest_price_inr, accords, top_notes, heart_notes, base_notes, is_discontinued) VALUES (${esc(p.id)}, ${esc(p.slug)}, ${esc(p.name)}, ${esc('house_' + p.houseSlug)}, ${esc(p.gender)}, ${p.launchYear}, ${esc(p.concentration)}, ${esc(p.description)}, ${esc(p.bottleImage)}, ${p.ratingAvg}, ${p.ratingCount}, ${p.lowestPriceInr === null ? 'NULL' : p.lowestPriceInr}, ${J(p.accords)}, ${J(p.topNotes)}, ${J(p.heartNotes)}, ${J(p.baseNotes)}, FALSE);`);
}
for (const r of seed.dupeRelationships) {
  L.push(`INSERT INTO dupe_relationships (id, original_perfume_id, dupe_perfume_id, similarity_score, tested_by, opening_match, drydown_match, longevity_match, sillage_match, claimed_accuracy_text, verdict_text, test_date, tester_count) VALUES (${esc(r.id)}, ${esc('perf_' + r.originalSlug)}, ${esc('perf_' + r.dupeSlug)}, ${r.similarityScore === null ? 'NULL' : r.similarityScore}, ${esc(r.testedBy)}, ${r.openingMatch === null ? 'NULL' : r.openingMatch}, ${r.drydownMatch === null ? 'NULL' : r.drydownMatch}, ${r.longevityMatch === null ? 'NULL' : r.longevityMatch}, ${r.sillageMatch === null ? 'NULL' : r.sillageMatch}, ${esc(r.claimedAccuracy)}, ${esc(r.verdict)}, ${esc(r.testDate)}, ${r.testerCount});`);
}
for (const c of seed.climateScores) {
  L.push(`INSERT INTO climate_scores (id, perfume_id, heat_longevity, humidity_sillage, summer_rating, monsoon_rating, winter_rating, test_temp_c, test_humidity_pct, sprays_used, tester_count, notes) VALUES (${esc(c.id)}, ${esc('perf_' + c.perfumeSlug)}, ${c.heatLongevity}, ${c.humiditySillage}, ${c.summerRating}, ${c.monsoonRating}, ${c.winterRating}, ${c.testTempC}, ${c.testHumidityPct}, ${c.sprays}, ${c.testerCount}, ${esc(c.notes)});`);
}
for (const pr of seed.prices) {
  L.push(`INSERT INTO prices (id, perfume_id, seller_id, price_inr, mrp_inr, size_ml, in_stock, product_url, checked_at, price_provenance) VALUES (${esc(pr.id)}, ${esc('perf_' + pr.perfumeSlug)}, ${esc('seller_' + pr.sellerSlug)}, ${pr.priceInr}, ${pr.mrpInr === null || pr.mrpInr === undefined ? 'NULL' : pr.mrpInr}, ${pr.sizeMl === null || pr.sizeMl === undefined ? 'NULL' : pr.sizeMl}, ${esc(pr.inStock)}, ${esc(pr.url)}, ${esc(pr.checkedAt || '2026-09-30')}, ${esc(pr.provenance || 'demo')});`);
}
for (const m of seed.users) {
  L.push(`INSERT INTO users (id, username, level, bio, signature_fragrance, favorite_fragrances, location_city, is_brand_account, is_moderator) VALUES (${esc(m.id)}, ${esc(m.username)}, ${esc(m.level)}, ${esc(m.bio)}, ${esc('perf_' + m.sig)}, ${J(m.favs.map(f => 'perf_' + f))}, ${esc(m.city)}, FALSE, FALSE);`);
}
for (const rv of seed.reviews) {
  L.push(`INSERT INTO reviews (id, user_id, perfume_id, rating, title, body, verified_purchase, helpful_votes) VALUES (${esc(rv.id)}, ${esc('user_' + rv.username)}, ${esc('perf_' + rv.perfumeSlug)}, ${rv.rating}, ${esc(rv.title)}, ${esc(rv.body)}, ${esc(rv.verifiedPurchase)}, ${rv.helpfulVotes});`);
}
for (const a of seed.articles) {
  L.push(`INSERT INTO articles (id, slug, title, category, excerpt, body, author_name, published_at, is_published) VALUES (${esc(a.id)}, ${esc(a.slug)}, ${esc(a.title)}, ${esc(a.category)}, ${esc(a.excerpt)}, ${esc(a.body)}, ${esc(a.author)}, ${esc(a.date)}, TRUE);`);
}
for (const fc of seed.forum) {
  L.push(`INSERT INTO forum_categories (id, slug, name, description, sort_order) VALUES (${esc(fc.id)}, ${esc(fc.slug)}, ${esc(fc.name)}, ${esc(fc.description)}, 0);`);
  for (const t of fc.topics) {
    L.push(`INSERT INTO forum_topics (id, category_id, user_id, title, is_pinned, is_locked, reply_count) VALUES (${esc(t.id)}, ${esc(fc.id)}, ${esc('user_' + t.author)}, ${esc(t.title)}, FALSE, FALSE, ${t.posts.length - 1});`);
    for (const p of t.posts) {
      L.push(`INSERT INTO forum_posts (id, topic_id, user_id, body) VALUES (${esc(p.id)}, ${esc(t.id)}, ${esc('user_' + p.username)}, ${esc(p.body)});`);
    }
  }
}
seed.awards.forEach((a) => {
  for (const [nomSlug, votes] of a.nominees) {
    const isHouse = a.type === 'house';
    L.push(`INSERT INTO awards (year, category, nominee_kind, nominee_perfume_id, nominee_house_id, vote_count) VALUES (${a.year}, ${esc(a.category)}, ${esc(a.type)}, ${isHouse ? 'NULL' : esc('perf_' + nomSlug)}, ${isHouse ? esc('house_' + nomSlug) : 'NULL'}, ${votes});`);
  }
});
for (const g of seed.giveaways) {
  L.push(`INSERT INTO giveaways (slug, title, description, prize, perfume_id, starts_at, ends_at, winner_user_id, is_active, entry_count) VALUES (${esc(g.slug)}, ${esc(g.title)}, ${esc(g.desc)}, ${esc(g.prize)}, ${esc('perf_' + g.perfumeSlug)}, ${esc(g.starts)}, ${esc(g.ends)}, ${g.winner ? esc('user_' + g.winner) : 'NULL'}, ${esc(g.active)}, ${g.entries});`);
}
L.push('COMMIT;');
writeFileSync(join(ROOT, 'supabase', 'seed.sql'), L.join('\n') + '\n');
console.log(`seed.sql: ${L.length} statements`);
