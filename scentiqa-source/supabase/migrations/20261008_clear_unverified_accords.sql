-- Remove unverified inferred accords (2026-10-08).
-- "Sirrah" by Tiziana Terenzi and "Black Vanille" by Mancera carried accords
-- that were inferred, not source-verified. Per the precision standard, unverified
-- fields stay empty rather than showing invented data.
-- Run in the Supabase SQL editor.

UPDATE perfumes
SET accords = '[]'::jsonb
WHERE id IN ('perf_sirrah', 'perf_black-vanille');

-- Verify:
-- SELECT id, name, accords FROM perfumes WHERE id IN ('perf_sirrah', 'perf_black-vanille');
