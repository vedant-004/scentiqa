-- 2026-10-04: sync Supabase Auth signups into public.users.
-- community_votes, wardrobe_items, reviews and price_alerts all FK to
-- public.users(id), but nothing created that row on signup, so every
-- authenticated write failed. This trigger + helper fix that.

CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  base_username text;
  final_username text;
BEGIN
  base_username := COALESCE(
    NULLIF(NEW.raw_user_meta_data ->> 'name', ''),
    NULLIF(split_part(NEW.email, '@', 1), ''),
    'member'
  );
  base_username := regexp_replace(lower(base_username), '[^a-z0-9_]', '_', 'g');
  final_username := base_username;
  WHILE EXISTS (SELECT 1 FROM public.users WHERE username = final_username AND id <> NEW.id::text) LOOP
    final_username := base_username || '_' || substr(md5(NEW.id::text), 1, 6);
  END LOOP;
  INSERT INTO public.users (id, username)
  VALUES (NEW.id::text, final_username)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_auth_user();

-- Backfill helper for accounts created before the trigger existed.
-- SECURITY DEFINER so it can write public.users despite RLS.
CREATE OR REPLACE FUNCTION public.ensure_public_user()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid text := auth.uid()::text;
  uemail text := NULLIF(auth.jwt() ->> 'email', '');
  base_username text;
  final_username text;
BEGIN
  IF uid IS NULL THEN RETURN; END IF;
  IF EXISTS (SELECT 1 FROM public.users WHERE id = uid) THEN RETURN; END IF;
  base_username := COALESCE(NULLIF(split_part(uemail, '@', 1), ''), 'member');
  base_username := regexp_replace(lower(base_username), '[^a-z0-9_]', '_', 'g');
  final_username := base_username;
  WHILE EXISTS (SELECT 1 FROM public.users WHERE username = final_username) LOOP
    final_username := base_username || '_' || substr(md5(uid), 1, 6);
  END LOOP;
  INSERT INTO public.users (id, username)
  VALUES (uid, final_username)
  ON CONFLICT (id) DO NOTHING;
END;
$$;

GRANT EXECUTE ON FUNCTION public.ensure_public_user() TO authenticated;
