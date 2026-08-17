# Project map

## Mission

Build a trustworthy, evidence-backed scoring workflow for the 2026 campaign. Correctness, scoped authorization, traceability and task usability outrank visual novelty.

## Current phase

Analysis and UX validation are **local-only**. Do not deploy, publish, migrate production data or change the existing hosted site unless the user explicitly asks.

## Where to start

- `PHAN_TICH_DU_AN.md` — source/customer/data analysis.
- `lab/README.md` — current design gate and document map.
- `lab/PRODUCT_ARCHITECTURE.md` — proposed DDD boundaries and stack.
- `lab/UX_ARCHITECTURE.md` — role tasks, navigation and screen archetypes.
- `lab/DESIGN_SYSTEM.md` — canonical design tokens.
- `lab/DESIGN_SPEC_V2.md` — normative visual math, component and motion redlines.
- `lab/MODULE_NAVIGATION.md` — domain modules, role sidebars and contextual rails.
- `lab/specimen/index.html` — dependency-free interactive design specimen.
- `lab/MOCKUP_REVIEW.md` — accepted/rejected traits in generated concepts.
- `web/` — existing executable workflow prototype and regression harness; read `web/AGENTS.md` before changing it.
- `duananhCuong.pdf`, workbook and reference images — customer inputs, never overwrite.

## Working rules

- Prefer a vertical slice and executable acceptance example over broad scaffolding.
- Use DDD rigor only for campaign, scorecard, submission, review and final-result rules. Keep CRUD simple.
- Domain code must not depend on framework, persistence or HTTP.
- Server authorization is deny-by-default and checked on every request/resource scope.
- Business writes and audit records succeed or fail together.
- A released scorecard and finalized result are immutable snapshots.
- Do not add microservices, queues, GraphQL, Redis, generic repositories or base services without a measured need.
- Generated UI images are review artifacts, never final UI assets.
- Preserve unrelated user changes and original source documents.

## Verification

Until the new Angular/Spring application is scaffolded, run checks inside `web/` according to `web/AGENTS.md`. When the new app exists, add scoped commands to `frontend/AGENTS.md` and `backend/AGENTS.md`; keep this root file short.
