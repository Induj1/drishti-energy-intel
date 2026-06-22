create table if not exists public.telegram_chats (
  id bigserial primary key,
  chat_id text unique not null,
  username text,
  first_name text,
  active boolean default true,
  created_at timestamptz default now()
);

alter table public.telegram_chats enable row level security;
create policy "open_select" on public.telegram_chats for select using (true);
create policy "open_insert" on public.telegram_chats for insert with check (true);
create policy "open_update" on public.telegram_chats for update using (true);

alter publication supabase_realtime add table public.telegram_chats;
