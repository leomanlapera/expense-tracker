# Phase 1 — Foundation

**Window:** Weeks 1–2 · **Gate:** — · **Status:** see [STATUS.md](../STATUS.md)

Stand up the repo, hosting, auth, and base layout so every later phase has a spine to hang off.

## Deliverables

- Next.js 16.3 app on Vercel with preview URLs per branch
- Supabase project (publishable + secret keys, legacy keys off)
- `@supabase/ssr` cookie sessions; server trusts `getUser()`
- Email magic link + Google OAuth working
- `profiles` table + sign-up trigger (default currency PHP)
- Tailwind 4.3 with `@theme`, base layout, dark-friendly tokens
- Renovate/Dependabot on; CI runs typecheck + lint
- Zod, Recharts, shadcn/ui installed and smoke-tested

## Exit criteria

A signed-in user lands on an empty dashboard shell served by a Server Component.

## Notes & watch-outs

- Pin Next.js ≥ 16.3.7 (Sep 30 security release).
- Use publishable (`sb_publishable_…`) + secret (`sb_secret_…`) keys — legacy anon/service_role deprecated end of 2026.
- Secret key server-only; no `NEXT_PUBLIC_` prefix.
- On the server call `getUser()`/`getClaims()`, never `getSession()`.
