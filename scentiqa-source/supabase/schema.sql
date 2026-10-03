-- ============================================================
-- Scentiqa database schema (PostgreSQL / Supabase)
-- Run BEFORE supabase/seed.sql.
-- Designed for demo seed data; apply in the Supabase SQL editor
-- or with `psql` before inserting seed rows.
-- ============================================================

-- Full-text / fuzzy search support
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ---------------- Enums ----------------
DO $$ BEGIN CREATE TYPE gender_t AS ENUM ('men','women','unisex'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE concentration_t AS ENUM ('edt','edp','parfum','extrait','oil','attar','body_spray','candle'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE house_type_t AS ENUM ('designer','niche','indian_dupe','indian_clone','middle_eastern','indian_attar','mass'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
-- Research-driven additions (Sept 2026): artisan indie houses, heritage attar makers.
ALTER TYPE house_type_t ADD VALUE IF NOT EXISTS 'artisan';
ALTER TYPE house_type_t ADD VALUE IF NOT EXISTS 'attar_maker';
DO $$ BEGIN CREATE TYPE seller_type_t AS ENUM ('official','marketplace','grey','importer','brand_store'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE tested_by_t AS ENUM ('lab','community'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE nominee_kind_t AS ENUM ('house','perfume'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE wardrobe_shelf_t AS ENUM ('owned','wishlist','tried','dislike'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ---------------- Tables ----------------

CREATE TABLE IF NOT EXISTS users (
  id            text PRIMARY KEY,
  username      text NOT NULL UNIQUE,
  level         text NOT NULL DEFAULT 'Explorer',
  bio           text DEFAULT '',
  signature_fragrance text,
  favorite_fragrances jsonb NOT NULL DEFAULT '[]'::jsonb,
  location_city text,
  is_brand_account boolean NOT NULL DEFAULT false,
  is_moderator  boolean NOT NULL DEFAULT false,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS houses (
  id                  text PRIMARY KEY,
  slug                text NOT NULL UNIQUE,
  name                text NOT NULL,
  country             text NOT NULL DEFAULT '',
  region              text,
  main_activity       text NOT NULL DEFAULT '',
  website_url         text,
  house_type          house_type_t NOT NULL DEFAULT 'designer',
  description         text NOT NULL DEFAULT '',
  perfume_count       int  NOT NULL DEFAULT 0,
  earliest_year       int  NOT NULL DEFAULT 0,
  latest_year         int  NOT NULL DEFAULT 0,
  avg_similarity_score numeric(5,2),
  trust_rating        int  NOT NULL DEFAULT 3 CHECK (trust_rating BETWEEN 1 AND 5),
  founded_year        int  NOT NULL DEFAULT 0,
  view_count          bigint NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS perfumes (
  id              text PRIMARY KEY,
  slug            text NOT NULL UNIQUE,
  name            text NOT NULL,
  house_id        text NOT NULL REFERENCES houses(id) ON DELETE CASCADE,
  gender          gender_t NOT NULL DEFAULT 'unisex',
  launch_year     int  NOT NULL DEFAULT 0,
  concentration   text NOT NULL DEFAULT 'edp',
  description     text NOT NULL DEFAULT '',
  bottle_image_url text,
  rating_avg      numeric(3,2) NOT NULL DEFAULT 0,
  rating_count    int  NOT NULL DEFAULT 0,
  lowest_price_inr int,
  accords         jsonb NOT NULL DEFAULT '[]'::jsonb,
  top_notes       jsonb NOT NULL DEFAULT '[]'::jsonb,
  heart_notes     jsonb NOT NULL DEFAULT '[]'::jsonb,
  base_notes      jsonb NOT NULL DEFAULT '[]'::jsonb,
  is_discontinued boolean NOT NULL DEFAULT false,
  view_count      bigint NOT NULL DEFAULT 0,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS sellers (
  id          text PRIMARY KEY,
  slug        text NOT NULL UNIQUE,
  name        text NOT NULL,
  website_url text,
  seller_type seller_type_t NOT NULL DEFAULT 'marketplace',
  verified    boolean NOT NULL DEFAULT false,
  trust_notes text
);

CREATE TABLE IF NOT EXISTS prices (
  id          text PRIMARY KEY,
  perfume_id  text NOT NULL REFERENCES perfumes(id) ON DELETE CASCADE,
  seller_id   text NOT NULL REFERENCES sellers(id) ON DELETE CASCADE,
  price_inr   int NOT NULL CHECK (price_inr > 0),
  mrp_inr     int,
  size_ml     int, -- nullable: unknown bottle sizes are never invented
  in_stock    boolean NOT NULL DEFAULT true,
  product_url text,
  checked_at  timestamptz NOT NULL DEFAULT now(),
  price_provenance text NOT NULL DEFAULT 'demo' -- live | mixed | indexed | stale | demo
);

-- Bring older databases up to date (safe to re-run)
ALTER TABLE prices ALTER COLUMN size_ml DROP NOT NULL;
ALTER TABLE prices ADD COLUMN IF NOT EXISTS price_provenance text NOT NULL DEFAULT 'demo';

CREATE TABLE IF NOT EXISTS dupe_relationships (
  id                 text PRIMARY KEY,
  original_perfume_id text NOT NULL REFERENCES perfumes(id) ON DELETE CASCADE,
  dupe_perfume_id     text NOT NULL REFERENCES perfumes(id) ON DELETE CASCADE,
  similarity_score    numeric(5,2),
  tested_by           tested_by_t NOT NULL DEFAULT 'community',
  opening_match       numeric(5,2),
  drydown_match       numeric(5,2),
  longevity_match     numeric(5,2),
  sillage_match       numeric(5,2),
  claimed_accuracy_text text,
  verdict_text        text NOT NULL DEFAULT '',
  test_date           date,
  tester_count        int NOT NULL DEFAULT 0,
  UNIQUE (original_perfume_id, dupe_perfume_id),
  CHECK (original_perfume_id <> dupe_perfume_id)
);

CREATE TABLE IF NOT EXISTS climate_scores (
  id              text PRIMARY KEY,
  perfume_id      text NOT NULL REFERENCES perfumes(id) ON DELETE CASCADE UNIQUE,
  heat_longevity  int NOT NULL DEFAULT 3 CHECK (heat_longevity BETWEEN 1 AND 5),
  humidity_sillage int NOT NULL DEFAULT 3 CHECK (humidity_sillage BETWEEN 1 AND 5),
  summer_rating   int NOT NULL DEFAULT 3 CHECK (summer_rating BETWEEN 1 AND 5),
  monsoon_rating  int NOT NULL DEFAULT 3 CHECK (monsoon_rating BETWEEN 1 AND 5),
  winter_rating   int NOT NULL DEFAULT 3 CHECK (winter_rating BETWEEN 1 AND 5),
  test_temp_c     int NOT NULL DEFAULT 35,
  test_humidity_pct int NOT NULL DEFAULT 70,
  sprays_used     int NOT NULL DEFAULT 4,
  tester_count    int NOT NULL DEFAULT 0,
  notes           text NOT NULL DEFAULT ''
);

CREATE TABLE IF NOT EXISTS reviews (
  id               text PRIMARY KEY DEFAULT 'rev_' || substr(md5(random()::text), 1, 12),
  user_id          text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  perfume_id       text NOT NULL REFERENCES perfumes(id) ON DELETE CASCADE,
  rating           int NOT NULL CHECK (rating BETWEEN 1 AND 5),
  title            text NOT NULL DEFAULT '',
  body             text NOT NULL DEFAULT '',
  verified_purchase boolean NOT NULL DEFAULT false,
  helpful_votes    int NOT NULL DEFAULT 0,
  created_at       timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS notes (
  id          text PRIMARY KEY,
  slug        text NOT NULL UNIQUE,
  name        text NOT NULL,
  category    text NOT NULL DEFAULT 'other',
  odor_profile text NOT NULL DEFAULT ''
);

CREATE TABLE IF NOT EXISTS articles (
  id          text PRIMARY KEY,
  slug        text NOT NULL UNIQUE,
  title       text NOT NULL,
  category    text NOT NULL DEFAULT 'news',
  excerpt     text NOT NULL DEFAULT '',
  body        text NOT NULL DEFAULT '',
  author_name text NOT NULL DEFAULT 'Scentiqa Editorial',
  published_at timestamptz NOT NULL DEFAULT now(),
  is_published boolean NOT NULL DEFAULT true
);

CREATE TABLE IF NOT EXISTS forum_categories (
  id          text PRIMARY KEY,
  slug        text NOT NULL UNIQUE,
  name        text NOT NULL,
  description text NOT NULL DEFAULT '',
  sort_order  int NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS forum_topics (
  id          text PRIMARY KEY,
  category_id text NOT NULL REFERENCES forum_categories(id) ON DELETE CASCADE,
  user_id     text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title       text NOT NULL,
  is_pinned   boolean NOT NULL DEFAULT false,
  is_locked   boolean NOT NULL DEFAULT false,
  reply_count int NOT NULL DEFAULT 0,
  last_post_at timestamptz NOT NULL DEFAULT now(),
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS forum_posts (
  id        text PRIMARY KEY,
  topic_id  text NOT NULL REFERENCES forum_topics(id) ON DELETE CASCADE,
  user_id   text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  body      text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS awards (
  id                 bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  year               int NOT NULL,
  category           text NOT NULL,
  nominee_kind       nominee_kind_t NOT NULL,
  nominee_perfume_id text REFERENCES perfumes(id) ON DELETE CASCADE,
  nominee_house_id   text REFERENCES houses(id) ON DELETE CASCADE,
  vote_count         int NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS giveaways (
  slug          text PRIMARY KEY,
  title         text NOT NULL,
  description   text NOT NULL DEFAULT '',
  prize         text NOT NULL DEFAULT '',
  perfume_id    text REFERENCES perfumes(id) ON DELETE SET NULL,
  starts_at     timestamptz NOT NULL DEFAULT now(),
  ends_at       timestamptz NOT NULL DEFAULT now() + interval '14 days',
  winner_user_id text REFERENCES users(id) ON DELETE SET NULL,
  is_active     boolean NOT NULL DEFAULT true,
  entry_count   int NOT NULL DEFAULT 0
);

-- User-generated writes (lib/actions.ts)
CREATE TABLE IF NOT EXISTS community_votes (
  user_id    text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  perfume_id text NOT NULL REFERENCES perfumes(id) ON DELETE CASCADE,
  vote_type  text NOT NULL,
  vote_value text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, perfume_id, vote_type)
);

CREATE TABLE IF NOT EXISTS wardrobe_items (
  user_id    text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  perfume_id text NOT NULL REFERENCES perfumes(id) ON DELETE CASCADE,
  shelf      text NOT NULL DEFAULT 'wishlist',
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, perfume_id, shelf)
);

CREATE TABLE IF NOT EXISTS price_alerts (
  id               bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id          text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  perfume_id       text NOT NULL REFERENCES perfumes(id) ON DELETE CASCADE,
  target_price_inr int NOT NULL CHECK (target_price_inr > 0),
  created_at       timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS reports (
  id                bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  reporter_user_id  text REFERENCES users(id) ON DELETE SET NULL,
  target_type       text NOT NULL,
  target_id         text NOT NULL,
  reason            text NOT NULL DEFAULT '',
  resolved          boolean NOT NULL DEFAULT false,
  created_at        timestamptz NOT NULL DEFAULT now()
);

-- ---------------- Indexes ----------------
CREATE INDEX IF NOT EXISTS idx_perfumes_slug ON perfumes(slug);
CREATE INDEX IF NOT EXISTS idx_perfumes_house ON perfumes(house_id);
CREATE INDEX IF NOT EXISTS idx_perfumes_name_trgm ON perfumes USING gin (name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_houses_name_trgm ON houses USING gin (name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_houses_slug ON houses(slug);
CREATE INDEX IF NOT EXISTS idx_prices_perfume ON prices(perfume_id);
CREATE INDEX IF NOT EXISTS idx_prices_seller ON prices(seller_id);
CREATE INDEX IF NOT EXISTS idx_dupe_original ON dupe_relationships(original_perfume_id);
CREATE INDEX IF NOT EXISTS idx_dupe_dupe ON dupe_relationships(dupe_perfume_id);
CREATE INDEX IF NOT EXISTS idx_reviews_perfume ON reviews(perfume_id);
CREATE INDEX IF NOT EXISTS idx_articles_published ON articles(is_published, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_forum_topics_cat ON forum_topics(category_id, last_post_at DESC);
CREATE INDEX IF NOT EXISTS idx_forum_posts_topic ON forum_posts(topic_id, created_at);

-- ---------------- Verified prices view ----------------
-- The adapter reads `verified_prices` joined with `sellers(*)`:
-- lowest in-stock price per perfume from verified sellers.
CREATE OR REPLACE VIEW verified_prices AS
SELECT DISTINCT ON (p.perfume_id)
  p.perfume_id,
  p.seller_id,
  p.price_inr,
  p.mrp_inr,
  p.size_ml,
  p.in_stock,
  p.product_url,
  p.checked_at
FROM prices p
JOIN sellers s ON s.id = p.seller_id
WHERE p.in_stock AND s.verified
ORDER BY p.perfume_id, p.price_inr ASC;

-- ---------------- Similarity function ----------------
-- Note-overlap similarity between two perfumes (0-100).
-- A placeholder for editorial discovery; blind-panel scores
-- live in dupe_relationships.similarity_score.
CREATE OR REPLACE FUNCTION note_similarity(a_id text, b_id text)
RETURNS numeric AS $$
DECLARE
  a_notes jsonb; b_notes jsonb;
  a_set text[]; b_set text[];
  inter int; denom int;
BEGIN
  SELECT top_notes || heart_notes || base_notes INTO a_notes FROM perfumes WHERE id = a_id;
  SELECT top_notes || heart_notes || base_notes INTO b_notes FROM perfumes WHERE id = b_id;
  IF a_notes IS NULL OR b_notes IS NULL THEN RETURN NULL; END IF;
  SELECT ARRAY(SELECT DISTINCT jsonb_array_elements_text(a_notes)) INTO a_set;
  SELECT ARRAY(SELECT DISTINCT jsonb_array_elements_text(b_notes)) INTO b_set;
  SELECT count(*) INTO inter
  FROM unnest(a_set) AS x(n) JOIN unnest(b_set) AS y(n) ON x.n = y.n;
  denom := array_length(a_set, 1) + array_length(b_set, 1);
  IF denom IS NULL OR denom = 0 THEN RETURN NULL; END IF;
  RETURN round((2.0 * inter / denom) * 100, 1);
END;
$$ LANGUAGE plpgsql STABLE;

-- ---------------- Triggers ----------------

-- Keep perfume rating aggregates in sync with reviews.
CREATE OR REPLACE FUNCTION refresh_perfume_rating() RETURNS trigger AS $$
BEGIN
  UPDATE perfumes
  SET rating_avg = COALESCE((SELECT round(avg(rating), 2) FROM reviews WHERE perfume_id = COALESCE(NEW.perfume_id, OLD.perfume_id)), 0),
      rating_count = COALESCE((SELECT count(*) FROM reviews WHERE perfume_id = COALESCE(NEW.perfume_id, OLD.perfume_id)), 0)
  WHERE id = COALESCE(NEW.perfume_id, OLD.perfume_id);
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_reviews_rating ON reviews;
CREATE TRIGGER trg_reviews_rating
AFTER INSERT OR UPDATE OR DELETE ON reviews
FOR EACH ROW EXECUTE FUNCTION refresh_perfume_rating();

-- Keep house perfume counts in sync.
CREATE OR REPLACE FUNCTION refresh_house_counts() RETURNS trigger AS $$
BEGIN
  UPDATE houses SET perfume_count = (SELECT count(*) FROM perfumes WHERE house_id = COALESCE(NEW.house_id, OLD.house_id))
  WHERE id = COALESCE(NEW.house_id, OLD.house_id);
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_perfumes_house_count ON perfumes;
CREATE TRIGGER trg_perfumes_house_count
AFTER INSERT OR DELETE OR UPDATE OF house_id ON perfumes
FOR EACH ROW EXECUTE FUNCTION refresh_house_counts();

-- Keep house avg lab similarity in sync.
CREATE OR REPLACE FUNCTION refresh_house_similarity() RETURNS trigger AS $$
BEGIN
  UPDATE houses h SET avg_similarity_score = (
    SELECT round(avg(d.similarity_score), 1)
    FROM dupe_relationships d
    JOIN perfumes p ON p.id = d.dupe_perfume_id
    WHERE p.house_id = h.id AND d.tested_by = 'lab' AND d.similarity_score IS NOT NULL
  ) WHERE h.id IN (
    SELECT house_id FROM perfumes WHERE id IN (COALESCE(NEW.dupe_perfume_id, OLD.dupe_perfume_id), COALESCE(NEW.original_perfume_id, OLD.original_perfume_id))
  );
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_dupe_house_similarity ON dupe_relationships;
CREATE TRIGGER trg_dupe_house_similarity
AFTER INSERT OR UPDATE OR DELETE ON dupe_relationships
FOR EACH ROW EXECUTE FUNCTION refresh_house_similarity();

-- Lowest verified price per perfume (mirrors verified_prices ordering).
CREATE OR REPLACE FUNCTION refresh_lowest_price() RETURNS trigger AS $$
DECLARE pid text;
BEGIN
  pid := COALESCE(NEW.perfume_id, OLD.perfume_id);
  UPDATE perfumes SET lowest_price_inr = (
    SELECT price_inr FROM verified_prices WHERE perfume_id = pid
  ) WHERE id = pid;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_prices_lowest ON prices;
CREATE TRIGGER trg_prices_lowest
AFTER INSERT OR UPDATE OR DELETE ON prices
FOR EACH ROW EXECUTE FUNCTION refresh_lowest_price();

-- ---------------- RPC: helpful votes ----------------
CREATE OR REPLACE FUNCTION increment_helpful(review_id text)
RETURNS void AS $$
BEGIN
  UPDATE reviews SET helpful_votes = helpful_votes + 1 WHERE id = review_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ---------------- RPC: resolve a moderation report ----------------
-- The admin console (app/admin) gates access by the admin-email allowlist;
-- the function itself is SECURITY DEFINER so it works under RLS.
CREATE OR REPLACE FUNCTION resolve_report(report_id bigint)
RETURNS void AS $$
BEGIN
  UPDATE reports SET resolved = true WHERE id = report_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION resolve_report(bigint) TO authenticated;

-- ---------------- Row Level Security ----------------
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE houses ENABLE ROW LEVEL SECURITY;
ALTER TABLE perfumes ENABLE ROW LEVEL SECURITY;
ALTER TABLE sellers ENABLE ROW LEVEL SECURITY;
ALTER TABLE prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE dupe_relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE climate_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE forum_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE forum_topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE forum_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE awards ENABLE ROW LEVEL SECURITY;
ALTER TABLE giveaways ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE wardrobe_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE price_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- Public read for catalog content.
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['users','houses','perfumes','sellers','prices','dupe_relationships','climate_scores','reviews','notes','articles','forum_categories','forum_topics','forum_posts','awards','giveaways']
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I', 'public_read_' || t, t);
    EXECUTE format('CREATE POLICY %I ON %I FOR SELECT USING (true)', 'public_read_' || t, t);
  END LOOP;
END $$;

-- Authenticated users can insert their own rows; admins manage the rest.
CREATE POLICY auth_insert_reviews ON reviews
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY auth_update_own_reviews ON reviews
  FOR UPDATE TO authenticated USING (true);

CREATE POLICY auth_manage_votes ON community_votes
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY auth_manage_wardrobe ON wardrobe_items
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY auth_manage_alerts ON price_alerts
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY auth_insert_reports ON reports
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY auth_insert_forum_posts ON forum_posts
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY auth_insert_forum_topics ON forum_topics
  FOR INSERT TO authenticated WITH CHECK (true);

-- Service role bypasses RLS automatically; grant the RPC to everyone.
GRANT EXECUTE ON FUNCTION increment_helpful(text) TO anon, authenticated;
