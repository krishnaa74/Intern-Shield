-- Run this once in Supabase: SQL Editor > New query > paste > Run

create table if not exists public.reports (
  id bigint generated always as identity primary key,
  indicator_type text not null check (indicator_type in ('email', 'domain', 'phone')),
  indicator_value text not null,
  scam_type text,
  reporter_hash text not null,          -- salted hash of the reporter, so one person can't report twice
  created_at timestamptz not null default now(),
  unique (indicator_type, indicator_value, reporter_hash)
);

create index if not exists reports_value_idx on public.reports (indicator_value);

-- Lock the table: no public access. Only your server (service role key) can read or write.
alter table public.reports enable row level security;
