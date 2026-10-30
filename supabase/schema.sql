-- Run this once in Supabase > SQL Editor.

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  major text,
  academic_year int check (academic_year between 1 and 5),
  target_role text,
  language text default 'ar',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users (id) on delete cascade,
  target_role text not null,
  match_score int not null check (match_score between 0 and 100),
  analysis jsonb not null,
  completed_steps text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.progress enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
drop policy if exists "profiles_insert_own" on public.profiles;
drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_select_own" on public.profiles for select using (auth.uid() = id);
create policy "profiles_insert_own" on public.profiles for insert with check (auth.uid() = id);
create policy "profiles_update_own" on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "progress_select_own" on public.progress;
drop policy if exists "progress_insert_own" on public.progress;
drop policy if exists "progress_update_own" on public.progress;
create policy "progress_select_own" on public.progress for select using (auth.uid() = user_id);
create policy "progress_insert_own" on public.progress for insert with check (auth.uid() = user_id);
create policy "progress_update_own" on public.progress for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Create a profile row automatically for every new user (email or Google).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------
-- v2: courses, skills, and readiness-score history
-- ---------------------------------------------------------------
alter table public.profiles add column if not exists courses text[] not null default '{}';
alter table public.profiles add column if not exists skills text[] not null default '{}';

create table if not exists public.score_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  target_role text not null,
  score int not null check (score between 0 and 100),
  created_at timestamptz not null default now()
);
create index if not exists score_history_user_idx on public.score_history (user_id, target_role, created_at);

alter table public.score_history enable row level security;
drop policy if exists "history_select_own" on public.score_history;
drop policy if exists "history_insert_own" on public.score_history;
create policy "history_select_own" on public.score_history for select using (auth.uid() = user_id);
create policy "history_insert_own" on public.score_history for insert with check (auth.uid() = user_id);

create table if not exists public.achievements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  target_role text not null,
  step_id text not null,
  step_title text not null,
  project_title text not null,
  description text not null,
  project_url text,
  created_at timestamptz not null default now(),
  unique (user_id, target_role, step_id)
);

alter table public.achievements enable row level security;
drop policy if exists "achievements_select_own" on public.achievements;
drop policy if exists "achievements_insert_own" on public.achievements;
drop policy if exists "achievements_update_own" on public.achievements;
drop policy if exists "achievements_delete_own" on public.achievements;
create policy "achievements_select_own" on public.achievements for select using (auth.uid() = user_id);
create policy "achievements_insert_own" on public.achievements for insert with check (auth.uid() = user_id);
create policy "achievements_update_own" on public.achievements for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "achievements_delete_own" on public.achievements for delete using (auth.uid() = user_id);

notify pgrst, 'reload schema';

alter table public.achievements add column if not exists kind text not null default 'project';
alter table public.achievements add column if not exists provider text;
alter table public.achievements add column if not exists issued_on date;
alter table public.progress add column if not exists learning text[] not null default '{}';

notify pgrst, 'reload schema';
