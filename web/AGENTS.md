# Project harness

## Mission

Build and operate the Hải Phòng Youth Union scoring workflow. Correctness,
authorization, auditability, Vietnamese usability, and recoverability outrank
feature count.

## Start here

1. Read `SPEC.md`, `DESIGN.md`, and `docs/DECISIONS.md`.
2. Use `docs/CODEMAP.md` to find the smallest relevant surface.
3. Work one vertical slice end to end. Do not create speculative layers.
4. Run `npm run check` before declaring a slice complete.
5. Update `docs/PROGRESS.md` and the decision log when behavior or assumptions change.

## Commands

- `npm run dev` — local application on the printed URL.
- `npm run typecheck` — TypeScript boundary check.
- `npm test` — deterministic domain and rendered behavior checks.
- `npm run lint` — code and accessibility lint.
- `npm run build` — Cloudflare-compatible production build.
- `npm run smoke` — run the HTTP/D1 integration harness against a cold local server.
- `npm run check` — required gate: lint, types, tests, build, and smoke.
- `npm run db:generate` — generate an inspected D1 migration after schema edits.

## Invariants

- Server authorizes every read and mutation; hidden UI is not authorization.
- Published criteria are immutable. A change creates a new version.
- Review rounds append decisions; they never overwrite earlier decisions.
- A reviewer score below self-score requires a deduction reason.
- A unit cannot see round-one scores before release.
- Deadline and phase checks run on the server.
- Every state-changing action writes an audit event in the same operation.
- Core rate is `(core + capped bonus) / applicable core maximum`; rate may exceed 100%.
- No secrets, passwords, session identifiers, or evidence contents in logs or Git.
- Never weaken validation, security, audit, backup, or accessibility to simplify code.

## Change discipline

- Prefer platform APIs, HTML forms, CSS, D1 constraints, and existing dependencies.
- Avoid microservices, queues, realtime transports, caches, generic repositories,
  and interface-per-class patterns until measured need exists.
- Keep user-facing copy fully accented Vietnamese.
- Add one runnable check for every non-trivial business rule or regression.
- Generated output, dependencies, and local D1 state stay ignored.

## Definition of done

A change is done only when the real path was exercised, negative authorization
and validation cases reject correctly, audit output is present, responsive and
keyboard states remain usable, and `npm run check` is green.
