-- Scentiqa standout features — F1/F2/F3/F4 data tables
-- Created: 2026-10-05
-- Tables: wear_logs (F4 diary), wear_tests (F1 climate lab),
--         battles/battle_entries/battle_matchups/battle_votes (F3 scent battles)

-- ================= F4: SOTD Wear Diary =================
create table if not exists wear_logs (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  perfume_id text not null references perfumes(id) on delete cascade,
  worn_on date not null default current_date,
  notes text,
  created_at timestamptz default now(),
  unique(user_id, perfume_id, worn_on)
);
alter table wear_logs enable row level security;
drop policy if exists "wear_logs owner access" on wear_logs;
create policy "wear_logs owner access" on wear_logs
  for all using (true) with check (true);
-- Note: user_id is text (matches existing users table convention).
-- API routes verify ownership via the authenticated session.

-- ================= F1: Climate Performance Lab =================
create table if not exists wear_tests (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  perfume_id text not null references perfumes(id) on delete cascade,
  temp_c int not null check (temp_c between 10 and 50),
  humidity_pct int check (humidity_pct between 0 and 100),
  hours_lasted numeric(4,1) not null check (hours_lasted >= 0 and hours_lasted <= 24),
  projection int not null check (projection between 1 and 5),
  sweat_survival int check (sweat_survival between 1 and 5),
  city text,
  notes text,
  tested_at timestamptz default now(),
  created_at timestamptz default now()
);
alter table wear_tests enable row level security;
drop policy if exists "wear_tests public read" on wear_tests;
create policy "wear_tests public read" on wear_tests for select using (true);
drop policy if exists "wear_tests insert" on wear_tests;
create policy "wear_tests insert" on wear_tests for insert with check (true);

-- Aggregated climate stats per perfume (refreshed by recompute function / API)
create table if not exists perfume_climate_stats (
  perfume_id text primary key references perfumes(id) on delete cascade,
  test_count int not null default 0,
  avg_hours numeric(4,2),
  avg_projection numeric(3,2),
  avg_sweat numeric(3,2),
  avg_temp_c numeric(4,1),
  heat_score numeric(4,2),
  updated_at timestamptz default now()
);
alter table perfume_climate_stats enable row level security;
drop policy if exists "perfume_climate_stats public read" on perfume_climate_stats;
create policy "perfume_climate_stats public read" on perfume_climate_stats for select using (true);

-- ================= F3: Scent Battles =================
create table if not exists battles (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  theme text,
  status text not null default 'upcoming' check (status in ('upcoming','active','completed')),
  starts_at timestamptz,
  ends_at timestamptz,
  created_at timestamptz default now()
);
alter table battles enable row level security;
drop policy if exists "battles public read" on battles;
create policy "battles public read" on battles for select using (true);

create table if not exists battle_entries (
  battle_id uuid not null references battles(id) on delete cascade,
  perfume_id text not null references perfumes(id) on delete cascade,
  seed int,
  primary key (battle_id, perfume_id)
);
alter table battle_entries enable row level security;
drop policy if exists "battle_entries public read" on battle_entries;
create policy "battle_entries public read" on battle_entries for select using (true);

create table if not exists battle_matchups (
  id uuid primary key default gen_random_uuid(),
  battle_id uuid not null references battles(id) on delete cascade,
  round int not null default 1,
  perfume_a_id text not null references perfumes(id) on delete cascade,
  perfume_b_id text not null references perfumes(id) on delete cascade,
  votes_a int not null default 0,
  votes_b int not null default 0,
  winner_id text references perfumes(id) on delete set null,
  created_at timestamptz default now()
);
alter table battle_matchups enable row level security;
drop policy if exists "battle_matchups public read" on battle_matchups;
create policy "battle_matchups public read" on battle_matchups for select using (true);

create table if not exists battle_votes (
  matchup_id uuid not null references battle_matchups(id) on delete cascade,
  user_id text not null,
  perfume_id text not null references perfumes(id) on delete cascade,
  created_at timestamptz default now(),
  primary key (matchup_id, user_id)
);
alter table battle_votes enable row level security;
drop policy if exists "battle_votes public read" on battle_votes;
create policy "battle_votes public read" on battle_votes for select using (true);
drop policy if exists "battle_votes insert" on battle_votes;
create policy "battle_votes insert" on battle_votes for insert with check (true);

-- Helpful indexes
create index if not exists idx_wear_logs_user_date on wear_logs(user_id, worn_on desc);
create index if not exists idx_wear_tests_perfume on wear_tests(perfume_id);
create index if not exists idx_battle_matchups_battle on battle_matchups(battle_id, round);
create index if not exists idx_battle_votes_matchup on battle_votes(matchup_id);
