# Phase 2 — Core Data & CRUD

**Window:** Weeks 3–4 · **Gate:** — · **Status:** see [STATUS.md](../STATUS.md)

The 10-second-entry loop. Categories, transactions, income — all locked down by RLS.

## Deliverables

- Tables: `categories`, `transactions`, `budgets` (schema per PRD § Data model)
- RLS policies on every table (`user_id = auth.uid()`), plus cross-user integration test
- 10 default categories seeded on sign-up
- Add / edit / delete expense via Server Actions, Zod-validated
- Income entries (same form, `type = income`)
- Amounts stored as `bigint` minor units — never floats
- Transaction list: grouped by day, infinite scroll, filter by month/category/tag, text search
- Optimistic UI on add

## Exit criteria

Logging an expense on a mid-range Android takes ≤ 10 s and ≤ 3 taps.

## Notes & watch-outs

- Every table gets `select`, `insert`, `update`, `delete` policies keyed to `auth.uid()` — no exceptions.
- Money: ₱1,250.50 → `125050`. Convert only at the edge (display, CSV export).
- Index `transactions (user_id, occurred_on desc)` from day one — list view depends on it.
- Cross-user RLS test signs in as user A, tries to read/write user B's rows, asserts 0 rows / error.
