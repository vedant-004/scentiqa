-- Seed: Monsoon Madness 2026 battle (8 popular perfumes, fresh/aquatic-leaning for monsoon)
-- Created: 2026-10-05

do $$
declare
  bid uuid;
  pid text;
  i int := 0;
begin
  -- Create the battle if it doesn't exist
  select id into bid from battles where title = 'Monsoon Madness 2026';
  if bid is null then
    insert into battles (title, theme, status, starts_at, ends_at)
    values (
      'Monsoon Madness 2026',
      'Monsoon Madness — 8 fresh, rain-ready scents. Single elimination. You vote, India decides.',
      'active',
      now(),
      now() + interval '7 days'
    ) returning id into bid;
  end if;

  -- Pick 8 popular perfumes (prefer fresh/aquatic/citrus for the monsoon theme,
  -- fill with top-rated otherwise). Real catalog data only.
  for pid in
    select p.id from perfumes p
    order by
      (case when p.accords::text ilike '%aquatic%' or p.accords::text ilike '%fresh%' or p.accords::text ilike '%citrus%' then 0 else 1 end),
      coalesce(p.rating_count, 0) desc
    limit 8
  loop
    i := i + 1;
    insert into battle_entries (battle_id, perfume_id, seed)
    values (bid, pid, i)
    on conflict (battle_id, perfume_id) do update set seed = excluded.seed;
  end loop;

  -- Generate round-1 bracket (seed 1 vs 8, 2 vs 7, 3 vs 6, 4 vs 5)
  delete from battle_matchups where battle_id = bid and round = 1;
  with seeded as (
    select perfume_id, seed from battle_entries where battle_id = bid order by seed
  ),
  ranked as (
    select perfume_id, row_number() over (order by seed) as rn, count(*) over () as n
    from seeded
  )
  insert into battle_matchups (battle_id, round, perfume_a_id, perfume_b_id)
  select bid, 1, r1.perfume_id, r2.perfume_id
  from ranked r1
  join ranked r2 on r2.rn = r1.n - r1.rn + 1
  where r1.rn <= r1.n / 2;

  raise notice 'Battle % seeded with % entries', bid, i;
end $$;
