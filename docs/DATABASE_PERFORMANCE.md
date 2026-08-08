# Database performance

## Hot tables and access patterns

| Workload | Access pattern | Index |
| --- | --- | --- |
| Student administration | tenant + roll number/section | `students(tenant_id, rollNumber)`; `students(tenant_id, section_id)` |
| Attendance history | tenant + student/session | `attendance_records(tenant_id, student_id, attendance_session_id)` and unique `(attendance_session_id, student_id)` |
| Finance | tenant + invoice status/due date; payment time | `invoices(tenant_id, status, dueDate)`; `payments(tenant_id, paidAt)` |
| Notification inbox | tenant/user/archive + newest first | `notifications(tenant_id, user_id, is_archived, createdAt DESC)` |
| Audit history | tenant + newest first | `audit_logs(tenant_id, createdAt DESC)` |

Use opaque keyset cursors for high-volume lists. Offset paging remains acceptable only for small reference data. Never permit arbitrary client `take` values; APIs clamp to 100. Select only UI fields and aggregate balances/attendance in PostgreSQL.

## Operations

Use provider/PgBouncer-compatible pooled connections; do not create a client per request. Investigate an important query with `EXPLAIN (ANALYZE, BUFFERS)` using production-shaped data and redact values in tickets. Audit logs, notifications, telemetry, and attendance events are future monthly range-partition candidates; partition only after measured table growth and retention requirements justify it. On a mature production table, create indexes concurrently outside an application transaction and monitor duration, lock waits, and replica lag.
