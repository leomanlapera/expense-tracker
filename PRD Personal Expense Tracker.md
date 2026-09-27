# PRD: Personal Expense Tracker

Sep 27, 2026 · @June Leoman Lapera

## Overview

A web app that lets one person log an expense in under 10 seconds and see where their money went each month.

**Problem.** Most people know roughly what they earn but not what they spend. Spreadsheets are tedious, bank apps split data across accounts, and popular trackers push subscriptions or bank-linking that many users don't want.

**Vision.** A fast, private, mobile-first tracker: manual entry that feels instant, clear monthly budgets, and simple charts. No ads, no bank credentials required.

**Target user.** An individual (freelancer, young professional, student) who pays in cash, e-wallets and cards, wants a monthly budget, and uses their phone more than a laptop. Default currency is PHP, with other currencies supported per account.

## Goals, non-goals and success metrics

The MVP succeeds if a user logs expenses on most days of their first month and checks their budget at least weekly.

**Goals**

- Add an expense in 3 taps or fewer, under 10 seconds
- Show spending by category and by month at a glance
- Let users set a monthly budget per category and warn at 80% and 100%
- Keep each user's data private and exportable

**Non-goals (MVP****)**

- Bank or e-wallet account syncing
- Shared or household budgets
- Investment, loan or net-worth tracking
- Native iOS/Android apps (the web app is installable as a PWA instead)

**Success metrics**

| Metric | Target (first 90 days) |
| --- | --- |
| Time to log an expense | < 10 s median |
| Day-7 retention | ≥ 35% |
| Day-30 retention | ≥ 20% |
| Users who set at least one budget | ≥ 50% |
| Largest Contentful Paint on mobile | < 2.5 s |

## Personas and user stories

Two personas cover the MVP: a budget-conscious professional and a freelancer with irregular income.

- **Mia, 27, office worker.** Paid twice a month, spends through GCash, cards and cash. Wants to stop running out of money before payday.
- **Leo, 33, freelancer.** Irregular income, mixes business and personal spending. Wants to tag work expenses and export them for taxes.

**User stories**

1. As a user, I sign up with email or Google so I can start in under a minute.
2. As a user, I add an expense with amount, category, date and an optional note.
3. As a user, I edit or delete any expense I entered.
4. As a user, I record income so I can see what's left this month.
5. As a user, I set a monthly budget per category and get warned when I'm close.
6. As a user, I see a dashboard: total spent, remaining budget, top categories, daily trend.
7. As a user, I filter and search transactions by date range, category, tag or text.
8. As a user, I set up recurring expenses (rent, subscriptions) so I don't retype them.
9. As a user, I export my data to CSV.
10. As a user, I install the app on my phone's home screen and use it like a native app.

## Functional requirements

The MVP ships P0 items; P1 follows within two months; P2 is backlog.

| Feature | Details | Priority |
| --- | --- | --- |
| Auth | Email magic link + Google OAuth via Supabase Auth; sign out; delete account | P0 |
| Add/edit/delete expense | Amount, category, date (default today), payment method, note, tags | P0 |
| Income entries | Same form, type = income | P0 |
| Categories | 10 defaults (Food, Transport, Bills, Shopping, Health, etc.), user can add, rename, archive | P0 |
| Dashboard | Month total, income vs expense, spend by category (donut), daily trend (line) | P0 |
| Transaction list | Grouped by day, infinite scroll, filter by month/category/tag, text search | P0 |
| Monthly budgets | Per category; progress bars; in-app warning at 80% and 100% | P0 |
| Currency | One default currency per user (PHP default); amounts stored as integers in minor units | P0 |
| CSV export | All transactions, date-range filter | P0 |
| PWA install | Manifest, icons, add-to-home-screen | P0 |
| Recurring transactions | Daily/weekly/monthly rules, auto-created by a scheduled job | P1 |
| Receipt photo | Upload to Supabase Storage, attached to a transaction | P1 |
| Dark mode | Follows system setting, manual toggle | P1 |
| Offline entry | Queue new expenses offline, sync when back online | P1 |
| CSV import | Map columns from bank or spreadsheet exports | P2 |
| Multi-currency | Per-transaction currency with conversion | P2 |
| Email/push budget alerts | Weekly summary, over-budget alerts | P2 |
| Receipt OCR / AI categorisation | Suggest amount and category from a photo or note | P2 |

## Tech stack and architecture

Next.js 16.3 on Vercel talks to Supabase from the server; the browser never holds more than the publishable key and a session cookie.

&#91;embedded content: system architecture · browser, Vercel, Supabase\]

Pages read data in Server Components and write through Server Actions; Postgres Row Level Security is the final gate on every row.

| Layer | Choice | Version (Sep 2026) | Why |
| --- | --- | --- | --- |
| Framework | [Next.js](https://nextjs.org/blog/next-16-3) App Router, TypeScript | 16.3.x (pin 16.3.7+ after the Sep 30 security release) | Server Components and Server Actions, first-class on Vercel |
| Styling | [Tailwind CSS](https://tailwindcss.com/blog) | 4.3.x | CSS-first config with `@theme`, no `tailwind.config.js` |
| UI kit | shadcn/ui (optional) | latest | Accessible, copy-in components built on Tailwind |
| Backend | Supabase: Postgres, Auth, Storage, Cron | Cloud | One service for data, login and files |
| Supabase client | `@supabase/supabase-js` + `@supabase/ssr` | latest | Cookie-based sessions for server rendering |
| Validation | Zod | latest | One schema shared by forms and Server Actions |
| Charts | Recharts | latest | Donut and line charts for the dashboard |
| Hosting | Vercel | Hobby, then Pro | Git-push deploys and preview URLs per branch |

**Implementation notes**

- Next.js now ships [scheduled monthly security releases](https://nextjs.org/blog); a critical out-of-band patch landed on Sep 22 and another release is set for Sep 30, 2026. Turn on Dependabot or Renovate from day one.
- Use Supabase's new publishable (`sb_publishable_…`) and secret (`sb_secret_…`) keys; the legacy anon and service\_role keys are [deprecated by the end of 2026](https://supabase.com/docs/guides/auth/server-side/nextjs?router=app).
- On the server, trust `getUser()` (or `getClaims()`), not `getSession()`, because it revalidates the token with Supabase Auth ([guide](https://supabase.co/docs/guides/auth/server-side/nextjs)).
- Never expose the secret key to the client; keep it in Vercel environment variables without the `NEXT_PUBLIC_` prefix.

## Data model

Five tables, every one keyed to `user_id` and locked down by Row Level Security so a user can only ever see their own rows.

| Table | Key columns | Notes |
| --- | --- | --- |
| `profiles` | `id` (= `auth.users.id`), `display_name`, `currency` (default `PHP`), `timezone`, `created_at` | Created by a trigger on sign-up |
| `categories` | `id`, `user_id`, `name`, `icon`, `color`, `type` (`expense`/`income`), `archived` | 10 defaults seeded on sign-up |
| `transactions` | `id`, `user_id`, `category_id`, `type`, `amount_minor` (bigint), `occurred_on` (date), `payment_method`, `note`, `tags` (text\[\]), `receipt_path`, `recurring_rule_id`, `created_at`, `updated_at` | Index on (`user_id`, `occurred_on` desc) |
| `budgets` | `id`, `user_id`, `category_id`, `month` (date, 1st of month), `limit_minor` | Unique on (`user_id`, `category_id`, `month`) |
| `recurring_rules` (P1) | `id`, `user_id`, `category_id`, `amount_minor`, `interval` (`daily`/`weekly`/`monthly`), `next_run_on`, `active` | Processed daily by Supabase Cron |

**Rules**

- Store money as integers in minor units (centavos): ₱1,250.50 = `125050`. Never floats.
- RLS on every table: `select`, `insert`, `update`, `delete` allowed only where `user_id = (select auth.uid())`.
- Dashboard totals come from a Postgres view or RPC (`monthly_summary(month)`) so the database sums, not the browser.
- Receipt files live in a private Storage bucket at `receipts/{user_id}/{transaction_id}.jpg`, with a storage policy matching the folder to `auth.uid()`.
- Deleting an account cascades to all rows and files.

## Non-functional requirements

The app must feel instant on a mid-range Android phone over mobile data and treat financial data as private by default.

| Area | Requirement |
| --- | --- |
| Performance | LCP < 2.5 s, INP < 200 ms on mobile; optimistic UI when adding an expense |
| Security | RLS on all tables; secret key server-only; Zod validation in every Server Action; security headers (CSP, HSTS, X-Frame-Options) set in `next.config` |
| Auth | Magic link + Google; optional TOTP MFA (included on Supabase Free) |
| Privacy | No ads, no third-party trackers; CSV export and one-click account deletion; privacy policy aligned with the Philippine Data Privacy Act (RA 10173) |
| Accessibility | WCAG 2.2 AA: keyboard reachable, visible focus, 4.5:1 contrast, labelled form fields, charts with text summaries |
| Reliability | Daily database backups (needs Supabase Pro); error tracking with Sentry or Vercel logs |
| Localisation | English UI first; PHP formatting via `Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' })`; dates in the user's timezone |
| Browser support | Last 2 versions of Chrome, Safari, Firefox, Edge; iOS 16.4+ for PWA install |

## Market research

The gap is a free, ad-free, peso-first tracker that treats cash and e-wallets as equals and works on any device through the browser.

| App | Pricing model | Data and account | Gap we can fill |
| --- | --- | --- | --- |
| [Money Manager](https://www.cashjot.com/blog/best-expense-trackers-no-bank-login) | Free with ads; one-time ad removal; sync is a separate subscription | Local to device, no account | No ads, sync included |
| [Spendee](https://www.cashjot.com/blog/best-expense-trackers-no-bank-login) | Free tier capped at 1 wallet and 1 budget; paid tiers | Account required, vendor cloud; bank sync mainly European banks | Unlimited budgets free |
| [Wallet by BudgetBakers](https://tipidnation.com/blog/tipid-tips-expense-tracker-apps) | Free manual tracking; paid bank sync | Account and cloud | Simpler, faster entry |
| [GCash and Maya built-in history](https://tipidnation.com/blog/tipid-tips-expense-tracker-apps) | Free | Automatic, but misses cash and other cards | One view across cash, cards and wallets |
| Google Sheets | Free | User-owned | Mobile-first entry, budgets, charts |

**Findings**

- Manual trackers that need no bank login are a clear category; users choose them for privacy and to avoid broken bank syncs ([CashJot comparison](https://www.cashjot.com/blog/best-expense-trackers-no-bank-login)).
- In the Philippines, GCash and Maya log wallet spending but skip cash and separate cards, so a separate tracker still fills that gap ([TipidNation](https://tipidnation.com/blog/tipid-tips-expense-tracker-apps)).
- The same guide says the habit that makes tracking stick is logging on the same day, which supports our "under 10 seconds" goal.

**Our differentiation**

- Payment methods built for PH: Cash, GCash, Maya, debit, credit.
- Unlimited categories and budgets on the free plan, no ads.
- Works on any phone or laptop as a PWA, no app store needed.
- Later: import GCash and Maya transaction exports (P2).

## Costs and hosting limits

Building and testing costs $0; going public with real users costs about $45 a month (Supabase Pro $25 + Vercel Pro $20).

| Item | Free plan | Paid plan | What forces the upgrade |
| --- | --- | --- | --- |
| [Supabase](https://supabase.com/pricing) | $0: 500 MB database, 1 GB storage, 5 GB egress, 50,000 MAU, 2 active projects, no backups | Pro from $25/mo: 8 GB disk, 100 GB storage, 250 GB egress, 100,000 MAU, daily backups (7 days), never paused | Free projects pause after 1 week of inactivity |
| [Vercel](https://vercel.com/docs/plans/hobby) | Hobby $0: 100 GB transfer, 1M function invocations, 4 CPU-hrs, 1 hour of runtime logs | Pro $20 per developer seat/mo, includes $20 usage credit | Hobby is personal, non-commercial use only; over-limit features pause for 30 days |
| Domain | n/a | about $10–15/yr | Custom domain for launch |
| Email (auth emails) | Supabase built-in sender, rate-limited | Custom SMTP (e.g. Resend) | Reliable magic-link delivery at launch |

**Notes**

- 500 MB fits a lot of expenses: at roughly 300 bytes per row, that is over a million transactions, so storage won't be the first limit.
- A Pro Supabase organisation never pauses its projects ([billing docs](https://supabase.com/docs/guides/platform/billing-on-supabase)); keep the Pro spend cap on to avoid surprise bills.
- If the app stays personal and free, Vercel Hobby is allowed; charging users or running ads requires Vercel Pro.

## Roadmap, risks and open questions

A solo build can ship the P0 MVP in about 8 weeks, with public launch in week 9 and P1 features through week 16.

&#91;embedded content: proposed roadmap · 5 phases, 2 gates\]

Weeks are a proposed plan for one part-time developer; beta feedback decides what moves from P1 into launch.

**Risks**

| Risk | Impact | Mitigation |
| --- | --- | --- |
| A missing or wrong RLS policy leaks another user's data | High | RLS on every table from day one; automated tests that sign in as two users and try cross-reads |
| Next.js security patches arrive monthly | Medium | Renovate/Dependabot, patch within 7 days of each release |
| Supabase free project pauses during quiet beta weeks | Medium | Move to Pro before public launch |
| Users stop logging after week one | High | Sub-10-second entry, home-screen install, optional daily reminder (P2) |
| Magic-link emails land in spam | Medium | Custom SMTP with SPF/DKIM before launch |
| Legacy Supabase keys deprecated end of 2026 | Low | Start on publishable/secret keys |

**Open questions**

- [ ] Personal tool only, or a public product with a paid tier later? This decides Vercel Hobby vs Pro.
- [ ] Is multi-currency needed at launch (e.g. for OFW or travel users), or is PHP-only enough?
- [ ] Should wallets (Cash, GCash, bank) be tracked as accounts with balances, or only as a payment-method tag?
- [ ] App name and domain.

## Sources

- [Next.js blog: 16.3 release and security releases](https://nextjs.org/blog)
- [Next.js 16.3 release notes](https://nextjs.org/blog/next-16-3)
- [Tailwind CSS blog (v4.3)](https://tailwindcss.com/blog)
- [Supabase pricing](https://supabase.com/pricing)
- [Supabase billing docs](https://supabase.com/docs/guides/platform/billing-on-supabase)
- [Supabase server-side auth for Next.js](https://supabase.com/docs/guides/auth/server-side/nextjs?router=app)
- [Vercel Hobby plan](https://vercel.com/docs/plans/hobby)
- [CashJot: expense trackers without bank login](https://www.cashjot.com/blog/best-expense-trackers-no-bank-login)
- [TipidNation: tracking expenses in the Philippines](https://tipidnation.com/blog/tipid-tips-expense-tracker-apps)
