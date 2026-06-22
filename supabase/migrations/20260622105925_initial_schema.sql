-- ─────────────────────────────────────────────────────────────────────────────
-- DRISHTI — India Energy Security Intelligence Platform
-- Initial schema: vessels, simulation_results, risk_feed
-- ─────────────────────────────────────────────────────────────────────────────

-- ── Vessels: real-time oil tanker positions ───────────────────────────────────
create table if not exists public.vessels (
  id          text        primary key,
  name        text        not null,
  lat         float8      not null,
  lng         float8      not null,
  speed       float4      default 0,
  type        text        default 'VLCC',
  cargo       text        default 'Crude Oil',
  origin      text        default 'Unknown',
  destination text        default 'Unknown',
  eta         text        default 'TBD',
  risk_zone   text        default 'safe'
                          check (risk_zone in ('hormuz','redsea','cape','safe')),
  updated_at  timestamptz default now()
);

-- ── Simulation results: crisis broadcast payload ──────────────────────────────
create table if not exists public.simulation_results (
  id               serial      primary key,
  scenario_id      text        not null,
  scenario_data    jsonb,
  procurement_data jsonb,
  active           boolean     default true,
  triggered_at     timestamptz default now()
);

-- ── Risk feed: geopolitical intelligence items ────────────────────────────────
create table if not exists public.risk_feed (
  id         uuid        primary key default gen_random_uuid(),
  headline   text        not null,
  source     text,
  corridor   text        default 'Global',
  risk_score integer     default 50 check (risk_score between 0 and 100),
  time_label text,
  created_at timestamptz default now()
);

-- ─────────────────────────────────────────────────────────────────────────────
-- Indexes
-- ─────────────────────────────────────────────────────────────────────────────
create index if not exists idx_vessels_risk_zone    on public.vessels (risk_zone);
create index if not exists idx_vessels_updated_at   on public.vessels (updated_at desc);
create index if not exists idx_sim_active            on public.simulation_results (active) where active = true;
create index if not exists idx_risk_feed_created_at on public.risk_feed (created_at desc);

-- ─────────────────────────────────────────────────────────────────────────────
-- Row Level Security  (open policies for hackathon anon-key access)
-- ─────────────────────────────────────────────────────────────────────────────
alter table public.vessels            enable row level security;
alter table public.simulation_results enable row level security;
alter table public.risk_feed          enable row level security;

-- vessels
create policy "vessels_select" on public.vessels for select using (true);
create policy "vessels_insert" on public.vessels for insert with check (true);
create policy "vessels_update" on public.vessels for update using (true);

-- simulation_results
create policy "sim_select" on public.simulation_results for select using (true);
create policy "sim_insert" on public.simulation_results for insert with check (true);
create policy "sim_update" on public.simulation_results for update using (true);

-- risk_feed
create policy "feed_select" on public.risk_feed for select using (true);
create policy "feed_insert" on public.risk_feed for insert with check (true);

-- ─────────────────────────────────────────────────────────────────────────────
-- Realtime publication
-- ─────────────────────────────────────────────────────────────────────────────
alter publication supabase_realtime add table public.vessels;
alter publication supabase_realtime add table public.simulation_results;
alter publication supabase_realtime add table public.risk_feed;
