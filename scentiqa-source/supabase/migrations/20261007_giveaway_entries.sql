-- Giveaway entries: one entry per user per giveaway.
CREATE TABLE IF NOT EXISTS public.giveaway_entries (
  id            text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  giveaway_slug text NOT NULL REFERENCES public.giveaways(slug) ON DELETE CASCADE,
  user_id       text NOT NULL,
  created_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (giveaway_slug, user_id)
);

ALTER TABLE public.giveaway_entries ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'giveaway_entries_owner' AND tablename = 'giveaway_entries') THEN
    CREATE POLICY giveaway_entries_owner ON public.giveaway_entries
      FOR ALL USING ((auth.uid())::text = user_id) WITH CHECK ((auth.uid())::text = user_id);
  END IF;
END $$;
