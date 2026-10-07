-- Contact form inbox: messages submitted on /contact land here for the admin panel.
create table if not exists public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  topic text not null default 'General',
  message text not null,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.contact_messages enable row level security;
-- No public policies: inserts go through the /api/contact server route (service role),
-- reads/writes go through admin server actions (service role). Default-deny otherwise.

create index if not exists contact_messages_created_idx
  on public.contact_messages (created_at desc);
