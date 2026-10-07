-- Fast, precise perfume search: trigram indexes for substring matching.
-- Run in Supabase SQL editor (project rnpwligyinhxuzscrfos).
-- Created: 2026-10-07 — the site-wide search used unindexed `ilike '%q%'`
-- (sequential scan over 8.6k rows on every keystroke).

CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX IF NOT EXISTS perfumes_name_trgm_idx
  ON public.perfumes USING gin (name gin_trgm_ops);

CREATE INDEX IF NOT EXISTS houses_name_trgm_idx
  ON public.houses USING gin (name gin_trgm_ops);
