# Code map

| Surface | Responsibility |
|---|---|
| `app/` | Routes, server-rendered role views, HTML forms, metadata, tokens |
| `app/api/actions/` | One mutation boundary: identity, CSRF/origin, validation, authorization, audit |
| `app/api/export/` | Authorized reproducible CSV export |
| `domain/` | Pure scoring, state transitions, role/scope checks |
| `db/schema.ts` | Drizzle source of truth for D1 tables and indexes |
| `db/runtime.ts` | Runtime schema bootstrap, seed, prepared D1 queries |
| `db/seed.ts` | Non-secret organizational and campaign baseline |
| `tests/` | Golden domain rules and source-level security invariants |
| `scripts/integration.mjs` | Cold server + real D1 HTTP/negative-path smoke harness |
| `scripts/visual_qa.py` | Playwright layout/accessibility visual gate |
| `worker/` | Worker entry, image route and response security headers |
| `drizzle/` | Inspected, reproducible schema migrations |
| `docs/` | Decisions, progress, runbook, evidence and operational knowledge |

Search by business nouns first: `campaign`, `criterion`, `assessment`, `review`,
`explanation`, `final_result`, `audit_event`.
