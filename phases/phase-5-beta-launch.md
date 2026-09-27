# Phase 5 — Beta & Launch

**Window:** Week 9 · **Gate:** **Gate B — Public Launch** · **Status:** see [STATUS.md](../STATUS.md)

Move from "works on my machine" to "safe to hand out".

## Deliverables

- Supabase Pro (daily backups, no pause)
- Vercel Pro *if* going public/commercial (else Hobby stays — see open questions)
- Custom domain
- Custom SMTP (Resend or similar) with SPF/DKIM — magic links stop landing in spam
- Sentry (or Vercel logs) error tracking
- Privacy policy aligned with PH Data Privacy Act (RA 10173)
- Closed beta with 5–10 users; feedback intake

## Gate B checklist

- [ ] Domain live, HTTPS, security headers verified in prod
- [ ] Magic-link delivery < 30 s to Gmail + Outlook
- [ ] Backups confirmed running (Supabase Pro daily)
- [ ] Error tracking receiving events (trigger a test error, confirm)
- [ ] Privacy policy + account-delete flow published and linked
- [ ] Spend cap set on Supabase Pro to avoid surprise bills

## Blockers — resolve before starting

Open questions from PRD must be answered first:
- Personal-only or public + paid tier? (drives Vercel Hobby vs Pro)
- Multi-currency at launch, or PHP-only?
- Wallets as accounts-with-balances, or payment-method tag only?
- App name + domain

## Notes & watch-outs

- Vercel Hobby is personal, non-commercial only — charging users or running ads forces Pro.
- Turn on Supabase spend cap before opening the tap.
