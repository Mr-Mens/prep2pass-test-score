-- PassReady Supabase schema
-- Run this in the Supabase SQL editor.

create extension if not exists "pgcrypto";

create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  stripe_session_id text unique,
  payment_status text not null,
  full_name text not null,
  email text not null,
  lessons_taken int not null,
  test_booked boolean not null,
  test_date date null,
  mock_test_taken boolean not null,
  mock_test_result text not null,
  serious_faults int not null,
  driving_faults int not null,
  confidence_level int not null,
  weak_areas jsonb not null default '[]'::jsonb,
  extra_notes text null,
  readiness_score int not null,
  readiness_label text not null,
  summary text not null,
  risk_areas jsonb not null default '[]'::jsonb,
  next_steps jsonb not null default '[]'::jsonb,
  recommended_hours text not null,
  coach_message text not null,
  report_source text not null,
  model_name text null,
  generated_at timestamptz not null,
  raw_metadata jsonb null
);

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  stripe_session_id text not null unique,
  stripe_payment_intent_id text null,
  amount_total int null,
  currency text null,
  payment_status text not null,
  customer_email text null,
  full_name text null,
  raw_metadata jsonb null
);

create index if not exists reports_email_idx on public.reports (email);
create index if not exists reports_created_at_idx on public.reports (created_at desc);
create index if not exists payments_created_at_idx on public.payments (created_at desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists reports_set_updated_at on public.reports;
create trigger reports_set_updated_at
before update on public.reports
for each row execute procedure public.set_updated_at();
