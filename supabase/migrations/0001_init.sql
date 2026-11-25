-- Daily Checks: initial schema
-- Apply with `supabase db push`, or paste into Supabase Dashboard → SQL Editor.

create type public.priority as enum ('low', 'medium', 'high');
create type public.recurrence as enum ('once', 'daily', 'weekly');

-- ── profiles ───────────────────────────────────────────────────────────────
create table public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  timezone    text not null default 'UTC',
  created_at  timestamptz not null default now()
);

-- ── categories ─────────────────────────────────────────────────────────────
create table public.categories (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name         text not null check (char_length(name) between 1 and 60),
  color        text not null default '#6366f1',
  icon         text not null default '📋',
  sort_order   int  not null default 0,
  archived_at  timestamptz,
  created_at   timestamptz not null default now()
);
create index categories_user_idx on public.categories (user_id, sort_order);

-- ── tasks ──────────────────────────────────────────────────────────────────
create table public.tasks (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null default auth.uid() references auth.users (id) on delete cascade,
  category_id   uuid references public.categories (id) on delete set null,
  title         text not null check (char_length(title) between 1 and 200),
  notes         text,
  priority      public.priority   not null default 'medium',
  due_time      time,
  recurrence    public.recurrence not null default 'once',
  days_of_week  smallint[] not null default '{}',   -- 0=Sun … 6=Sat, used when recurrence = 'weekly'
  date          date,                               -- the day, when recurrence = 'once'
  start_date    date not null default current_date, -- first day a recurring task applies
  archived_at   timestamptz,
  sort_order    int not null default 0,
  created_at    timestamptz not null default now(),
  constraint once_needs_date check (recurrence <> 'once' or date is not null),
  constraint weekly_needs_days check (recurrence <> 'weekly' or cardinality(days_of_week) > 0)
);
create index tasks_user_idx on public.tasks (user_id) where archived_at is null;
create index tasks_user_date_idx on public.tasks (user_id, date);

-- ── task_completions ───────────────────────────────────────────────────────
create table public.task_completions (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null default auth.uid() references auth.users (id) on delete cascade,
  task_id       uuid not null references public.tasks (id) on delete cascade,
  date          date not null,
  completed_at  timestamptz not null default now(),
  unique (task_id, date)
);
create index completions_user_date_idx on public.task_completions (user_id, date);

-- ── Grants (RLS below still restricts rows to their owner) ───────────────
grant select, insert, update, delete
  on public.profiles, public.categories, public.tasks, public.task_completions
  to authenticated;

-- ── Row Level Security: each user sees only their own rows ─────────────────
alter table public.profiles         enable row level security;
alter table public.categories       enable row level security;
alter table public.tasks            enable row level security;
alter table public.task_completions enable row level security;

create policy "own profile" on public.profiles
  for all using (id = auth.uid()) with check (id = auth.uid());
create policy "own categories" on public.categories
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
-- Writes may only reference the user's own category / task.
create policy "own tasks" on public.tasks
  for all using (user_id = auth.uid())
  with check (
    user_id = auth.uid()
    and (category_id is null or exists (
      select 1 from public.categories c where c.id = category_id and c.user_id = auth.uid()))
  );
create policy "own completions" on public.task_completions
  for all using (user_id = auth.uid())
  with check (
    user_id = auth.uid()
    and exists (select 1 from public.tasks t where t.id = task_id and t.user_id = auth.uid())
  );

-- ── On signup: create profile + default categories ─────────────────────────
create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id) values (new.id);
  insert into public.categories (user_id, name, color, icon, sort_order) values
    (new.id, 'Home',             '#10b981', '🏠', 0),
    (new.id, 'Office',           '#3b82f6', '💼', 1),
    (new.id, 'Personal Project', '#f59e0b', '🚀', 2);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
