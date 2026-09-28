-- Phase 6 P1: recurring transactions.
-- Rules generate transactions when process_recurring_for_user() is called.
-- Automated cron (Supabase Cron / Vercel Cron) is deferred; MVP runs on-demand
-- via a "Run now" button and could be wrapped in a nightly job later.

begin;

-- Order matters: drop the FK on transactions first, then the table
-- (cascade sweeps its triggers), then the enum + support fn.
-- Skipping a bare `drop trigger … on public.recurring_rules` because that
-- would error on first run when the table doesn't yet exist.
drop function if exists public.process_recurring_for_user();
alter table if exists public.transactions
  drop constraint if exists transactions_recurring_rule_id_fkey;
drop table    if exists public.recurring_rules cascade;
drop function if exists public.touch_recurring_updated_at();
drop type     if exists public.recurring_interval;

------------------------------------------------------------
-- recurring_rules
------------------------------------------------------------
create type public.recurring_interval as enum ('daily', 'weekly', 'monthly');

create table public.recurring_rules (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references auth.users(id) on delete cascade,
  category_id    uuid references public.categories(id) on delete set null,
  type           public.txn_type not null default 'expense',
  amount_minor   bigint not null check (amount_minor > 0),
  interval       public.recurring_interval not null,
  next_run_on    date not null,
  payment_method text,
  note           text,
  tags           text[] not null default '{}',
  active         boolean not null default true,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index recurring_rules_user_due_idx
  on public.recurring_rules (user_id, next_run_on)
  where active = true;

alter table public.recurring_rules enable row level security;

create policy "recurring_rules: owner all"
  on public.recurring_rules for all
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create function public.touch_recurring_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

create trigger recurring_rules_touch_updated_at
  before update on public.recurring_rules
  for each row execute function public.touch_recurring_updated_at();

-- Re-add the FK on transactions.recurring_rule_id now that the target exists.
alter table public.transactions
  add constraint transactions_recurring_rule_id_fkey
  foreign key (recurring_rule_id)
  references public.recurring_rules(id)
  on delete set null;

------------------------------------------------------------
-- process_recurring_for_user() -> {created}
--
-- Inserts one transaction per due run (next_run_on <= today) and advances
-- next_run_on by the rule's interval. Runs in a loop for rules that fall
-- behind by multiple periods (capped at 366 back-runs per rule to avoid
-- storms if a user leaves the app dormant for a year).
------------------------------------------------------------
create function public.process_recurring_for_user()
returns table (created integer)
language plpgsql
security invoker
set search_path = public
as $$
declare
  uid uuid := (select auth.uid());
  today date;
  rule record;
  step interval;
  runs integer;
  total integer := 0;
begin
  if uid is null then
    return query select 0;
    return;
  end if;

  select (now() at time zone coalesce((select timezone from public.profiles where id = uid), 'Asia/Manila'))::date
    into today;

  for rule in
    select * from public.recurring_rules
     where user_id = uid
       and active = true
       and next_run_on <= today
     order by next_run_on
  loop
    step := case rule.interval
              when 'daily'   then interval '1 day'
              when 'weekly'  then interval '7 days'
              when 'monthly' then interval '1 month'
            end;

    runs := 0;
    while rule.next_run_on <= today and runs < 366 loop
      insert into public.transactions (
        user_id, category_id, type, amount_minor, occurred_on,
        payment_method, note, tags, recurring_rule_id
      ) values (
        rule.user_id, rule.category_id, rule.type, rule.amount_minor, rule.next_run_on,
        rule.payment_method, rule.note, rule.tags, rule.id
      );

      rule.next_run_on := (rule.next_run_on + step)::date;
      runs := runs + 1;
      total := total + 1;
    end loop;

    update public.recurring_rules
       set next_run_on = rule.next_run_on
     where id = rule.id;
  end loop;

  return query select total;
end $$;

commit;
