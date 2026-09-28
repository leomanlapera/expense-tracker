# STATUS — Personal Expense Tracker

**Last updated:** 2026-09-28 · **Current phase:** Phase 4 — Polish, Export, PWA · **Week:** 1 of 16 · **Next gate:** Gate A (MVP Ready), end of Week 8

Plan lives in [PHASES.md](./PHASES.md). This file is the running tracker — update it as things move.

---

## At a glance

| Phase | Window | State | Gate |
| --- | --- | --- | --- |
| 1 · Foundation | W1–W2 | 🟢 Done | — |
| 2 · Core Data & CRUD | W3–W4 | 🟢 Done | — |
| 3 · Dashboard & Budgets | W5–W6 | 🟢 Done | — |
| 4 · Polish, Export, PWA | W7–W8 | 🟡 In progress | **Gate A** |
| 5 · Beta & Launch | W9 | ⚪ Not started | **Gate B** |
| 6 · P1 Features | W10–W16 | ⚪ Not started | — |

Legend: ⚪ not started · 🟡 in progress · 🟢 done · 🔴 blocked

---

## Current sprint — Phase 4 (Polish, Export, PWA → Gate A)

### Todo — needs you
- [ ] Test PWA "Add to Home Screen" on a real iPhone (Safari) and Android Chrome.
- [ ] Push to GitHub + connect Vercel; set env vars in Vercel (URL / publishable / secret).
- [ ] Enable Supabase MFA (TOTP) for your own account before beta.

### Todo — Phase 4 close-out
- [ ] Manual a11y check on a real device: keyboard traversal (Tab order, focus visible), VoiceOver/TalkBack sweep, 4.5:1 contrast spot-checks against WCAG AA.
- [ ] Lighthouse mobile pass on the live URL — target ≥ 90 perf / 100 a11y.
- [ ] Full PWA offline queue (service worker + IndexedDB + background sync) — banner ships, sync deferred to a dedicated pass.

### Done (Phase 4 so far)
- [x] **Settings redesign** (`settings/page.tsx`, `profile-form.tsx`, `import-form.tsx`, `delete-account-form.tsx`, new `export-form.tsx`) — (2026-09-28):
  - **Layout**: Export + Import now share a 2-col band on `lg` (both are data-in/out). Explicit divider before Danger zone so it stops feeling like just another card.
  - **Profile**: 2-col grid for Display name + Timezone; action row right-aligned under a top border. Timezone options show GMT offset (`Asia/Manila (GMT+8)`) computed once at module load — no hydration risk.
  - **Export**: two shortcut buttons kept, plus a new **Custom range** mini-form (from / to + Download). Native `<form method="get">` → `/api/export/transactions.csv` — browser navigates, response is `Content-Disposition: attachment`, download triggers, page stays put. Zero JS.
  - **Import**: card subtitle trimmed; dense CSV column spec moved into an inline `<details>Expected format</details>`. Selected filename shown as the field hint after pick. Result surface upgraded to a summary panel — "Imported N · Skipped M · truncated…" — with a nested `<details>` for row-level skip reasons.
  - **Danger zone**: same action-row-under-a-border pattern as Profile / Import, with a red-tinted divider. Delete button no longer shares a row with the confirmation input.
- [x] **Payment method display fix** (`lib/validation/transaction.ts`, `transactions/transaction-form.tsx`, `recurring/new-recurring-form.tsx`, `transactions/transaction-list.tsx`) — payment dropdowns were showing raw values (`gcash`, `maya`) as labels. New `PAYMENT_METHOD_LABELS` map keeps DB values lowercase (schema untouched) but labels render as `GCash`, `Maya`, `Cash`, `Debit`, `Credit`. List row badge dropped the `uppercase` CSS transform (would've flattened "GCash" back to "GCASH"). Also killed a duplicate `PAYMENT_METHODS` list in the recurring form — now imports from the shared source. (2026-09-28)
- [x] **Receipt field hidden on create/edit; edit page fills** (`transactions/transaction-form.tsx`, `add-expense-form.tsx`, `[id]/edit/edit-transaction-form.tsx`, `[id]/edit/page.tsx`) — added a `showReceipt` prop to `TransactionForm` (default true). Modal + edit forms both pass `showReceipt={false}`. Edit page dropped its inner `max-w-2xl` on the Card so the form fills the outer `max-w-6xl` main. (2026-09-28)
- [x] **Transactions filter form redesign** (`transactions/page.tsx` + new `transactions/sort-select.tsx`) — (2026-09-28):
  - Killed the redundant "Search all time" checkbox inside the Month field — the "All time" preset chip already owned range switching. Two affordances, one intent.
  - Moved **Sort** out of the filter grid into a dedicated toolbar row above the list. New client `SortSelect` mirrors `MonthPicker`'s live-nav pattern (`useRouter.push` inside `useTransition`) and preserves every other search param so a sort change doesn't wipe filters.
  - Filter grid dropped from 5 uneven columns to **4 balanced columns** on lg (Month · Category · Tag · Search); still stacks on mobile.
  - "Search notes" label → "Search" (placeholder "Notes, e.g. grocery" carries the specificity).
  - **Apply + Clear** buttons right-aligned in their own row separated by a top border — action rhythm reads more clearly than the previous flex-wrapped left-aligned cluster.
  - Sort URL param preserved on filter-form submit via a hidden input; the `all=1` flag likewise.
  - **Bugfix** (latent): preset chips previously hardcoded their href to `?month=X` / `?all=1`, wiping any active category / q / tag / sort. Now build the URL from a preserved-params helper so range switching keeps whatever the user was filtering to.
- [x] **UX polish pass 3** — bundle of six small wins from a walkthrough audit (2026-09-28):
  - **BudgetProgress no longer lies when over limit** (`budgets/budget-progress.tsx`) — bar still clamps to 100%, but the caption swaps from "125% used" to "Over by ₱X · 125% of limit" and the `aria-label` on the progressbar matches. `warn` caption becomes "X% used · nearing limit".
  - **Distinct upload/save phases in TransactionForm** (`transactions/transaction-form.tsx`) — new local `uploading` state. Submit button reads "Uploading receipt…" during the storage PUT, "Saving…" during the server action, "Save" otherwise. Disabled the whole time.
  - **Modal inerts the background** (`_components/quick-add-modal.tsx` + sidebar/fab/layout) — mount effect adds `inert` on every `[data-inert-when-modal]` element (sidebar mobile bar, aside, FAB, `#main`) and removes it on unmount. Screen readers and Tab can't reach the page underneath.
  - **DeleteButton aria-label reflects pending** (`transactions/delete-button.tsx`) — three states: "Delete transaction" → "Confirm delete" → "Deleting transaction".
  - **Required-field markers** (`transactions/transaction-form.tsx`) — small red `*` on Amount and Category legends only. Optional fields (note / tags / receipt) stay unmarked so the asymmetry does the teaching.
  - **EmptyState primitive** (`components/ui/empty-state.tsx`) — dashed border + muted tint, `title` / `description` / `action` slots. Replaces four inconsistent variants across `transactions/transaction-list.tsx` (filter vs month empties), `budgets/page.tsx`, `categories/page.tsx`, `recurring/page.tsx`. Dashboard's Recent + Budgets card fallbacks stay inline because they render inside a filled `Card` (double border would fight).
- [x] **Optimistic Recent on dashboard** — quick-add modal saves publish the inserted row via a new `lib/tx-bus.ts` pub-sub. Dashboard Recent card is now the client component `dashboard/recent.tsx`; it prepends any published row as a "ghost" (`app-fade-in` on first paint) so the entry appears the instant the server confirms, bridging the ~200–500ms `revalidatePath` refetch. Ghosts dedupe by id as soon as the RSC refetch delivers the real row. `createTransaction` now `.select()`s the inserted row + joined category so the payload is complete without an extra RTT. Kept the classic `useState` pattern — `useOptimistic` doesn't cleanly fit when the form and the list live in different subtrees (the dispatch's transition ends immediately). `/transactions` list is intentionally skipped since it has month/category/tag filters a naive prepend would violate (2026-09-28)
- [x] **Nonce-based CSP** — `proxy.ts` now generates a per-request base64 UUID nonce and emits the `Content-Security-Policy` header with `script-src 'self' 'nonce-…' 'strict-dynamic'`. `'unsafe-inline'` is off for scripts; `'unsafe-eval'` is dev-only (React error reconstruction). Nonce threads through `lib/supabase/middleware.ts` so Supabase cookie refreshes and redirects preserve it. Root layout is now async and reads `x-nonce` via `headers()` to stamp the theme-boot inline `<script>`; Next.js auto-nonces framework/hydration scripts by parsing the request-side CSP header. `next.config.ts` no longer sets CSP (the other security headers stay static). Style-src still allows `'unsafe-inline'` because Recharts inlines styles into SVGs (2026-09-28)
- [x] **Breadcrumbs** primitive (`components/ui/breadcrumbs.tsx`) — chevron-separated links, current page rendered as plain text. Wired above `PageHeader` on every app page (dashboard / transactions / transactions/[id]/edit / budgets / categories / recurring / settings).
- [x] **Settings forms — single-row layouts** on sm+: Profile (name + timezone + Save), Import (file + Import), Danger (DELETE + Delete).
- [x] **Consistent 40px (h-10) baseline** on every form control: `TextInput`, custom `Select` trigger, `Button` (md), file inputs on `/settings` and the transaction receipt, color pickers on `/categories`. Small buttons use `h-8`. Rows in one-line forms now truly line up.
- [x] Removed the now-unused `SelectInput` helper from `field.tsx` (everything moved to the custom `Select`).
- [x] **Removed redundant inline nav links** now that breadcrumbs + sidebar cover navigation: dropped "All transactions →" from dashboard header, "All →" from Recent card, "Manage →" from Budgets card, "← Dashboard" from `/transactions`, "← Back" from `/edit`. Card actions slot only used for operations (MonthPicker, Run due now, etc.) — never plain nav.
- [x] **Quick-add modal + centralized selects**:
  - Add-expense form promoted from an inline dashboard card to a real **modal** (open on Escape close, click-outside close, backdrop, body-scroll lock). Trigger via a prominent **"+ New transaction"** accent button at the top of the sidebar, the mobile FAB, or the `n` shortcut.
  - Data (categories, recent-tag suggestions, current-tz-today, user id) fetched once in the `(app)` layout and passed to the modal — no per-page duplication, no extra RTTs.
  - Dashboard drops its Add-expense card (and the fetches it needed). Now purely: KPIs, charts, Recent, Budgets.
  - FAB hidden on desktop (sidebar button already visible); still shows on mobile above the safe-area.
  - `lib/quick-add.ts` — a 20-line pub-sub. `openQuickAdd()` from any client component fires the modal.
  - Every remaining native `<select>` audited (only the internal `SelectInput` helper in `field.tsx` is left, unused). All in-app dropdowns now use the custom `Select`.
- [x] **UX/UI pass 2** (feedback fixes):
  - **Consistent page width** — every page now uses `max-w-6xl`. No more jumping widths between dashboard / transactions / budgets / settings.
  - **Custom Select** (`components/ui/select.tsx`) — button + popover pattern, keyboard-nav (arrow / Home / End / letter jump), Escape closes, click-outside closes, ARIA listbox, emits a hidden `<input name>` so it plugs into plain `<form>`s. Replaced every `<select>` on the app: category / sort / tag filters, budget category, category type on create, timezone, recurring category + type + interval + payment. `useSyncExternalStore`-free but written to avoid the `set-state-in-effect` lint (open/highlight collapsed into a single toggle).
  - **Loading skeleton aligned to the dashboard** — mirrors PageHeader, KPI trio, chart pair, and the 3fr:2fr Recent + Budgets band exactly (same `max-w-6xl` + gaps). No more "layout jumps" when content lands.
  - **Button width audit** — TransactionForm Save, DeleteAccountForm submit, and other action buttons swapped to the `Button` primitive (content-width). Only main containers and form inputs are `w-full` now.
  - **Add expense/income redesigned** — three explicit steps: type toggle → big amount input (wrapped ₱ + inline focus ring) → category pills → collapsible "More details" (date / payment / note / tags / receipt). Sub-10-second entry path: type, amount, category, Save. Edit view opens the "More" section by default so nothing is hidden.
  - **Grid rhythm** — `/transactions` filter grid drops to `sm:grid-cols-2` at tablet width before expanding to `lg:grid-cols-5`. Edit page uses `max-w-6xl` main + `max-w-2xl` inner card for form legibility.
- [x] **UX/UI pass 1**:
  - New primitives under `components/ui/`: `Card` + `CardHeader` (tone: default / muted / warn / danger; padding: none / tight / base), `PageHeader` (eyebrow / title / description / actions slots), `Field` + `TextInput` / `SelectInput` / `TextareaInput`, `Button` (primary / secondary / ghost / danger).
  - Sidebar redesigned: brand mark with product name + "Personal · PHP" eyebrow; on **mobile** now collapses to a top-bar with a hamburger that opens a proper slide-in drawer (backdrop, close button, close-on-navigate). Desktop stays sticky. `min-h-[44px]` on nav items and sign-out for real tap targets.
  - Dashboard reworked: `max-w-7xl` content, 3-col KPI band, **2-col charts side-by-side on lg** (donut / daily-trend), Recent + Budgets in a **3:2 two-column band on lg** (both fall back to full-width, both have empty-state cards), add-expense card at the bottom.
  - Every page (`/transactions`, `/budgets`, `/categories`, `/recurring`, `/settings`) migrated to `PageHeader` + `Card` + `Field/TextInput/SelectInput` — consistent header rhythm and card borders.
  - FAB gets `bottom-[max(1.5rem, env(safe-area-inset-bottom))]` so it doesn't hide behind the iOS home indicator.
  - Removed the duplicate mobile sign-out button (drawer now owns it).
  - Deferred: individual form components (transaction-form's pill grid, category-row inline editor, delete-account confirm) still use bespoke styling — page-level Card + PageHeader is the highest-impact win, and the bespoke controls need their own visual language.
- [x] `pnpm seed --email=<email> [--clear]` script: auto-creates the auth user if missing (waits for the seed trigger's categories to land), inserts ~90 realistic PH-style transactions across the last 90 days, 4 current-month budgets, 2 recurring rules. Uses `SUPABASE_SECRET_KEY` from `.env.local`. Ships with the same `ws` polyfill dance as the RLS tests for Node 20 (2026-09-27)
- [x] **CSV import** (P2 pulled forward): `POST /api/import/transactions.csv` accepts multipart with our own export format (`date,type,category,amount_php,payment_method,note,tags`). Row-level errors bubble as `skipped[]` with reason + row number so re-import after fixes is easy. Bulk-inserts in 500-row chunks; hard-cap 10 MB / 10,000 rows. Settings page has an uploader that shows the skipped-rows detail (2026-09-27)
- [x] Toast notifications: `lib/toast.ts` (tiny pub-sub, no context) + `<Toaster />` in (app) layout. Variants: info / success / error, dismissible, auto-expire in 4s. Wired: duplicate transaction, budget copy-from-previous (replaces inline status text), recurring "Run due now" (2026-09-27)
- [x] Keyboard shortcuts: `n` → dashboard (which auto-focuses amount for instant entry), `?` toggles a cheatsheet dialog, `Esc` closes it. Handler skips input/textarea/select/contenteditable focus so it never fights with typing (2026-09-27)
- [x] Floating "+ New" quick action visible on `/transactions`, `/budgets`, `/recurring`, `/categories`, `/settings` (hidden on dashboard). Link → `/dashboard`, which auto-focuses the amount input for instant entry (2026-09-27)
- [x] Sign-out flow polish: `signOut` action redirects to `/sign-in?signed-out=1`; sign-in page shows "Signed out. See you next time." banner (skipped when it was actually an account-delete → the stronger "account deleted" banner wins) (2026-09-27)
- [x] Offline detection: `OfflineBanner` client component in the (app) layout uses `useSyncExternalStore` on `navigator.onLine` + online/offline events. Fixed banner at the bottom when offline (2026-09-27)
- [x] Error logger stub `lib/logger.ts` with a `logError(err, ctx)` shape ready for Sentry drop-in (guarded on `NEXT_PUBLIC_SENTRY_DSN`). Wired into `app/(app)/error.tsx` (2026-09-27)
- [x] **Receipt photos (P1)** shipped:
  - Migration `20260927150000_receipts.sql`: private `receipts` bucket + storage RLS matching `foldername[1] = auth.uid()` per PRD
  - File input on the transaction form (`accept="image/*" capture="environment"` so mobile opens the camera). Client-side upload to `receipts/{userId}/{uuid}.{ext}` before the Server Action; upload failure blocks the save so refs never dangle
  - `/api/receipts/[...path]` route handler generates a 60-second signed URL and 302s to it (double-checks folder ownership on top of storage RLS)
  - List rows show a `receipt` link chip; edit form shows current receipt with a view link
  - `receipt_path` sanitized server-side (must start with `${userId}/`, no `..`)
- [x] **Dark mode (P1)** shipped:
  - Companion palette via `[data-theme="dark"]` overrides on the same tokens — no component needs a `dark:` variant because every color reference resolves through the CSS var
  - Inline boot script in root layout picks theme (localStorage → system) before hydration, so no flash of wrong theme
  - `ThemeToggle` client component in the sidebar footer, driven by `useSyncExternalStore` (no `set-state-in-effect` lint noise)
  - `color-scheme: dark` set on `[data-theme="dark"]` so native form controls (date/time/color pickers, scrollbars) follow
  - `themeColor` metadata is now media-aware so PWA install / mobile chrome adapts too
- [x] **Recurring transactions (P1)** shipped:
  - Migration `20260927140000_recurring.sql`: `recurring_rules` table (interval enum, next_run_on, active, mirrors of tx fields), RLS, `process_recurring_for_user()` PL/pgSQL function that loops each due rule (capped at 366 back-runs) and advances `next_run_on` by the interval
  - Re-added FK `transactions.recurring_rule_id → recurring_rules.id` (original migration reserved the column)
  - `lib/validation/recurring.ts` + `lib/db-types.ts` `RecurringRule` type
  - Server Actions: create / setActive / delete / **runNow** (calls the RPC)
  - `/recurring` page: rule list with pause/resume + two-step delete, "due now" banner if any rule's `next_run_on ≤ today` in user's tz, add form, Run-now button that reports count created
  - Sidebar: Recurring link with a repeat icon
  - Automated cron deferred; user triggers manually. Wrapping in Supabase Cron / Vercel Cron is a follow-up
- [x] CSV export now paginates through the Supabase 1000-row-per-request default (up to `MAX_ROWS = 250,000`). Adds `x-row-count` and `x-truncated` response headers. Fixes silent data loss for anyone with >1000 transactions in the export range (2026-09-27)
- [x] "Search all time" checkbox on `/transactions`: `?all=1` lifts the month filter so search/category/tag queries scan every month. Month input greys out; header switches to "All time"; list empty state distinguishes "no results" from "no data" (2026-09-27)
- [x] Inline two-step delete confirmation on transaction rows + budget rows (replaces jarring `window.confirm()`): first click arms for 4s and turns the button red; second click deletes; blur or timeout disarms (2026-09-27)
- [x] Copy budgets from previous month: button on `/budgets`, Server Action inserts prior-month limits for categories that lack one this month, reports count back (2026-09-27)
- [x] `/categories` now shows this-month spend per category (hidden on narrow screens to keep row density), aggregated via existing `monthly_summary` RPC (2026-09-27)
- [x] Sort options on `/transactions`: newest/oldest first, largest/smallest amount. Amount-sort skips day grouping and renders a flat list with dates. New `?sort=` URL param, remount key includes it (2026-09-27)
- [x] Recent transactions card on `/dashboard`: 5 latest entries with category dot, note, date, signed amount — quick sanity check without leaving the page (2026-09-27)
- [x] Duplicate transaction: `↻` button on each list row calls `duplicateTransaction` Server Action, inserts a copy with today's date in the user's tz (2026-09-27)
- [x] Profile timezone now consumed everywhere: `todayInManila` → `todayInTimezone(tz)`; new React-cached `getSessionContext()` deduplicates the profile lookup per request; dashboard/transactions/budgets pages thread the user's tz. Date formatting uses UTC-noon dates (formatter tz doesn't matter). Default falls back to `Asia/Manila` (2026-09-27)
- [x] Profile edit in `/settings`: display_name + timezone (dropdown of ten PH-friendly zones). Persists to `profiles` (2026-09-27)
- [x] Tag autocomplete via `<datalist>` — dashboard fetches distinct tags from the user's last 200 transactions and passes as suggestions to the form input (2026-09-27)
- [x] Categories: inline color edit (native color picker) alongside rename + archive; commits on blur via `setCategoryColor` action (2026-09-27)
- [x] Dashboard empty-state / first-run onboarding: friendly welcome card above the form when the current month has no transactions (2026-09-27)
- [x] Tags UI: comma-separated input on the transaction form, tag chips on list rows (click to filter), tag filter on `/transactions`, Postgres array `contains` in `loadMoreTransactions`, CSV export already includes tags. Values lowercased server-side (2026-09-27)
- [x] Month picker (`month-picker.tsx` client component) on `/dashboard` and `/budgets` — native `<input type="month">` triggers `router.push` inside `useTransition`. Dashboard extra: "This month" link appears when browsing a past month (2026-09-27)
- [x] Fast-entry redesign: type toggle (Expense/Income pill), category as pill grid (radio inputs, keyboard reachable), amount auto-focused on the dashboard for 1-tap entry, focus returns to amount after each save (2026-09-27)
- [x] Filter clear button on `/transactions` — appears when category or search is active; resets to full month (2026-09-27)
- [x] Refactored form's post-submit reset out of `useEffect` into an action wrapper (satisfies `react-hooks/set-state-in-effect`, avoids cascading renders) (2026-09-27)
- [x] Auth-flow polish: proxy round-trips `?next=`, callback + sign-in form sanitize it against open-redirect, users land where they were headed (2026-09-27)
- [x] Sign-in banners: shows "Your account and all its data have been deleted." on `?deleted=1` (2026-09-27)
- [x] Dashboard charts lazy-loaded via `next/dynamic` — Recharts stays out of `/transactions`, `/budgets`, `/categories`, `/settings` client bundles (2026-09-27)
- [x] Split Server Action file (`load-more.ts`) from its constants (`list-types.ts`) so Next.js's "only-async-exports" rule for `"use server"` files doesn't strip `PAGE_SIZE` (2026-09-27)
- [x] Skip-to-main-content link in the app layout (2026-09-27)
- [x] `/transactions` filter form: visible labels on Month / Category / Search notes (2026-09-27)
- [x] Screen-reader summaries for donut ("Top categories: X 40%, Y 20%…") and daily-trend line ("Spent ₱X across N days, highest day…") (2026-09-27)
- [x] `aria-label` on inline rename input in `/categories` (2026-09-27)
- [x] `loading.tsx` skeleton, `error.tsx` boundary with retry, root `not-found.tsx` (2026-09-27)
- [x] Infinite scroll on `/transactions`: cursor-free offset pagination via `loadMoreTransactions` Server Action + IntersectionObserver (50/page) (2026-09-27)
- [x] Vitest set up (with `ws` polyfill for Node 20's missing global WebSocket); 5-assertion cross-user RLS test passing against the cloud DB (2026-09-27)
- [x] CI: `Integration tests` step runs `pnpm test` with Supabase repo secrets (skips if absent) (2026-09-27)
- [x] Categories CRUD: `/categories` page, add/rename/archive (P0 back-fill from Phase 2) (2026-09-27)
- [x] Edit-transaction UI: `/transactions/[id]/edit` reuses shared `TransactionForm` (2026-09-27)
- [x] CSV export: `/api/export/transactions.csv?from&to` streams a downloaded file (2026-09-27)
- [x] PWA manifest via `app/manifest.ts`, viewport + theme-color in root layout, SVG icons (any + maskable) (2026-09-27)
- [x] Account deletion: Settings danger zone → Supabase Admin `deleteUser`, cascades wipe rows (2026-09-27)
- [x] Server-only admin client `lib/supabase/admin.ts` (uses SECRET key) (2026-09-27)
- [x] Security headers in `next.config.ts`: CSP, HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy (2026-09-27)
- [x] Sidebar: Categories + Settings links (2026-09-27)

### Deferred / notes
- CSP still allows `'unsafe-inline'` on `style-src` because Recharts renders inline styles inside its SVGs. `script-src` is now nonced. Moving styles to a nonce would require replacing Recharts or a build-time CSS-hash pass.
- CSV export column shape matches PRD; import mapping stays P2.

---

## Prior sprint — Phase 3 (Dashboard & Budgets)

### Todo — needs you
- [ ] **Apply `supabase/migrations/20260927130000_summary_rpcs.sql`** in the SQL Editor (transactional, re-runnable). Adds `monthly_summary`, `daily_totals`, `budget_status`.
- [ ] **Apply `supabase/migrations/20260927140000_recurring.sql`** in the SQL Editor (also transactional / re-runnable). Adds the `recurring_rules` table, RLS, and `process_recurring_for_user()`. `/recurring` will 500 until this runs.
- [ ] **Apply `supabase/migrations/20260927150000_receipts.sql`** in the SQL Editor. Creates the `receipts` storage bucket + owner-scoped RLS. Uploads will 403 until this runs.

### Done (Phase 3 so far)
- [x] `monthly_summary(month)`, `daily_totals(month)`, `budget_status(month)` RPCs written (2026-09-27)
- [x] Recharts donut for spend-by-category with legend + percentages (2026-09-27)
- [x] Recharts line chart for daily trend (2026-09-27)
- [x] `BudgetProgress` component with ok / warn (≥80%) / over (≥100%) states (2026-09-27)
- [x] Budget upsert/delete Server Actions + Zod schema (2026-09-27)
- [x] `/budgets` page: set/edit budgets, progress list (2026-09-27)
- [x] Dashboard: warning banner when any budget hits ≥80% or ≥100% (2026-09-27)
- [x] Dashboard rewired to use RPCs, embedded charts + budget progress (2026-09-27)
- [x] Sidebar: added Budgets link with target icon (2026-09-27)

### Deferred / notes
- Recharts tooltip formatter typed loosely (`value` → `Number(value)`) — Recharts 3's `ValueType | undefined` doesn't narrow well.

---

## Prior sprint — Phase 2 (Core Data & CRUD)

### Todo — needs you
- [ ] **Apply `supabase/migrations/20260927120000_init.sql` in the SQL Editor of your Supabase project.** Creates all 4 tables, RLS, `on_auth_user_created` trigger with 10 default categories seeded per user.
- [ ] In Supabase → Auth → URL Configuration, add `http://localhost:3000/auth/callback` to Redirect URLs (add the prod URL later).
- [ ] Supabase → Auth → Providers → Email → **turn off "Allow new users to sign up"** (invite-only mode; matches the client `shouldCreateUser: false`).
- [ ] Invite yourself via Supabase → Authentication → Users → **Invite user**. That sends a magic link and creates the row.
- [ ] Push repo to GitHub, connect Vercel, wire env vars in Vercel.
- [ ] Bump Next.js to ≥ 16.3.7 once the Sep 30 security release lands.

### Todo — Phase 2 polish (deferred)
- [ ] Cross-user RLS integration test (Vitest + service-role login-as-user-A, assert user-B can't read).
- [ ] Edit-transaction UI (Server Action already exists, just needs a form page).
- [ ] Infinite scroll on `/transactions` (currently capped at 200/month).
- [ ] `useOptimistic` on add-expense form (currently uses `useActionState`; UI reset after success but no optimistic row).

### Done (Phase 2 so far)
- [x] Cloud Supabase project wired via `.env.local` (2026-09-27)
- [x] Schema migration written: profiles + trigger + 10-cat seed, categories, transactions, budgets (2026-09-27)
- [x] RLS policies on every table, keyed to `auth.uid()` (2026-09-27)
- [x] Money helpers `lib/money.ts` (parseMinor / formatPhp, `en-PH` locale) (2026-09-27)
- [x] Date helpers `lib/date.ts` (Asia/Manila timezone) (2026-09-27)
- [x] Slim `lib/db-types.ts` hand-rolled (swap for generated types later) (2026-09-27)
- [x] Zod schema for transaction form (2026-09-27)
- [x] Server Actions: create/update/delete transaction, Zod-validated (2026-09-27)
- [x] Real auth: magic-link + Google OAuth via client; `/auth/callback` route handler exchanges the code (2026-09-27)
- [x] Add-expense form on `/dashboard` (amount, type, category, date, payment method, note) (2026-09-27)
- [x] `/transactions` list: day-grouped, month/category/text filters, delete button (2026-09-27)
- [x] Dashboard now shows real month totals (spent / income / remaining) (2026-09-27)

### Deferred / notes
- shadcn/ui still deferred — hand-rolled inputs suffice for the MVP form.
- Infinite scroll deferred; 200/month soft cap keeps list snappy for early users.
- `useOptimistic` deferred; form resets on success and `revalidatePath` refreshes the SSR list.

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
- 2026-09-27 — Cloud Supabase over local Docker path — user pivoted mid-phase; migration lives in `supabase/migrations/` for later `db push`, applied manually via SQL Editor for now.
- 2026-09-27 — DB types hand-rolled in `lib/db-types.ts`; replace with `supabase gen types typescript` once the CLI is linked.
- 2026-09-27 — Bumped tsconfig `target` from ES2017 → ES2022 to allow bigint literals in `lib/money.ts`.
- 2026-09-27 — Invite-only auth for now: `shouldCreateUser: false` on magic link, Google button removed. New users onboard via Supabase → Authentication → Users → Invite user.
- 2026-09-27 — Palette flipped from dark navy to light: white background, `#0D1C42` text, `#010736` accent, `#FCF1D0` as `--color-highlight`.
- 2026-09-27 — `/dashboard` moved into `app/(app)/` route group so it shares the sidebar layout. URL unchanged.
- 2026-09-27 — Dashboard aggregation via Postgres RPCs (`monthly_summary`, `daily_totals`, `budget_status`) — never sums client-side.
- 2026-09-27 — Categories CRUD landed as Phase 4 back-fill (PRD P0 that Phase 2 missed).
- 2026-09-27 — Font: Google Fonts Manrope self-hosted via `next/font/google`; monospace dropped.
- 2026-09-27 — Layout: sidebar sticky (`md:sticky md:top-0 md:h-screen md:self-start`), main containers full-width (`px-4 md:px-8`, no max-w).
- 2026-09-27 — Security headers set in `next.config.ts`; CSP allows `'unsafe-inline'` (scripts + styles) for now — tighten with nonces later.
- 2026-09-27 — Vitest chosen over Jest — Next.js team's recommended path, no Babel wrangling, tsx-native config.
- 2026-09-27 — RLS test hits real cloud DB (creates + deletes fixture users in a `beforeAll`/`afterAll`). CI skips gracefully when Supabase secrets absent.
- 2026-09-27 — Open-redirect defense on `?next=`: both proxy and callback reject anything that doesn't start with `/` or that starts with `//` (protocol-relative).
- 2026-09-27 — `"use server"` modules can only export async fns — moved shared constants/types into a companion module.
- 2026-09-28 — CSP moved from static `next.config.ts` headers into `proxy.ts` so we can mint a per-request nonce; `script-src` locked to nonce + `strict-dynamic`; root layout became async to read `x-nonce`. Recharts keeps `'unsafe-inline'` on `style-src`.
- 2026-09-28 — Optimistic UI for quick-add landed as a pub-sub ghost overlay in the dashboard Recent card rather than React's `useOptimistic` hook. Rationale: the form (in the modal) and the list (on the dashboard) render in different subtrees, so a dispatched optimistic state would revert as soon as its (empty) subscriber transition finished. Ghost state via `useState` + id-based dedupe on RSC refetch achieves the same visual behavior without misusing the hook.
- 2026-09-28 — Dropped GitHub Actions CI (`.github/workflows/ci.yml`). Not needed for a personal project right now; `pnpm typecheck` / `pnpm test` still run locally. Reinstate when opening the project up.

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
