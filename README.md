# Expense Tracker

Personal, mobile-first PHP-only expense tracker. Log an expense in under 10 seconds.
No bank login, no ads, no data sharing.

Built as a single-user tool that can grow into an invite-only beta. Storage is
Supabase (Postgres + RLS + Storage). Framework is Next.js 16 App Router with
Server Actions.

## Docs

- [PRD Personal Expense Tracker.md](./PRD%20Personal%20Expense%20Tracker.md) — product requirements, scope, success metrics.
- [PHASES.md](./PHASES.md) — 6-phase roadmap, gates, per-phase deliverables.
- [STATUS.md](./STATUS.md) — running tracker: what's done, what's next, decisions log. **Read this first.**
- [AGENTS.md](./AGENTS.md) — repo conventions and Next.js 16 gotchas for agents.

## Stack

- **Framework** — Next.js 16 (App Router, Turbopack dev, `proxy.ts` middleware).
- **UI** — React 19, Tailwind CSS v4 with CSS variables, Recharts for charts, hand-rolled primitives in `components/ui/`.
- **Data** — Supabase (Postgres + Auth + Storage). Row-level security enforced per user via `auth.uid()`. Migrations live in `supabase/migrations/` and are applied via the SQL Editor.
- **Validation** — Zod schemas in `lib/validation/`.
- **Tests** — Vitest, with a real-cloud RLS integration test that skips in CI if Supabase secrets aren't set.
- **Package manager** — pnpm 10.

## Getting started

### 1. Install

```bash
pnpm install
```

### 2. Environment

Copy `.env.local.example` to `.env.local` and fill in your Supabase project keys:

```bash
cp .env.local.example .env.local
```

You need:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SECRET_KEY` (server-only, used by admin operations and the seed script)

### 3. Apply migrations

Open the Supabase SQL Editor and run each file in [`supabase/migrations/`](./supabase/migrations) in order. Each is transactional and re-runnable. The initial one creates the `profiles` / `categories` / `transactions` / `budgets` tables and seeds ten default categories per new user via an `on_auth_user_created` trigger.

### 4. Configure Auth

In Supabase → Auth:

- Add `http://localhost:3000/auth/callback` (and later your prod URL) to **Redirect URLs**.
- **Turn off** "Allow new users to sign up" — the app is invite-only.
- Invite yourself via **Authentication → Users → Invite user**.

### 5. Run

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) and sign in with the magic link.

### 6. (Optional) Seed sample data

```bash
pnpm seed --email=you@example.com
# add --clear to wipe existing rows first
```

Inserts ~90 realistic PH-style transactions across the last 90 days, four current-month budgets, and two recurring rules.

## Scripts

| Command | What it does |
| --- | --- |
| `pnpm dev` | Next.js dev server on port 3000. |
| `pnpm build` | Production build. |
| `pnpm start` | Serve the production build. |
| `pnpm lint` | ESLint. |
| `pnpm typecheck` | `tsc --noEmit`. |
| `pnpm test` | Vitest. Cross-user RLS test skips gracefully without Supabase secrets. |
| `pnpm seed` | Seed the current user with fixture data. |

## Project layout

```
app/
  (app)/                    authenticated app routes (sidebar layout)
    dashboard/              KPIs, charts, Recent, Budgets
    transactions/           list + filters + edit
    budgets/                monthly limits, progress bars
    categories/             CRUD, per-month totals
    recurring/              scheduled rules + Run due now
    settings/               profile, export, import, danger zone
    _components/            sidebar, FAB, modal, toaster, offline banner
    _actions/               shared server actions
  api/                      REST endpoints (CSV export/import, receipts)
  auth/                     magic-link callback
  sign-in/                  public sign-in page
components/ui/              hand-rolled primitives (Card, Button, Field, Select…)
lib/
  supabase/                 server / client / middleware / admin clients
  validation/               Zod schemas
  db-types.ts               hand-rolled DB types (swap for generated later)
  date.ts money.ts          formatters (Asia/Manila, en-PH)
  toast.ts tx-bus.ts        client pub-subs
supabase/migrations/        SQL, apply in the SQL Editor
scripts/seed.ts             fixture generator
tests/                      Vitest suites
```

## Security

- Row-level security on every table, keyed to `auth.uid()`.
- Server-only Supabase admin client (`SUPABASE_SECRET_KEY`) never reaches the browser.
- Per-request nonce-based CSP issued from `proxy.ts` (`script-src` is nonced + `strict-dynamic`; `style-src` still allows `'unsafe-inline'` for Recharts inline SVGs).
- HSTS, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, strict Referrer-Policy, camera/mic/geolocation permissions denied.
- Storage bucket for receipts is private with owner-scoped RLS; downloads go through a signed-URL route handler.

## Contributing / working on this

If you're touching this codebase (as a human or an agent), read [AGENTS.md](./AGENTS.md) — the Next.js version here has breaking changes vs. training-data-era Next, and the guide files bundled under `node_modules/next/dist/docs/` are the source of truth for framework APIs.

Track ongoing work in [STATUS.md](./STATUS.md). Log every non-obvious decision to its Decisions log (one line, dated).
