-- DRISHTI Supabase Schema
-- Run this in the Supabase SQL Editor at: https://supabase.com/dashboard/project/_/sql

-- ─────────────────────────────────────────────────────────────
-- 1. Vessels (real-time tanker positions)
-- ─────────────────────────────────────────────────────────────
create table if not exists vessels (
  id          text primary key,
  name        text not null,
  lat         float8 not null,
  lng         float8 not null,
  speed       float4 default 0,
  type        text default 'VLCC',
  cargo       text default 'Crude Oil',
  origin      text default 'Unknown',
  destination text default 'Unknown',
  eta         text default 'TBD',
  risk_zone   text default 'safe',
  updated_at  timestamptz default now()
);

-- ─────────────────────────────────────────────────────────────
-- 2. Simulation results (crisis broadcast to all clients)
-- ─────────────────────────────────────────────────────────────
create table if not exists simulation_results (
  id              serial primary key,
  scenario_id     text not null,
  scenario_data   jsonb,
  procurement_data jsonb,
  active          boolean default true,
  triggered_at    timestamptz default now()
);

-- ─────────────────────────────────────────────────────────────
-- 3. Risk feed (geopolitical intelligence)
-- ─────────────────────────────────────────────────────────────
create table if not exists risk_feed (
  id          uuid primary key default gen_random_uuid(),
  headline    text not null,
  source      text,
  corridor    text default 'Global',
  risk_score  int default 50,
  time_label  text,
  created_at  timestamptz default now()
);

-- ─────────────────────────────────────────────────────────────
-- 4. Enable real-time for all tables
-- ─────────────────────────────────────────────────────────────
alter publication supabase_realtime add table vessels;
alter publication supabase_realtime add table simulation_results;
alter publication supabase_realtime add table risk_feed;

-- ─────────────────────────────────────────────────────────────
-- 5. Row Level Security (permissive - open for hackathon)
-- ─────────────────────────────────────────────────────────────
alter table vessels           enable row level security;
alter table simulation_results enable row level security;
alter table risk_feed         enable row level security;

create policy "Public read"   on vessels            for select using (true);
create policy "Public insert" on vessels            for insert with check (true);
create policy "Public update" on vessels            for update using (true);

create policy "Public read"   on simulation_results for select using (true);
create policy "Public insert" on simulation_results for insert with check (true);
create policy "Public update" on simulation_results for update using (true);

create policy "Public read"   on risk_feed          for select using (true);
create policy "Public insert" on risk_feed          for insert with check (true);

-- ─────────────────────────────────────────────────────────────
-- 6. Seed initial risk feed data
-- ─────────────────────────────────────────────────────────────
insert into risk_feed (headline, source, corridor, risk_score, time_label) values
  ('Houthi rebels launch drone attack on commercial vessel near Bab-el-Mandeb strait', 'Reuters', 'Red Sea', 82, '14 min ago'),
  ('US sanctions additional Iranian oil exporters amid nuclear talks breakdown', 'Bloomberg', 'Hormuz', 71, '1 hr ago'),
  ('OPEC+ emergency meeting called as crude prices hit 3-month high', 'FT', 'Global', 58, '2 hr ago'),
  ('Saudi Aramco increases Asian crude allocation amid spot market tightening', 'S&P Global', 'Hormuz', 34, '3 hr ago'),
  ('India SPR drawdown authorized as domestic fuel prices spike', 'Economic Times', 'Domestic', 61, '4 hr ago'),
  ('Maritime security alert issued for vessels transiting Gulf of Aden', 'IMB Piracy', 'Red Sea', 74, '5 hr ago'),
  ('Russia-Ukraine conflict disrupts Caspian pipeline alternative supply routes', 'WSJ', 'CPC Pipeline', 45, '6 hr ago'),
  ('India finalizes crude oil deal with UAE for 3-year supply agreement', 'PIB India', 'Hormuz', 15, '8 hr ago')
on conflict do nothing;
