-- Personal Expense Tracker — initial schema
-- Tables: profiles, categories, transactions, budgets
-- RLS locked to auth.uid() on every row.
-- Money stored as bigint minor units (centavos): ₱1,250.50 = 125050.

-- Wrapped in a transaction so a bad statement rolls back the whole apply.
begin;

-- Idempotent reset — safe to re-run this file during initial setup.
drop trigger  if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_user();
drop table    if exists public.budgets       cascade;
drop table    if exists public.transactions  cascade;
drop table    if exists public.categories    cascade;
drop table    if exists public.profiles      cascade;
drop function if exists public.touch_updated_at();
drop type     if exists public.txn_type;

------------------------------------------------------------
-- profiles
------------------------------------------------------------
create table public.profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  currency     text not null default 'PHP',
  timezone     text not null default 'Asia/Manila',
  created_at   timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles: owner can select"
  on public.profiles for select
  using ((select auth.uid()) = id);

create policy "profiles: owner can update"
  on public.profiles for update
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

------------------------------------------------------------
-- categories
------------------------------------------------------------
create type public.txn_type as enum ('expense', 'income');

create table public.categories (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  name       text not null,
  icon       text,
  color      text,
  type       public.txn_type not null default 'expense',
  archived   boolean not null default false,
  created_at timestamptz not null default now(),
  unique (user_id, name, type)
);

create index categories_user_type_idx on public.categories (user_id, type) where archived = false;

alter table public.categories enable row level security;

create policy "categories: owner all"
  on public.categories for all
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

------------------------------------------------------------
-- transactions
------------------------------------------------------------
create table public.transactions (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references auth.users(id) on delete cascade,
  category_id       uuid references public.categories(id) on delete set null,
  type              public.txn_type not null,
  amount_minor      bigint not null check (amount_minor > 0),
  occurred_on       date not null default (now() at time zone 'Asia/Manila')::date,
  payment_method    text,
  note              text,
  tags              text[] not null default '{}',
  receipt_path      text,
  recurring_rule_id uuid,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index transactions_user_date_idx
  on public.transactions (user_id, occurred_on desc, created_at desc);

create index transactions_user_category_idx
  on public.transactions (user_id, category_id)
  where category_id is not null;

-- RLS narrows to the user; per-user tag lookups then hit this GIN over the
-- text[] column. Skip rows without tags so the index stays small.
create index transactions_tags_idx
  on public.transactions using gin (tags)
  where tags <> '{}';

alter table public.transactions enable row level security;

create policy "transactions: owner all"
  on public.transactions for all
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

create trigger transactions_touch_updated_at
  before update on public.transactions
  for each row execute function public.touch_updated_at();

------------------------------------------------------------
-- budgets
------------------------------------------------------------
create table public.budgets (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  category_id  uuid not null references public.categories(id) on delete cascade,
  month        date not null,
  limit_minor  bigint not null check (limit_minor > 0),
  created_at   timestamptz not null default now(),
  unique (user_id, category_id, month),
  check (month = date_trunc('month', month)::date)
);

create index budgets_user_month_idx on public.budgets (user_id, month desc);

alter table public.budgets enable row level security;

create policy "budgets: owner all"
  on public.budgets for all
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

------------------------------------------------------------
-- new-user bootstrap: profile + 10 default categories
------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)));

  insert into public.categories (user_id, name, icon, color, type) values
    (new.id, 'Food',      'utensils',      '#f97316', 'expense'),
    (new.id, 'Transport', 'car',           '#0ea5e9', 'expense'),
    (new.id, 'Bills',     'file-text',     '#a855f7', 'expense'),
    (new.id, 'Shopping',  'shopping-bag',  '#ec4899', 'expense'),
    (new.id, 'Health',    'heart-pulse',   '#ef4444', 'expense'),
    (new.id, 'Home',      'home',          '#84cc16', 'expense'),
    (new.id, 'Fun',       'sparkles',      '#eab308', 'expense'),
    (new.id, 'Personal',  'user',          '#64748b', 'expense'),
    (new.id, 'Gifts',     'gift',          '#14b8a6', 'expense'),
    (new.id, 'Other',     'ellipsis',      '#94a3b8', 'expense'),
    (new.id, 'Salary',    'briefcase',     '#22c55e', 'income'),
    (new.id, 'Other',     'ellipsis',      '#94a3b8', 'income');

  return new;
end $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

commit;
