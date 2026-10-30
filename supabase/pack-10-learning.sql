-- Pack 10: courses and certifications as achievements. Run once in Supabase > SQL Editor.
alter table public.achievements add column if not exists kind text not null default 'project';
alter table public.achievements add column if not exists provider text;
alter table public.achievements add column if not exists issued_on date;
alter table public.progress add column if not exists learning text[] not null default '{}';

notify pgrst, 'reload schema';
