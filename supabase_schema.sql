-- SQL Schema for Converso/Dienvo AI Teaching Platform
-- Run this in your Supabase SQL Editor.

-- Enable UUID extension (should be enabled by default)
create extension if not exists "uuid-ossp";

-- 1. Create Companions Table
create table if not exists public.companions (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  subject text not null,
  topic text not null,
  voice text not null,
  style text not null,
  duration integer not null,
  author text not null, -- Stores the Clerk User ID (sub claim)
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Index for querying companions by author
create index if not exists companions_author_idx on public.companions (author);

-- Enable Row-Level Security for companions
alter table public.companions enable row level security;

-- Create policy to allow authenticated users to perform all operations on their own companions
create policy "Manage own companions"
  on public.companions
  for all
  to authenticated
  using (
    (select nullif(current_setting('request.jwt.claims', true)::json->>'sub', '')) = author
  )
  with check (
    (select nullif(current_setting('request.jwt.claims', true)::json->>'sub', '')) = author
  );


-- 2. Create Sessions Table
create table if not exists public.sessions (
  id uuid default gen_random_uuid() primary key,
  companion_id text not null, -- Can be UUID (for custom companions) or static ID (like '123' for popular ones)
  name text not null,         -- Companion's name
  subject text not null,
  topic text not null,
  duration integer not null,  -- Actual duration of the session in minutes (or seconds if preferred, we use minutes)
  author text not null,       -- Clerk User ID
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Index for querying sessions by author
create index if not exists sessions_author_idx on public.sessions (author);

-- Enable Row-Level Security for sessions
alter table public.sessions enable row level security;

-- Create policy to allow authenticated users to perform all operations on their own sessions
create policy "Manage own sessions"
  on public.sessions
  for all
  to authenticated
  using (
    (select nullif(current_setting('request.jwt.claims', true)::json->>'sub', '')) = author
  )
  with check (
    (select nullif(current_setting('request.jwt.claims', true)::json->>'sub', '')) = author
  );
