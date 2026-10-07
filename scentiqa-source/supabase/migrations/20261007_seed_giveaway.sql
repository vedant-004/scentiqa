-- Seed the current live giveaway (replaces the previously hardcoded page content).
INSERT INTO public.giveaways (slug, title, description, prize, starts_at, ends_at, is_active, entry_count)
VALUES (
  'october-discovery-set',
  'October Discovery Set',
  '5 x 10ml discovery sets of our top lab-tested dupes. Winners announced in the forum.',
  '5 x 10ml discovery sets',
  '2026-10-01T00:00:00+05:30',
  '2026-10-31T23:59:59+05:30',
  true,
  0
)
ON CONFLICT (slug) DO NOTHING;
