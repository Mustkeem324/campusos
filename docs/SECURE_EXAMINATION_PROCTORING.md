# NAVEMORA Secure Examination, AI Proctoring & 3D Eyes 2.0

## Purpose

NAVEMORA secure examinations extend the existing examination and result workflows. They do not replace offline examinations and do not derive exam delivery from a student's study mode.

An institution may configure an online student to sit an offline semester examination, or an on-campus student to take an online quiz. Delivery is authoritative at the exam configuration level.

Supported delivery modes:

- `OFFLINE`
- `ONLINE_UNPROCTORED`
- `ONLINE_PROCTORED`
- `HUMAN_PROCTORED`
- `AI_ASSISTED_PROCTORED`
- `HYBRID`

## Current architecture

The implementation uses the existing public NAVEMORA identities for Institution, User, Student, Exam, ExamSchedule, CourseOffering, Enrollment and Result. Proctoring-specific operational state is isolated under the idempotent PostgreSQL schema `campusos_exam_proctoring`.

Main flow:

1. Examination Controller configures delivery and a reusable security profile.
2. Institution publishes a versioned examination terms/privacy notice.
3. Student creates an online attempt.
4. Student accepts the applicable terms version.
5. Student performs the device pre-check.
6. Identity is sent to the configured provider using institution ID + live selfie. Raw captures are not persisted by this verification path.
7. If the provider is unavailable or inconclusive, the attempt moves to human identity review rather than fabricating a successful match.
8. If required, the laptop creates a short-lived 3D Eyes token/code and the authenticated student pairs a phone.
9. Human admission is required when the selected security profile requires it.
10. The server opens the attempt and computes the authoritative deadline.
11. Assigned question snapshots are returned without answer keys.
12. Answers are stored as versioned revisions with idempotency support and optional local draft recovery.
13. Browser/camera/network events are recorded as potential review signals.
14. Submission is idempotent and closes the secondary-camera session.
15. Academic evaluation/result publication continues through the existing examination/result controls.

## AI integrity rule

Automated detection must never directly determine academic misconduct.

NAVEMORA's rule is:

> AI detects signals. Humans determine misconduct.

`MEDIUM` and `HIGH` automated events may move an attempt into `REVIEW_REQUIRED`. They do not automatically fail a student, alter marks, terminate an attempt, or create a misconduct verdict.

The browser is not allowed to author events with source `AI` or `PROCTOR`; those must come from trusted server/worker or authorized proctor paths.

## Identity provider

Server-only configuration:

```text
NAVEMORA_EXAM_ID_VERIFY_URL
NAVEMORA_EXAM_ID_VERIFY_SECRET
```

The provider should return a provider audit reference, optional normalized confidence, and one of the supported verification states. Production provider endpoints must use HTTPS.

When no provider is configured, NAVEMORA records a human-review requirement. It does not use random/fake face confidence.

## 3D Eyes

3D Eyes is a separately authenticated mobile second-camera session. It is not phone-screen mirroring.

Pairing properties:

- bound to tenant, student and exam attempt
- cryptographically random long token
- 8-digit short pairing code
- only SHA-256 hashes are stored
- 10-minute pairing expiry
- authenticated same-student pairing
- heartbeat/disconnect state
- signalling table for realtime negotiation

The mobile UI requests the rear/environment camera where supported and instructs the student to show only the student, laptop/work area, desk and immediate examination workspace.

### Production media boundary

The repository contains the authenticated pairing, mobile camera, heartbeat and signalling foundation. It intentionally does not hard-code public TURN credentials or pretend the Next.js API server is a large-scale video relay.

For reliable internet-scale live viewing, deploy a dedicated WebRTC media layer such as an SFU plus STUN/TURN with short-lived credentials. Keep media infrastructure behind an abstraction so institutions are not locked to one provider.

## Browser security boundary

A normal web page can observe browser-exposed signals such as:

- tab visibility
- fullscreen state
- clipboard actions where implemented
- camera/microphone availability
- explicit screen-sharing permission
- network/session state

It cannot honestly guarantee detection of every browser extension, AI desktop application, virtual device or background process.

If an institution requires stronger OS controls, use a separately installed, transparent, signed secure-exam client with explicit student notice and institution policy. Do not implement covert keylogging, credential harvesting, secret filesystem scanning or kernel-level spyware.

## Privacy

Identity images, biometrics, video and proctor evidence are sensitive.

The platform should:

- collect only what the selected examination policy requires
- provide a clear versioned notice before the secure exam
- restrict evidence access to authorized institution roles
- configure retention separately for normal telemetry, identity evidence and formal integrity cases
- use object storage rather than PostgreSQL for large evidence objects
- encrypt sensitive data and avoid logging raw captures or credentials
- support institution accessibility/accommodation policies

## Failure handling

- Identity provider unavailable: human review fallback.
- Camera disconnected: event + reconnect flow; no automatic fail.
- 3D Eyes disconnected: alert/review state; no automatic invalidation.
- Network interrupted: local answer draft remains available and server answer revisions resume when connectivity returns.
- Optional AI unavailable: human proctoring can continue according to institution policy.
- Mandatory security capability unavailable: institution-configured fallback/technical review is required.

## Routes

- `/examinations` — role-aware secure examination workspace
- `/examinations/admin` — examination control workspace for authorized roles
- `/examinations/system-check` — standalone practice device check
- `/examinations/3d-eyes` — authenticated mobile second-camera pairing/camera UI
- `/examinations/attempt/[attemptId]` — focused examination attempt UI

API namespace:

- `/api/examinations/proctoring/workspace`
- `/api/examinations/proctoring/actions`
- `/api/examinations/proctoring/attempt/[attemptId]`
- `/api/examinations/proctoring/3d-eyes/signals`
- `/api/examinations/proctoring/proctors`

## Validation

Dedicated workflow: **Secure Examination & Proctoring Validation**.

It validates Prisma, provisions `campusos_exam_proctoring` twice to prove idempotency, verifies key tables, runs repository typecheck, zero-warning lint, secure-exam policy tests, and a production Next.js build.
