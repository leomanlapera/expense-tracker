# Phase 4 — Polish, Export, PWA

**Window:** Weeks 7–8 · **Gate:** **Gate A — MVP Ready** · **Status:** see [STATUS.md](../STATUS.md)

Everything a first user needs before we hand them the URL.

## Deliverables

- CSV export (all transactions, date-range filter)
- PWA manifest + icons, installable on iOS 16.4+ and Android
- Account deletion (cascades to rows + storage)
- Security headers (CSP, HSTS, X-Frame-Options) in `next.config`
- Accessibility pass: WCAG 2.2 AA — keyboard, focus, contrast, form labels, chart text summaries
- Perf pass: LCP < 2.5 s, INP < 200 ms on mobile
- Automated RLS cross-user tests in CI

## Gate A checklist

- [ ] All P0 rows in PRD § Functional Requirements shipped
- [ ] Lighthouse mobile ≥ 90 perf / 100 a11y
- [ ] Cross-user RLS test green
- [ ] CSV export round-trips (export → re-import in a spreadsheet, totals match)
- [ ] PWA installs on iOS 16.4+ and Android Chrome
- [ ] Account delete removes every row + storage object

## Notes & watch-outs

- Test PWA install on a real iPhone — Safari's rules are stricter than Chrome DevTools.
- CSP is the header most likely to break Recharts/inline styles — test after adding.
