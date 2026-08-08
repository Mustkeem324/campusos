# NAVEMORA Secure Exam Client

This directory contains the managed-device launcher used by NAVEMORA secure examinations.

## Security model

The launcher creates an Ed25519 device keypair locally, enrolls the public key with a short-lived institution-issued enrollment code, signs per-attempt server challenges, and launches Chrome/Chromium in a dedicated kiosk profile with extensions, sync, print preview and developer tools restricted.

The server accepts an attempt as securely attested only when:

- the challenge is valid, short lived and tied to the signed-in student's attempt;
- the device public key is enrolled in the same institution;
- the Ed25519 signature validates;
- the reported kiosk posture satisfies the configured secure-client gate.

This is a managed-browser baseline, not a claim that a JavaScript page can control an entire operating system. For high-stakes deployments, institutions should distribute the launcher as a signed package, use OS device management / kiosk policy, restrict local administrator access, and use platform attestation where available. NAVEMORA records the attestation and posture as evidence; it does not convert client telemetry into an automatic misconduct verdict.

## Enroll a managed device

An Examination Controller / Registrar / Institution Admin first creates a one-time enrollment code from `/examinations/runtime`.

Then, on the managed device:

```bash
node apps/secure-exam-client/launcher.mjs enroll \
  --server https://navemora.example.com \
  --code <enrollment-code> \
  --label "Exam Lab PC 12"
```

The private Ed25519 key remains under `~/.navemora-secure-exam/` and is never uploaded.

## Attest an examination

When a secure-client-required exam is opened, NAVEMORA displays a short-lived challenge. Run the launcher with the displayed challenge values:

```bash
node apps/secure-exam-client/launcher.mjs attest \
  --server https://navemora.example.com \
  --challenge-id <challenge-id> \
  --challenge-token <challenge-token> \
  --nonce <nonce> \
  --policy-version <policy-version> \
  --attempt <attempt-id>
```

After successful attestation, the launcher opens the exam in the dedicated kiosk browser profile.

## Browser selection

The launcher auto-detects common Chrome/Chromium locations on Linux, macOS and Windows. Override it when needed:

```bash
--browser /path/to/chrome
```

## Production packaging

The repository launcher is intentionally inspectable. Production institutions should package and sign it for their managed fleet rather than asking students to run repository source directly.