-- Missing user feature tables for Scentiqa
-- Run in Supabase SQL editor (project rnpwligyinhxuzscrfos)
-- Created: 2026-10-05 during comprehensive audit

-- Wardrobe: user's perfume collection shelves
create table if not exists wardrobe_items (
  user_id uuid not null references auth.users(id) on delete cascade,
  perfume_id text not null references perfumes(id) on delete cascade,
  shelf text not null default 'owned',
  created_at timestamptz default now(),
  primary key (user_id, perfume_id, shelf)
);
alter table wardrobe_items enable row level security;
drop policy if exists "wardrobe_items owner access" on wardrobe_items;
create policy "wardrobe_items owner access" on wardrobe_items
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Community votes: longevity/sillage/etc. votes per perfume
create table if not exists community_votes (
  user_id uuid not null references auth.users(id) on delete cascade,
  perfume_id text not null references perfumes(id) on delete cascade,
  vote_type text not null,
  vote_value text not null,
  created_at timestamptz default now(),
  primary key (user_id, perfume_id, vote_type)
);
alter table community_votes enable row level security;
drop policy if exists "community_votes owner access" on community_votes;
create policy "community_votes owner access" on community_votes
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
-- Public read for aggregate counts (adjust if aggregates are computed differently)
drop policy if exists "community_votes public read" on community_votes;
create policy "community_votes public read" on community_votes
  for select using (true);
