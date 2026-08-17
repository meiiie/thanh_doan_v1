# Spring backend harness

## Scope

This folder contains the Spring Boot modular monolith for the campaign lifecycle. The `local` profile listens only on `127.0.0.1:8081`; the `prod` profile is used only behind the frontend reverse proxy.

## Runtime and commands

- Java 21 LTS or newer (Spring Boot 4.1 supports Java 17–26).
- Maven 3.9+.
- Default test profile uses in-memory H2 in PostgreSQL compatibility mode.
- `local` uses a file-backed H2 database under `.tmp/`.
- `prod` requires explicit PostgreSQL variables, exposes health/Prometheus on internal port `9090`, and defaults to secure session cookies.

From this folder:

```powershell
mvn clean verify
mvn spring-boot:run
```

## Module and domain rules

- Domain packages must not import Spring, JDBC, HTTP or persistence annotations.
- Use case endpoints are commands, not generic CRUD.
- Authorization is deny-by-default and checked again against campaign, organization, team and assignment scope inside the application service.
- Business writes and `audit_record` inserts share one transaction.
- Submitted revisions, review decisions and result content are append-only.
- A correction after publication creates a superseding result; never update historical score content.
- Do not add a generic repository/base service, queue, cache or distributed component.

## Required gate

1. `mvn test` passes.
2. `GET http://127.0.0.1:8081/actuator/health` returns `UP`.
3. PostgreSQL Testcontainers migration/constraint test passes; an H2-only result is insufficient.
4. Authorization, transaction/audit, idempotency and optimistic-lock tests pass.
5. API and Angular client behavior remain aligned.
