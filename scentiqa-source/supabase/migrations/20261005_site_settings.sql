-- Site-wide editable settings for the admin panel.
-- Run this in the Supabase SQL editor (project rnpwligyinhxuzscrfos).
create table if not exists site_settings (
  key text primary key,
  value jsonb not null default '{}',
  updated_at timestamptz default now()
);

alter table site_settings enable row level security;

-- Public read so the homepage can render hero/banner/POTD override.
-- Writes go through the admin panel's service-role client (bypasses RLS).
drop policy if exists "site_settings public read" on site_settings;
create policy "site_settings public read" on site_settings
  for select using (true);
