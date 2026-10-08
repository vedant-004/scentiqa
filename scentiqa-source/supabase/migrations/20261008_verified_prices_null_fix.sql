-- Fix verified_prices: exclude NULL price_inr rows (2026-10-08).
-- DISTINCT ON with ORDER BY price_inr ASC picks NULLs first in Postgres, so a
-- research-only row with NULL price could become the "lowest verified price"
-- and wipe out lowest_price_inr even when real in-stock prices exist.
-- (Live example: pr_buy_perf_aventus_creed-official has NULL price_inr.)
-- Run in the Supabase SQL editor. Safe to re-run.

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
WHERE p.in_stock AND s.verified AND p.price_inr IS NOT NULL
ORDER BY p.perfume_id, p.price_inr ASC;

-- Backfill lowest_price_inr for any perfumes affected by the old NULL-picking behavior:
-- UPDATE perfumes SET lowest_price_inr = (
--   SELECT price_inr FROM verified_prices WHERE perfume_id = perfumes.id
-- ) WHERE lowest_price_inr IS NULL;
