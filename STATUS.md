# STATUS — Personal Expense Tracker

**Last updated:** 2026-09-27 · **Current phase:** Phase 1 — Foundation · **Week:** 1 of 16 · **Next gate:** Gate A (MVP Ready), end of Week 8

Plan lives in [PHASES.md](./PHASES.md). This file is the running tracker — update it as things move.

---

## At a glance

| Phase | Window | State | Gate |
| --- | --- | --- | --- |
| 1 · Foundation | W1–W2 | 🟡 In progress | — |
| 2 · Core Data & CRUD | W3–W4 | ⚪ Not started | — |
| 3 · Dashboard & Budgets | W5–W6 | ⚪ Not started | — |
| 4 · Polish, Export, PWA | W7–W8 | ⚪ Not started | **Gate A** |
| 5 · Beta & Launch | W9 | ⚪ Not started | **Gate B** |
| 6 · P1 Features | W10–W16 | ⚪ Not started | — |

Legend: ⚪ not started · 🟡 in progress · 🟢 done · 🔴 blocked

---

## Current sprint — Phase 1 (Foundation)

### Todo — cloud + auth wiring
- [ ] Create Supabase project; enable publishable/secret keys, disable legacy anon/service_role
- [ ] Fill `.env.local` from `.env.local.example`
- [ ] Wire magic-link submit + Google OAuth in `app/sign-in/page.tsx` (client action calls `signInWithOtp` / `signInWithOAuth`)
- [ ] Add `app/auth/callback/route.ts` to exchange the code for a session
- [ ] `profiles` table + on-sign-up trigger (default `currency = 'PHP'`, timezone from client)
- [ ] Push repo to GitHub, connect Vercel, wire env vars in Vercel
- [ ] Bump Next.js to ≥ 16.3.7 once the Sep 30 security release lands

### Done
- [x] PRD finalised (2026-09-27)
- [x] Phases + tracker set up (2026-09-27)
- [x] Next.js 16.3.6 scaffolded (App Router, TS, Tailwind 4.3, ESLint) (2026-09-27)
- [x] `@supabase/supabase-js` + `@supabase/ssr` + Zod + Recharts installed (2026-09-27)
- [x] Tailwind v4 CSS-first `@theme` with app tokens (incl. budget ok/warn/over) (2026-09-27)
- [x] Supabase server/browser clients + `proxy.ts` session refresher; env-gated so scaffold runs without keys (2026-09-27)
- [x] Base layout, `/dashboard` shell, `/sign-in` stub (unwired), `/` → dashboard redirect (2026-09-27)
- [x] GitHub Actions CI: typecheck + lint + build; Renovate config committed (2026-09-27)
- [x] Git repo initialised by CNA (2026-09-27)

### Deferred / notes
- shadcn/ui init skipped — interactive prompts don't script well. Add when first real component (form/input) is needed in Phase 2.
- Next.js 16 renamed `middleware` → `proxy`; using `proxy.ts` at root.

---

## Blockers & risks

_(none yet — track anything that stalls > 1 day here)_

Watchlist from PRD § Risks:
- Next.js monthly security release cadence → patch within 7 days
- Supabase free-tier project pause during quiet beta → move to Pro before Gate B
- Magic-link deliverability → custom SMTP before Gate B

---

## Decisions log

Append as decisions are made — one line each, dated.

- 2026-09-27 — Adopt PRD as source of truth for scope; P0 = MVP, P1 = post-launch, P2 = backlog.
- 2026-09-27 — Scaffold lives at repo root (not a subdir); docs sit alongside app code.
- 2026-09-27 — Package manager: pnpm 10.
- 2026-09-27 — Cloud setup deferred — local scaffold first, real Supabase/Vercel wiring next session.
- 2026-09-27 — Next.js 16 middleware convention renamed to `proxy`; using `proxy.ts`.

---

## Open questions (owner: June)

Answers needed before Phase 5 planning:
- [ ] Personal-only or public + paid tier? (drives Vercel Hobby vs Pro)
- [ ] Multi-currency at launch, or PHP-only?
- [ ] Wallets as accounts-with-balances, or payment-method tag only?
- [ ] App name + domain

---

## Metrics (fill in post-launch)

| Metric | Target | Actual |
| --- | --- | --- |
| Time to log an expense | < 10 s median | — |
| Day-7 retention | ≥ 35% | — |
| Day-30 retention | ≥ 20% | — |
| Users with ≥ 1 budget | ≥ 50% | — |
| Mobile LCP | < 2.5 s | — |

---

## How to use this file

- Update **At a glance** when a phase flips state.
- Move todos through **Todo → In progress → Done** as you work; keep the current-sprint block scoped to the active phase only.
- Log every non-obvious decision in **Decisions log** (one line, dated). Don't rewrite history — append.
- When a gate is hit, tick its checklist in `PHASES.md` and note the date here under Decisions.
