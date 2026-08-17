# Completion audit — 2026-08-12

This file maps the requested operational system to current, inspectable evidence.
“Implemented” means the real path is covered by code plus a runnable check; it does
not mean customer-owned inputs have been invented.

| Requirement | Evidence | State |
|---|---|---|
| Exact organization baseline | `db/seed.ts`: 134 units in 4 groups; 16 university/college participants | Implemented |
| Current scorecard | 35 criteria, core max 83, bonus cap 25; ambiguity II.1 isolated in ADR-005 | Implemented; customer sign-off still required |
| Identity and 164-account capacity | Sites identity + D1 allowlist; admin add/update/deactivate UI; role/team/unit scope | Implemented; production emails were not present in source |
| Self-assessment | Criterion score, mandatory short report, HTTPS evidence, draft save, deadline lock and submit | Implemented and E2E exercised |
| Applicability exceptions | Per-unit criterion toggle before submission; excluded rows leave denominator/review/finalization | Implemented and E2E exercised |
| Two review rounds | Team-scoped queue, append-only decisions, mandatory deduction reason, hidden round 1 | Implemented and E2E exercised |
| Explanation and finalization | Criterion explanation, round 2 override, atomic 16-unit finalization | Implemented and E2E exercised |
| Reopen and history | Required reason, published projection removed, immutable snapshots retained/downloadable | Implemented and E2E exercised |
| Campaign control | Audited name/deadline update; strict phase transitions; deadline auto-lock | Implemented for the supplied 2026 campaign |
| Audit and export | Mutation audit, export audit, CSV, print/PDF, immutable history JSON | Implemented |
| Backup | Super-admin full JSON backup plus migration and platform-backup runbook | Implemented; platform schedule is owner-operated |
| Security | Private Site, server authorization, exact-origin CSRF, idempotency, CSP/security headers, safe redirects/URLs/CSV | Implemented; production dependency audit is zero |
| Accessibility/responsive | Semantic forms/tables, visible focus, 390px, keyboard, reduced motion, 200% zoom | Playwright verified |
| Harness and recovery knowledge | `AGENTS.md`, CI, CODEMAP, ADRs, threat model, runbook, deterministic seed/migrations | Implemented |
| Production deployment | Private Sites version with D1 migration | Private Site live; owner bootstrap is the final acceptance gate |

## Evidence commands

- `npm run check` — lint, types, 11 domain/security tests, production build and
  isolated full-workflow smoke test.
- `python scripts/visual_qa.py` while local server runs — desktop/mobile/zoom/focus
  and browser-console gate.
- `npm audit --omit=dev` — production dependency gate.

## Customer-owned go-live inputs

These cannot be inferred safely from the supplied files:

1. The owner must choose the ChatGPT account at the production consent screen.
2. Production email addresses must be supplied and mapped to the 164 intended
   accounts; source files contain account labels/password-style data, not usable
   Sites identity emails, so none were committed.
3. Only the university/college scorecard was supplied. Official templates for the
   other three groups must be approved before those groups receive campaigns.
4. The organization must approve II.1 max `9`, classification wording, retention,
   backup RPO/RTO, and the evidence-link policy recorded in ADR-004/005.

The system deliberately refuses to fabricate these governance decisions.
