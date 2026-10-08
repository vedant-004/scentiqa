-- Kill-switch default row. The proxy treats a missing row as "site live"
-- (fail open), so this is a convenience default, not a load-bearing one.
insert into site_settings (key, value)
values ('maintenance_mode', '{"enabled": false}'::jsonb)
on conflict (key) do nothing;
