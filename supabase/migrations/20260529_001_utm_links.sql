create table if not exists utm_links (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  campaign_id   uuid references campaigns(id) on delete set null,
  influencer_id uuid references influencers(id) on delete cascade,
  slug          text not null unique,
  destination   text not null,
  promo_code    text,
  utm_campaign  text,
  utm_content   text,
  clicks        integer not null default 0,
  created_at    timestamptz default now()
);
alter table utm_links enable row level security;
create policy "Users manage own utm_links" on utm_links for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
create index if not exists utm_links_slug_idx on utm_links(slug);
create index if not exists utm_links_user_idx on utm_links(user_id);
