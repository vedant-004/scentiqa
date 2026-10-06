-- Scentiqa Awards system: proper categories (Fragrantica-style + Indian twist),
-- manual winners, admin-managed nominees.
-- Run in the Supabase SQL editor. Safe to re-run (all inserts guarded).

-- 1) Category table ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS award_categories (
  id            bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  year          int NOT NULL,
  slug          text NOT NULL,
  name          text NOT NULL,
  description   text NOT NULL DEFAULT '',
  icon          text NOT NULL DEFAULT '🏆',
  section       text NOT NULL DEFAULT 'global' CHECK (section IN ('global', 'indian')),
  nominee_type  text NOT NULL DEFAULT 'perfume' CHECK (nominee_type IN ('perfume', 'house')),
  sort_order    int NOT NULL DEFAULT 0,
  created_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (year, slug)
);

-- 2) Nominee rows: link to a category slug + manual winner flag ----------------
ALTER TABLE awards ADD COLUMN IF NOT EXISTS category_slug text;
ALTER TABLE awards ADD COLUMN IF NOT EXISTS is_winner boolean NOT NULL DEFAULT false;

-- Backfill category_slug from the legacy free-text category for old rows
UPDATE awards
SET category_slug = lower(regexp_replace(trim(category), '[^a-zA-Z0-9]+', '-', 'g'))
WHERE category_slug IS NULL;

-- 3) Seed 2026 categories: Indian section first (our identity), then global ----
-- sort_order 10..90 = indian, 110.. = global

INSERT INTO award_categories (year, slug, name, description, icon, section, nominee_type, sort_order)
VALUES
-- INDIAN SECTION ------------------------------------------------------------
(2026, 'ultimate-winner-2026', 'Ultimate Winner 2026',
 'The single finest fragrance in India this year. Our highest honour.',
 '🏆', 'indian', 'perfume', 10),

(2026, 'best-indian-clone-house-2026', 'Best Indian Clone House 2026',
 'The desi house making luxury scents affordable for everyone.',
 '🧪', 'indian', 'house', 20),

(2026, 'desi-scent-2026', 'Desi Scent of the Year 2026',
 'The fragrance that smells most like modern India.',
 '🇮🇳', 'indian', 'perfume', 30),

(2026, 'best-attar-2026', 'Best Attar 2026',
 'Pure oil, zero alcohol. The timeless art of Kannauj and beyond.',
 '🪔', 'indian', 'perfume', 40),

(2026, 'monsoon-beast-2026', 'Monsoon Beast 2026',
 'Which scent survives Indian humidity and still turns heads? Our climate wear-tests decide.',
 '🌧️', 'indian', 'perfume', 50),

(2026, 'budget-king-2026', 'Best Value Under ₹1,000 2026',
 'Maximum compliments per rupee. No scent here costs more than a thousand.',
 '👑', 'indian', 'perfume', 60),

(2026, 'shadi-season-2026', 'Shadi Season Star 2026',
 'The ultimate wedding-season fragrance for baraats that go past midnight.',
 '💒', 'indian', 'perfume', 70),

(2026, 'best-aventus-clone-2026', 'Best Aventus Clone 2026',
 'Everyone wants the king of perfumes. Who copies it best in India?',
 '🎯', 'indian', 'perfume', 80),

(2026, 'rising-star-indian-house-2026', 'Rising Star: Best New Indian House 2026',
 'The fresh desi brand to watch. New names shaking up the scene.',
 '🚀', 'indian', 'house', 90),

-- GLOBAL SECTION (Fragrantica-style) ------------------------------------------
(2026, 'best-womens-2026', 'Best Women''s Fragrance 2026',
 'The most loved women''s scent of the year, worldwide.',
 '👑', 'global', 'perfume', 110),

(2026, 'best-mens-2026', 'Best Men''s Fragrance 2026',
 'The most loved men''s scent of the year, worldwide.',
 '🤵', 'global', 'perfume', 120),

(2026, 'best-unisex-2026', 'Best Unisex Fragrance 2026',
 'No labels, just great perfume. The best scent for everyone.',
 '⚖️', 'global', 'perfume', 130),

(2026, 'best-niche-2026', 'Best Niche Fragrance 2026',
 'Artistic, rare and uncompromising. Niche perfumery at its peak.',
 '💎', 'global', 'perfume', 140),

(2026, 'best-designer-2026', 'Best Designer Fragrance 2026',
 'The best mainstream designer release of the year.',
 '✨', 'global', 'perfume', 150),

(2026, 'best-newcomer-2026', 'Best New Launch 2026',
 'The debut or new release that made the biggest splash.',
 '🆕', 'global', 'perfume', 160),

(2026, 'best-gourmand-2026', 'Best Gourmand 2026',
 'Vanilla, chocolate, coffee, caramel. The most delicious scent of the year.',
 '🍯', 'global', 'perfume', 170),

(2026, 'best-oud-2026', 'Best Oud Fragrance 2026',
 'Smoky, rich, majestic. The finest oud of the year.',
 '🌙', 'global', 'perfume', 180),

(2026, 'best-bottle-2026', 'Best Bottle Design 2026',
 'Perfume you buy with your eyes first. Pure shelf candy.',
 '🏺', 'global', 'perfume', 190),

(2026, 'best-house-2026', 'Best Fragrance House 2026',
 'The house with the strongest lineup this year, top to bottom.',
 '🏠', 'global', 'house', 200),

(2026, 'hall-of-fame', 'Hall of Fame: All-Time Legends',
 'Scents that never fade. The immortal classics of perfumery.',
 '🏛️', 'global', 'perfume', 210)
ON CONFLICT (year, slug) DO NOTHING;

-- 4) Preserve the existing editorial pick: MPS Tygar as 2026 Ultimate Winner ---
INSERT INTO awards (year, category, category_slug, nominee_kind, nominee_perfume_id, vote_count, is_winner)
SELECT 2026, 'Ultimate Winner 2026', 'ultimate-winner-2026', 'perfume', p.id, 0, true
FROM perfumes p
JOIN houses h ON h.id = p.house_id
WHERE p.name ILIKE '%tygar%' AND h.slug = 'my-perfume-secrets'
AND NOT EXISTS (
  SELECT 1 FROM awards
  WHERE year = 2026 AND category_slug = 'ultimate-winner-2026' AND is_winner = true
)
LIMIT 1;

-- 5) Read access for the public site (anon can read; writes go via service role)
ALTER TABLE award_categories ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "public read award_categories" ON award_categories FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "public read awards" ON awards FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
