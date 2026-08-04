# CampusOS Approved Roadmap — Phases 97–104

> Gate: Phases 97–104 must not begin until Phase 96 (Production Readiness) is
> verified: Vercel preview + production deployment pass, health endpoints
> respond, smoke tests pass, rollback documented.

## Phase 97 — Advanced LMS foundation and course permissions
- Course/section permission model (enrollment-scoped access, instructor assignment)
- Learning-session access control and content organization

## Phase 98 — Assignments, rubric grading and gradebook
- Assignments with rubrics, structured grading, gradebook rollup

## Phase 99 — Live classroom, raise hand and attendance
- Live session orchestration, participation signals, attendance capture

## Phase 100 — Moderated chat, approved links and secure files
- Moderated discussion, link allow-listing, secure file handling

## Phase 101 — Collaborative whiteboard and presentation tools
- Shared canvas and presentation surface

## Phase 102 — Proctored quizzes and human review
- Quiz sessions, proctoring signals, human review workflow

## Phase 103 — Notifications, analytics and performance
- In-app notification delivery, learning analytics, performance baselines

## Phase 104 — Backup, disaster recovery and institutional launch readiness
- Backup/recovery runbooks, launch checklist, go-live verification

## Dependencies
- Phase 96 gate: production pipeline verified end-to-end.
- Phase 97–98 must land before 99–102 (they build on course/enrollment/permission primitives).
- Phase 103 depends on 97–102 data contracts; Phase 104 is the release-capstone phase.
