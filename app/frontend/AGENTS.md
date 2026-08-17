# Angular frontend harness

## Scope

This folder contains the multi-role Angular frontend. Development runs on `127.0.0.1:4317` and proxies `/api` to local backend `8081`; the production-like container uses Nginx on `4318` by default. Do not use ports `4200` or `4300`, which may belong to other projects on this machine.

## Runtime

- Node.js: `24.x` preferred; accepted versions are defined in `package.json`.
- Package manager: npm 11.
- Framework: Angular 22, standalone components, signals and `OnPush`.

## Commands

Từ root workspace:

```powershell
.\scripts\dev.ps1
# Terminal khác:
.\scripts\check.ps1 -Browser
```

Hai script tự chọn Node LTS phù hợp. `dev.ps1` chạy `npm install` khi `node_modules` chưa tồn tại.

`npm run test:e2e` expects the local server to be running on port `4317`. Override with `ADMIN_BASE_URL` only for an isolated test environment.

## Module rules

- Keep Admin platform configuration separate from campaign submissions and reviewer workbenches.
- Runtime business data must come from the backend. Test fixtures stay under test scope and never ship in a production bundle.
- A released scorecard is an immutable version; the current local screen represents a draft only.
- Do not expose Excel cell coordinates, formulas or fill colors in the primary business flow.
- Buttons without a real local effect must be disabled or explain their local-only behavior.
- Keep route pages focused on composition; move substantial behavior into a named component or pure domain module.
- Preserve one `h1` per route, accessible control names, keyboard focus, and responsive layouts at 1512×982, 1024×768 and 390×844.

## Required gate

Before handoff:

1. `npm run check` passes.
2. The server responds on `http://127.0.0.1:4317/`.
3. `npm run test:e2e` passes with zero page and console errors.
4. Review desktop and mobile screenshots; no console error, focus trap or horizontal page overflow is accepted.
5. The production build stays within `angular.json` budgets and works behind Angular hash-based auto-CSP plus the Nginx security headers.
