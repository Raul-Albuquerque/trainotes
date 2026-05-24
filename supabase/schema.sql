-- ============================================================
-- Trainotes — Supabase Schema
-- Run this in the Supabase SQL Editor for your project.
-- ============================================================

-- 1. profiles
-- ============================================================
create table if not exists profiles (
  id                  uuid primary key references auth.users(id) on delete cascade,
  email               text not null,
  display_name        text,
  default_weight_unit text not null default 'kg' check (default_weight_unit in ('kg', 'lb')),
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

alter table profiles enable row level security;

create policy "owner full access" on profiles
  for all
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, display_name)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'display_name'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


-- 2. workout_templates
-- ============================================================
create table if not exists workout_templates (
  id           uuid primary key,
  user_id      uuid not null references auth.users(id) on delete cascade,
  name         text not null,
  description  text,
  workout_type text not null default 'strength' check (workout_type in ('strength', 'cardio')),
  status       text not null default 'active' check (status in ('active', 'archived')),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  deleted_at   timestamptz
);

alter table workout_templates enable row level security;

create policy "owner full access" on workout_templates
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index if not exists idx_templates_user_active
  on workout_templates(user_id) where deleted_at is null;

create index if not exists idx_templates_user_updated
  on workout_templates(user_id, updated_at);


-- 3. template_exercises
-- ============================================================
create table if not exists template_exercises (
  id               uuid primary key,
  user_id          uuid not null references auth.users(id) on delete cascade,
  template_id      uuid not null references workout_templates(id) on delete cascade,
  name             text not null,
  order_index      int not null default 0,
  target_sets      int not null default 3,
  target_reps_min  int not null default 8,
  target_reps_max  int not null default 12,
  rest_seconds     int not null default 90,
  notes            text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  deleted_at       timestamptz
);

alter table template_exercises enable row level security;

create policy "owner full access" on template_exercises
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index if not exists idx_template_ex_template
  on template_exercises(template_id, order_index);

create index if not exists idx_template_ex_user_updated
  on template_exercises(user_id, updated_at);


-- 4. workout_sessions
-- ============================================================
create table if not exists workout_sessions (
  id           uuid primary key,
  user_id      uuid not null references auth.users(id) on delete cascade,
  template_id  uuid references workout_templates(id) on delete set null,
  title        text not null,
  performed_at timestamptz not null default now(),
  status       text not null default 'in_progress' check (status in ('in_progress', 'completed', 'archived')),
  workout_type text not null default 'strength' check (workout_type in ('strength', 'cardio')),
  notes        text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  deleted_at   timestamptz
);

alter table workout_sessions enable row level security;

create policy "owner full access" on workout_sessions
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index if not exists idx_sessions_user_date
  on workout_sessions(user_id, performed_at desc);

create index if not exists idx_sessions_user_updated
  on workout_sessions(user_id, updated_at);


-- 5. session_exercises
-- ============================================================
create table if not exists session_exercises (
  id                   uuid primary key,
  user_id              uuid not null references auth.users(id) on delete cascade,
  session_id           uuid not null references workout_sessions(id) on delete cascade,
  template_exercise_id uuid references template_exercises(id) on delete set null,
  name                 text not null,
  order_index          int not null default 0,
  notes                text,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now(),
  deleted_at           timestamptz
);

alter table session_exercises enable row level security;

create policy "owner full access" on session_exercises
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index if not exists idx_session_ex_session
  on session_exercises(session_id, order_index);

create index if not exists idx_session_ex_user_updated
  on session_exercises(user_id, updated_at);


-- 6. session_sets
-- ============================================================
create table if not exists session_sets (
  id                  uuid primary key,
  user_id             uuid not null references auth.users(id) on delete cascade,
  session_id          uuid not null references workout_sessions(id) on delete cascade,
  session_exercise_id uuid not null references session_exercises(id) on delete cascade,
  set_index           int not null default 1,
  reps                int not null default 0,
  weight              numeric(7,3) not null default 0,
  weight_unit         text not null default 'kg' check (weight_unit in ('kg', 'lb')),
  duration_seconds    int,
  notes               text,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  deleted_at          timestamptz
);

alter table session_sets enable row level security;

create policy "owner full access" on session_sets
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index if not exists idx_session_sets_exercise
  on session_sets(session_exercise_id, set_index);

create index if not exists idx_session_sets_session
  on session_sets(session_id);

create index if not exists idx_session_sets_user_updated
  on session_sets(user_id, updated_at);


-- ============================================================
-- Migration: run this block if the tables already exist
-- (safe to run even on a fresh schema — all statements are idempotent)
-- ============================================================

alter table workout_templates
  add column if not exists workout_type text not null default 'strength'
    check (workout_type in ('strength', 'cardio'));

alter table workout_sessions
  add column if not exists workout_type text not null default 'strength'
    check (workout_type in ('strength', 'cardio'));

alter table session_sets
  add column if not exists duration_seconds int;

-- reps was NOT NULL without a default in the original schema;
-- make it safe for cardio rows where reps is irrelevant
alter table session_sets
  alter column reps set default 0;
