# Dấu Xanh Hải Phòng

**Nền tảng nội bộ điều hành chiến dịch thanh niên của Thành đoàn Hải Phòng.**

The executable product is a modular monolith with three deployable processes:

- `frontend/`: Angular 22, static AOT build served by unprivileged Nginx.
- `backend/`: Java 21 and Spring Boot 4.1 API with server-side sessions, deny-by-default authorization, Flyway and Actuator.
- `database`: PostgreSQL 18 in the production-like composition.

Domain rules live under the lifecycle domain package and have no dependency on Spring, HTTP or SQL. CRUD-style platform configuration stays simple. Assignment, submission and review are separate application modules; scoped authorization, optimistic versions, idempotency keys for non-repeatable commands and audit records are enforced server-side.

`mvn verify` also emits the Spring-managed CycloneDX SBOM at `backend/target/classes/META-INF/sbom/application.cdx.json`. CI scans that Java inventory independently from the operating-system packages in both container images.

The executable vertical slice now covers the complete local scoring lifecycle:

`Superadmin/Admin prepares the campaign → Admin assigns scorecard groups → Unit submits score/evidence → Reviewer may return the dossier → Unit corrects and resubmits → round 1 → Unit explains reduced scores → round 2 → immutable final snapshot → a different authorized actor approves → Admin publishes and exports the reconciliation workbook.`

Every business transition is authorized on the server and recorded in the same database transaction. Final result snapshots preserve the accepted values, reviewer identity, revisions and SHA-256 digest; later source changes cannot mutate an approved snapshot.

Runtime seed contains only customer-backed campaign/scorecard/unit-group reference data. Organizations, people, scores, evidence and decisions start empty.

## Fast local development

From the workspace root:

```powershell
.\scripts\dev.ps1
.\scripts\check.ps1 -Browser
```

The UI is then available at `http://127.0.0.1:4317/`. Local credentials are generated under `.tmp/` and are not source data.

## Production-like local composition

Copy `.env.example` to `.env`, replace the secrets, then:

```powershell
docker compose up --build -d
docker compose ps
```

Open `http://127.0.0.1:4318/`. This path exercises the production Angular build, Nginx reverse proxy, Spring `prod` profile, Flyway and PostgreSQL. See `ops/RUNBOOK.md` before any real deployment.

For the secure local acceptance stack, run:

```powershell
.\ops\secure-local.ps1 -Start
```

Open `https://127.0.0.1:4319/`. The script creates local-only secrets and a self-signed certificate outside the images, mounts them through Docker secrets, enables secure cookies and TLS 1.2/1.3, and prints the generated bootstrap password file path. This is a rehearsal surface, not a public deployment.

The repository intentionally has no deploy command. Deployment, domain/TLS setup and production data migration require an explicit user decision.
