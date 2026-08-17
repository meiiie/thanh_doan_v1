# Architecture decision log

## ADR-001 — Modular monolith on Sites

**Status:** accepted. One Vinext/React Worker application with D1. At the current
164-account scale this minimizes deployment and consistency risk. Module boundaries
are code boundaries, not network boundaries.

## ADR-002 — D1 and server-rendered HTML forms

**Status:** accepted. Relational transactions and constraints fit the workflow.
Server-rendered pages and progressive HTML forms keep the core path usable without
complex client state. JavaScript enhancement may be added only when it reduces work.

## ADR-003 — Platform identity plus application allowlist

**Status:** accepted. Sites supplies authenticated identity headers. D1 maps email to
role, team, and unit; authorization remains server-side. On a new private deployment,
the first real authenticated owner becomes `SUPER_ADMIN`. Localhost alone exposes
explicit demo actors. No passwords are stored by this app.

## ADR-004 — URL evidence for the first operational release

**Status:** accepted with review date. Store URL, note, revision, actor, and timestamp.
Direct upload is deferred until file types, retention, malware scanning, and budget are
approved. Organization-owned stable links are required by policy.

## ADR-005 — Workbook ambiguity baseline

**Status:** provisional. II.1 max is `9`, overall bonus cap `25`, excluded core
criteria reduce the denominator, and `>=90%` is shown as “Có khả năng đạt xuất sắc”.
All four assumptions are isolated in domain constants and golden tests.

## ADR-006 — Harness before breadth

**Status:** accepted. Lean layered instructions, deterministic checks, code map,
decision/progress logs, seeded state, and CI are built before feature widening. Review
the harness every three to six months or after major model/tool changes.

## ADR-007 — Current compatible stack, not automatic major churn

**Status:** accepted. On 2026-08-12 the runtime was updated to React 19.2.8,
Vinext 1.0.0-beta.5, Vite 8.2.1, Cloudflare Vite plugin 1.51.2 and Wrangler
4.120.1. `npm audit --omit=dev` is zero. Remaining audit findings belong to
Drizzle/Vinext build tooling; vulnerable image parsers are not present in the built
Worker and the application accepts no uploaded image bytes. Do not force-downgrade
working packages merely to silence a development-only advisory; revisit when an
upstream patched release exists.

## ADR-008 — Immutable result history plus disposable current projection

**Status:** accepted. Every finalization appends one `final_result_snapshots` row per
unit. `final_results` is only the currently published projection. Reopening deletes
that projection, preserves all snapshots, requires a reason, and records the event.

## ADR-009 — Applicability lives on the unit assessment

**Status:** accepted. The supplied scorecard applies to one group, while real units
may have criterion exceptions. `assessments.applicable` is the smallest explicit
place for that decision: it is scoped by campaign + unit + criterion, editable only
before submission, audited, excluded from required reports/reviewer queues and the
core denominator, and retained in final snapshots.
