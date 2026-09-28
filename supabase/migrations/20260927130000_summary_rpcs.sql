-- Phase 3: dashboard summary RPCs.
-- All aggregation lives in Postgres. The browser never sums transactions.
-- Both functions filter by (select auth.uid()) so RLS + policies stay honest.

begin;

drop function if exists public.monthly_summary(date);
drop function if exists public.daily_totals(date);
drop function if exists public.budget_status(date);

------------------------------------------------------------
-- monthly_summary(month_start) -> per-category totals for that month
------------------------------------------------------------
create function public.monthly_summary(month_start date)
returns table (
  category_id  uuid,
  category_name text,
  category_color text,
  type         public.txn_type,
  total_minor  bigint
)
language sql
stable
security invoker
set search_path = public
as $$
  select
    c.id,
    c.name,
    c.color,
    t.type,
    sum(t.amount_minor)::bigint as total_minor
  from public.transactions t
  left join public.categories c on c.id = t.category_id
  where t.user_id = (select auth.uid())
    and t.occurred_on >= date_trunc('month', month_start)::date
    and t.occurred_on <  (date_trunc('month', month_start) + interval '1 month')::date
  group by c.id, c.name, c.color, t.type
  order by total_minor desc;
$$;

------------------------------------------------------------
-- daily_totals(month_start) -> per-day expense/income for that month
------------------------------------------------------------
create function public.daily_totals(month_start date)
returns table (
  occurred_on   date,
  expense_minor bigint,
  income_minor  bigint
)
language sql
stable
security invoker
set search_path = public
as $$
  select
    t.occurred_on,
    coalesce(sum(t.amount_minor) filter (where t.type = 'expense'), 0)::bigint as expense_minor,
    coalesce(sum(t.amount_minor) filter (where t.type = 'income'),  0)::bigint as income_minor
  from public.transactions t
  where t.user_id = (select auth.uid())
    and t.occurred_on >= date_trunc('month', month_start)::date
    and t.occurred_on <  (date_trunc('month', month_start) + interval '1 month')::date
  group by t.occurred_on
  order by t.occurred_on;
$$;

------------------------------------------------------------
-- budget_status(month_start) -> per-budget spend vs limit for that month
------------------------------------------------------------
create function public.budget_status(month_start date)
returns table (
  budget_id     uuid,
  category_id   uuid,
  category_name text,
  category_color text,
  limit_minor   bigint,
  spent_minor   bigint
)
language sql
stable
security invoker
set search_path = public
as $$
  select
    b.id                                             as budget_id,
    c.id                                             as category_id,
    c.name                                           as category_name,
    c.color                                          as category_color,
    b.limit_minor,
    coalesce((
      select sum(t.amount_minor)
      from public.transactions t
      where t.user_id = b.user_id
        and t.category_id = b.category_id
        and t.type = 'expense'
        and t.occurred_on >= b.month
        and t.occurred_on <  (b.month + interval '1 month')::date
    ), 0)::bigint                                    as spent_minor
  from public.budgets b
  join public.categories c on c.id = b.category_id
  where b.user_id = (select auth.uid())
    and b.month = date_trunc('month', month_start)::date
  order by c.name;
$$;

commit;
