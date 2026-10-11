-- Search query analytics log.
-- Run in Supabase SQL editor (project rnpwligyinhxuzscrfos).
-- Created: 2026-10-12 — lets admin see what visitors actually search for.
--
-- Writes go through the service-role client in app/api/search/log/route.ts.
-- Reads go through the service-role client in app/api/search/trending/route.ts.
-- RLS is enabled with NO public policies (default deny); service role bypasses RLS.

CREATE TABLE IF NOT EXISTS search_queries (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  query         text NOT NULL,
  results_count int NOT NULL DEFAULT 0,
  user_id       uuid NULL,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_search_queries_created ON search_queries (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_search_queries_query ON search_queries (query);

ALTER TABLE search_queries ENABLE ROW LEVEL SECURITY;
-- Intentionally no policies: default deny for anon/authenticated, service-role only.
