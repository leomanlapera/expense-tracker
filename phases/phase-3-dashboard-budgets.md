# Phase 3 — Dashboard & Budgets

**Window:** Weeks 5–6 · **Gate:** — · **Status:** see [STATUS.md](../STATUS.md)

Turn the raw ledger into a monthly view people actually check.

## Deliverables

- `monthly_summary(month)` view/RPC (DB sums, not the browser)
- Dashboard: month total, income vs expense, spend by category (Recharts donut), daily trend (line)
- Monthly budget per category with progress bars
- In-app warnings at 80% and 100%
- PHP currency formatting via `Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' })`
- Dates in user timezone (stored on `profiles`)

## Exit criteria

User can set a budget, log against it, and see the 80% warning fire.

## Notes & watch-outs

- Aggregations run in Postgres, not in the browser — protects mobile perf as history grows.
- Budget uniqueness: `(user_id, category_id, month)` where `month` is the 1st of month.
- Charts need text summaries for WCAG (deferred pass in Phase 4, but design for it now).
