# Delivery progress

Last updated: 2026-08-12

## Gates

- [x] Source analysis and contradiction register
- [x] Current-practice research and technology baseline
- [x] Project bootstrap and retained local preview
- [x] Harness specification, code map, design tokens, ADRs, cross-platform commands
- [x] D1 schema, deterministic seed, identity and authorization
- [x] Unit self-assessment and submission
- [x] Round-one review and controlled release
- [x] Explanation, round-two review, finalization and reopen-with-reason
- [x] Admin directory, campaign controls, audit and protected CSV export
- [x] Responsive/accessibility/security hardening and immutable snapshots
- [x] Green lint/type/test/build/integration and Playwright visual QA
- [x] Private production deployment
- [x] Audited deadline update, applicability exceptions and full JSON backup
- [ ] Complete owner bootstrap and production acceptance

## Verification evidence

- `npm run check`: 11 tests + E2E tự chấm → hai vòng chấm → chốt → mở lại có
  audit/snapshot, green on 2026-08-12.
- Playwright: 1440px desktop, 390px mobile, keyboard focus, reduced motion and
  200% zoom; no horizontal overflow or console errors.
- `npm audit --omit=dev`: zero production vulnerabilities.
- Drizzle migrations generated and inspected at `drizzle/0000_pale_callisto.sql` and
  `drizzle/0001_fine_starbolt.sql`.
- Social preview generated once with the project token system at
  `public/social-preview.png`.

## Current assumptions to validate with operations

- Hosted users can authenticate through Sites and be allowlisted by email.
- Evidence remains organization-owned URLs for the first release.
- The provided 2026 university/college scorecard is the first live campaign.
- Other unit groups are in the directory but receive a scorecard only after their
  official templates are supplied.
