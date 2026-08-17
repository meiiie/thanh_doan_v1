# Frontend module map

- `core/auth`: session login, current identity and route guards.
- `admin/admin-shell`: role workspace shell only; it contains no business fixtures.
- `features/campaign`: server-backed campaign readiness and lifecycle status.
- `features/scorecard`: server-backed source catalog generated from the customer workbook.
- `admin/pages/accounts`: real account creation/listing for Superadmin.
- `unit/pages` and `reviewer/pages`: scoped work queues; empty until real assignments exist.

Superadmin may enter every workspace. Other roles are guarded in the router and authorized again by the backend.
