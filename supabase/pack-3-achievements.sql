-- Pack 3: documented projects (achievements). Run once in Supabase > SQL Editor.
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
