-- 2026-10-14: wardrobe visibility control (Private / Public).
-- Default Private: a wardrobe is visible only to its owner until they choose Public.
-- NOTE: not yet applied to production — run in the Supabase SQL editor.
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS wardrobe_visibility text NOT NULL DEFAULT 'private';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'users_wardrobe_visibility_check'
  ) THEN
    ALTER TABLE public.users
      ADD CONSTRAINT users_wardrobe_visibility_check
      CHECK (wardrobe_visibility IN ('private', 'public'));
  END IF;
END $$;
