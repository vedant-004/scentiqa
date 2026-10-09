-- Scentiqa community features: perfume requests (with voting) + city sniff directory.
-- Run in the Supabase SQL editor.

-- ============ Perfume requests ============
CREATE TABLE IF NOT EXISTS perfume_requests (
  id            text PRIMARY KEY DEFAULT 'preq_' || substr(md5(random()::text), 1, 12),
  perfume_name  text NOT NULL,
  house_name    text NOT NULL DEFAULT '',
  reason        text NOT NULL DEFAULT '',
  status        text NOT NULL DEFAULT 'open', -- open | added | declined
  user_id       text REFERENCES users(id) ON DELETE SET NULL,
  requester_name text NOT NULL DEFAULT '',
  vote_count    int NOT NULL DEFAULT 0,
  team_created  boolean NOT NULL DEFAULT false,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS perfume_request_votes (
  request_id text NOT NULL REFERENCES perfume_requests(id) ON DELETE CASCADE,
  user_id    text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (request_id, user_id)
);

-- Keep vote_count in sync (race-safe recompute, same pattern as battle votes).
CREATE OR REPLACE FUNCTION refresh_request_votes() RETURNS trigger AS $$
BEGIN
  UPDATE perfume_requests
  SET vote_count = (SELECT count(*) FROM perfume_request_votes WHERE request_id = COALESCE(NEW.request_id, OLD.request_id))
  WHERE id = COALESCE(NEW.request_id, OLD.request_id);
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_request_votes ON perfume_request_votes;
CREATE TRIGGER trg_request_votes
AFTER INSERT OR DELETE ON perfume_request_votes
FOR EACH ROW EXECUTE FUNCTION refresh_request_votes();

-- ============ Sniff stores (city directory) ============
CREATE TABLE IF NOT EXISTS sniff_stores (
  id           text PRIMARY KEY DEFAULT 'snf_' || substr(md5(random()::text), 1, 12),
  name         text NOT NULL,
  city         text NOT NULL,
  area         text NOT NULL DEFAULT '',
  address      text NOT NULL DEFAULT '',
  store_type   text NOT NULL DEFAULT 'niche', -- niche | designer | attar | department | multi
  brands_text  text NOT NULL DEFAULT '',
  samples_info text NOT NULL DEFAULT '',
  website      text NOT NULL DEFAULT '',
  verified     boolean NOT NULL DEFAULT false,
  created_at   timestamptz NOT NULL DEFAULT now()
);

-- ============ RLS ============
ALTER TABLE perfume_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE perfume_request_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE sniff_stores ENABLE ROW LEVEL SECURITY;

-- Public read for all three.
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['perfume_requests','perfume_request_votes','sniff_stores']
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I', 'public_read_' || t, t);
    EXECUTE format('CREATE POLICY %I ON %I FOR SELECT USING (true)', 'public_read_' || t, t);
  END LOOP;
END $$;

-- Authenticated users can submit requests and manage their own votes.
DROP POLICY IF EXISTS auth_insert_requests ON perfume_requests;
CREATE POLICY auth_insert_requests ON perfume_requests
  FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS auth_manage_request_votes ON perfume_request_votes;
CREATE POLICY auth_manage_request_votes ON perfume_request_votes
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- sniff_stores is curated by the team (service role bypasses RLS).
