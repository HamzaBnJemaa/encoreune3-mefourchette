-- Only needed if you host with Supabase instead of Firebase.
-- Run ONCE in Supabase → SQL Editor → New query → Run

create table if not exists public.products (id text primary key, data jsonb not null, created_at timestamptz not null default now());
create table if not exists public.orders   (id text primary key, data jsonb not null, created_at timestamptz not null default now());
create table if not exists public.couriers (id text primary key, data jsonb not null, created_at timestamptz not null default now());

-- Lock the tables: only the server (service key) can read/write them.
alter table public.products enable row level security;
alter table public.orders   enable row level security;
alter table public.couriers enable row level security;

-- Public bucket for product photos
insert into storage.buckets (id, name, public) values ('products', 'products', true)
on conflict (id) do update set public = true;
