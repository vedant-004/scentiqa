-- Newsletter subscribers: emails captured by the footer + homepage signup forms.
-- Single opt-in; no emails are sent yet. Inserts go through /api/newsletter
-- (service role); reads go through admin (service role). Default-deny otherwise.
create table if not exists public.newsletter_subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  source text not null default 'site',
  created_at timestamptz not null default now()
);

alter table public.newsletter_subscribers enable row level security;
-- No public policies: inserts go through the /api/newsletter server route
-- (service role), reads go through admin server actions (service role).

create index if not exists newsletter_subscribers_created_idx
  on public.newsletter_subscribers (created_at desc);
