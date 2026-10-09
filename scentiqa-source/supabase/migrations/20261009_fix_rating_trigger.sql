-- Fix the rating trigger that was overwriting imported global ratings with member-review averages.
-- Background: refresh_perfume_rating() recomputed perfumes.rating_avg/rating_count from the reviews
-- table on every review write, destroying the imported global aggregates (e.g. Aventus went from
-- 4.7/18240 to 4.50/2). This migration separates the two signals permanently.

-- 1. Member-owned rating columns (the trigger writes here from now on).
ALTER TABLE perfumes ADD COLUMN IF NOT EXISTS member_rating_avg numeric(3,2) NOT NULL DEFAULT 0;
ALTER TABLE perfumes ADD COLUMN IF NOT EXISTS member_rating_count int NOT NULL DEFAULT 0;

-- 2. Backfill member ratings from the real reviews table.
UPDATE perfumes p SET
  member_rating_avg = sub.avg_r,
  member_rating_count = sub.cnt
FROM (SELECT perfume_id, round(avg(rating), 2) AS avg_r, count(*) AS cnt FROM reviews GROUP BY perfume_id) sub
WHERE p.id = sub.perfume_id;

-- 3. Repoint the trigger at the member columns. rating_avg/rating_count are now
--    the immutable imported global aggregates and are never touched by reviews.
CREATE OR REPLACE FUNCTION refresh_perfume_rating() RETURNS trigger AS $$
BEGIN
  UPDATE perfumes
  SET member_rating_avg = COALESCE((SELECT round(avg(rating), 2) FROM reviews WHERE perfume_id = COALESCE(NEW.perfume_id, OLD.perfume_id)), 0),
      member_rating_count = COALESCE((SELECT count(*) FROM reviews WHERE perfume_id = COALESCE(NEW.perfume_id, OLD.perfume_id)), 0)
  WHERE id = COALESCE(NEW.perfume_id, OLD.perfume_id);
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 4. Restore global ratings destroyed by the old trigger. All values below are the
--    verified originals from supabase/seed.sql (imported global aggregates).
UPDATE perfumes SET rating_avg = 4.50, rating_count = 13450 WHERE id = 'perf_hawas-for-him';
UPDATE perfumes SET rating_avg = 4.30, rating_count = 2310  WHERE id = 'perf_em5-br-540';
UPDATE perfumes SET rating_avg = 4.60, rating_count = 540   WHERE id = 'perf_mps-naxos-2020';
UPDATE perfumes SET rating_avg = 4.20, rating_count = 720   WHERE id = 'perf_arabian-aroma-ombre-leather';
UPDATE perfumes SET rating_avg = 4.40, rating_count = 18940 WHERE id = 'perf_club-de-nuit-intense-man';
UPDATE perfumes SET rating_avg = 4.30, rating_count = 1450  WHERE id = 'perf_em5-ocean-breeze';
UPDATE perfumes SET rating_avg = 4.60, rating_count = 540   WHERE id = 'perf_boond-maati-mitti-attar';
UPDATE perfumes SET rating_avg = 4.40, rating_count = 760   WHERE id = 'perf_mps-bleu-de-chanel';
UPDATE perfumes SET rating_avg = 4.60, rating_count = 8930  WHERE id = 'perf_sauvage-elixir';
UPDATE perfumes SET rating_avg = 4.40, rating_count = 21480 WHERE id = 'perf_sauvage-eau-de-toilette';
-- Aventus: the live row is perf_aventus-2 (slug 'aventus'); 4.7/18240 was observed on the
-- live page before the trigger overwrote it, matching the seed values for this fragrance.
UPDATE perfumes SET rating_avg = 4.70, rating_count = 18240 WHERE id = 'perf_aventus-2';
-- Dupify Aventus showed 3.00/1 with zero member reviews (no provenance); restore seed value.
UPDATE perfumes SET rating_avg = 4.10, rating_count = 980   WHERE id = 'perf_dupify-aventus';

-- 5. Three rows had their globals destroyed but no verifiable original on file.
--    Per the precision rule, clear to 0/0 (honest unknown) instead of inventing numbers.
--    Their real member ratings live in member_rating_avg/member_rating_count.
UPDATE perfumes SET rating_avg = 0, rating_count = 0
WHERE id IN ('perf_tobacco-vanille-2', 'perf_baccarat-rouge-540-2', 'perf_khamrah-2');
