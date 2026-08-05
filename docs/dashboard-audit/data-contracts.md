# CampusOS Role-Specific Dashboard Data Contracts (Phase 95)

Every dashboard must return only data authorised for that role. Contracts are typed and
defined in `apps/web/src/lib/dashboard/contracts.ts`. A single universal payload is forbidden.

## StudentDashboardData (implemented, Phase 95)

```ts
type StudentDashboardData = {
  role: 'STUDENT';
  identity: {
    id: string;          // user id (authenticated persona)
    name: string;
    email: string;
    rollNumber: string;
    programme: string;
    batch: string;
    section: string | null;
  };
  academicPeriod: { label: string } | null;
  todayClasses: ClassSlot[];        // timetable slots for the current day
  attendance: { present: number; total: number; percentage: number | null } | null;
  assignments: AssignmentItem[];    // real Assignment/Submission rows
  feeSummary: FeeSummary;           // real Invoice/Payment aggregates
  notices: NoticeItem[];            // tenant-scoped, role-visible notices
  riskAlerts: RiskAlert[];          // derived from real attendance/student-success records
  quickActions: QuickAction[];
  recentActivity: ActivityItem[];   // audit entries for this user
};
```

**Authorization scope:** `student.id = ctx.studentProfileId`, `student.userId = ctx.userId`,
`student.tenantId = ctx.tenantId`. Any value shown must come from these rows.

## Contract principles

| Principle | Applied |
|---|---|
| Server-side role switch | `getStudentDashboardData` only callable for `STUDENT` |
| Tenant scope in every query | `getTenantDb(tenantId)` |
| No client-only security | page + API both enforce on server |
| No fake production values | all numbers derive from real DB rows |
| Typed response | `StudentDashboardData` returned by loader and API |
