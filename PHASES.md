# Project Phases — Personal Expense Tracker

Derived from `PRD Personal Expense Tracker.md` (roadmap: 5 phases, 2 gates, ~8 weeks to MVP, launch in week 9, P1 through week 16). Running status: [STATUS.md](./STATUS.md).

## Phases

| # | Phase | Window | Gate | File |
| --- | --- | --- | --- | --- |
| 1 | Foundation | W1–W2 | — | [phases/phase-1-foundation.md](./phases/phase-1-foundation.md) |
| 2 | Core Data & CRUD | W3–W4 | — | [phases/phase-2-core-data.md](./phases/phase-2-core-data.md) |
| 3 | Dashboard & Budgets | W5–W6 | — | [phases/phase-3-dashboard-budgets.md](./phases/phase-3-dashboard-budgets.md) |
| 4 | Polish, Export, PWA | W7–W8 | **Gate A — MVP Ready** | [phases/phase-4-polish-pwa.md](./phases/phase-4-polish-pwa.md) |
| 5 | Beta & Launch | W9 | **Gate B — Public Launch** | [phases/phase-5-beta-launch.md](./phases/phase-5-beta-launch.md) |
| 6 | P1 Features (post-launch) | W10–W16 | — | [phases/phase-6-p1-features.md](./phases/phase-6-p1-features.md) |

## Gates

- **Gate A — MVP Ready** (end of Phase 4): all P0 features work end-to-end, RLS cross-user test green, Lighthouse mobile green. Checklist lives in `phase-4-polish-pwa.md`.
- **Gate B — Public Launch** (end of Phase 5): custom domain, Supabase Pro, custom SMTP, error tracking live. Checklist lives in `phase-5-beta-launch.md`.

## Open questions (block Phase 5 planning)

From PRD § Open Questions — need answers before Gate B:
- Personal tool only or public product? (Vercel Hobby vs Pro)
- Multi-currency at launch, or PHP-only?
- Wallets as accounts-with-balances, or just a payment-method tag?
- App name + domain

## Working notes

- Update phase state (⚪ → 🟡 → 🟢) in `STATUS.md`, not here.
- Each phase file owns its own deliverables, exit criteria, and gate checklist. Edit those in place when scope shifts.
- Add a new phase file if scope expands; append a row to the table above.
