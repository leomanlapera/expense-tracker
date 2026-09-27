# Phase 6 — P1 Features (Post-launch)

**Window:** Weeks 10–16 · **Gate:** — · **Status:** see [STATUS.md](../STATUS.md)

Prioritised by beta feedback; not all ship. Backlog (P2) sits at the bottom.

## P1 candidates

- **Recurring transactions** — daily/weekly/monthly rules, auto-created by Supabase Cron. Schema: `recurring_rules` per PRD § Data model.
- **Receipt photo upload** — private Storage bucket at `receipts/{user_id}/{transaction_id}.jpg`, storage policy matches folder to `auth.uid()`.
- **Dark mode** — follows system, manual toggle.
- **Offline entry** — queue new expenses offline, sync on reconnect.

## Prioritisation rule

Beta feedback (from Phase 5) decides order. Ship one at a time; each merges to main only after RLS + a11y checks match Gate A's bar.

## P2 backlog (not scheduled)

- CSV import (map columns from bank/spreadsheet exports)
- Multi-currency per transaction with conversion
- Email/push budget alerts (weekly summary, over-budget)
- Receipt OCR / AI categorisation
