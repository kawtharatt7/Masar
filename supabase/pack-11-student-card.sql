-- Run once in Supabase > SQL Editor.
-- Adds the nickname and character the student picks after signing in.

alter table public.profiles add column if not exists nickname text;
alter table public.profiles add column if not exists avatar text;

alter table public.profiles drop constraint if exists profiles_avatar_check;
alter table public.profiles add constraint profiles_avatar_check check (avatar is null or avatar in ('girl', 'boy'));

notify pgrst, 'reload schema';
