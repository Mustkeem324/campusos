import { NextResponse } from 'next/server';

import {
  acceptExamTerms,
  admitStudentAttempt,
  assignExamProctor,
  attachExamQuestion,
  configureSecureExam,
  create3DEyesPairing,
  createExamQuestion,
  createExamTermsVersion,
  createProctorReport,
  createSecurityProfile,
  createStudentAttempt,
  heartbeat3DEyes,
  pair3DEyes,
  recordClientProctoringEvent,
  reviewStudentIdentity,
  saveDevicePrecheck,
  saveExamAnswer,
  SecureExaminationError,
  send3DEyesSignal,
  setSecureExamStatus,
  startExamAttempt,
  submitExamAttempt,
  verifyStudentIdentityForExam,
} from '@/lib/secure-examination';
import { getSecureClientGate } from '@/lib/secure-examination-runtime';
import type { ExamDeliveryMode, NetworkQuality, ProctoringSeverity } from '@/lib/secure-examination-types';

export const dynamic = 'force-dynamic';

const MAX_BODY_BYTES = 5_000_000;

async function readPayload(request: Request) {
  const contentLength = Number(request.headers.get('content-length') ?? 0);
  if (Number.isFinite(contentLength) && contentLength > MAX_BODY_BYTES) {
    throw new SecureExaminationError('Request payload is too large.', 413);
  }
  const text = await request.text();
  if (new TextEncoder().encode(text).byteLength > MAX_BODY_BYTES) {
    throw new SecureExaminationError('Request payload is too large.', 413);
  }
  if (!text) return {} as Record<string, unknown>;
  try {
    const parsed = JSON.parse(text);
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
      ? parsed as Record<string, unknown>
      : {};
  } catch {
    throw new SecureExaminationError('Request body must be valid JSON.', 400);
  }
}

function stringValue(value: unknown) {
  return value === null || value === undefined ? '' : String(value);
}

export async function POST(request: Request) {
  try {
    const payload = await readPayload(request);
    const action = stringValue(payload.action);

    let result: unknown;
    switch (action) {
      case 'create_security_profile':
        result = await createSecurityProfile({
          name: stringValue(payload.name),
          description: payload.description ? stringValue(payload.description) : null,
          identityRequired: payload.identityRequired === true,
          selfieRequired: payload.selfieRequired === true,
          livenessRequired: payload.livenessRequired === true,
          primaryCameraRequired: payload.primaryCameraRequired === true,
          microphoneRequired: payload.microphoneRequired === true,
          screenShareRequired: payload.screenShareRequired === true,
          fullscreenRequired: payload.fullscreenRequired === true,
          secondCameraRequired: payload.secondCameraRequired === true,
          humanAdmissionRequired: payload.humanAdmissionRequired === true,
          aiEventAnalysisEnabled: payload.aiEventAnalysisEnabled === true,
          clipboardRestricted: payload.clipboardRestricted === true,
          permittedMaterials: payload.permittedMaterials && typeof payload.permittedMaterials === 'object'
            ? payload.permittedMaterials as Record<string, unknown>
            : {},
        });
        break;
      case 'configure_exam':
        result = await configureSecureExam({
          examId: stringValue(payload.examId),
          courseOfferingId: payload.courseOfferingId ? stringValue(payload.courseOfferingId) : null,
          securityProfileId: payload.securityProfileId ? stringValue(payload.securityProfileId) : null,
          deliveryMode: stringValue(payload.deliveryMode) as ExamDeliveryMode,
          startsAt: payload.startsAt ? stringValue(payload.startsAt) : null,
          endsAt: payload.endsAt ? stringValue(payload.endsAt) : null,
          durationMinutes: payload.durationMinutes === null || payload.durationMinutes === undefined ? null : Number(payload.durationMinutes),
          maxAttempts: Number(payload.maxAttempts ?? 1),
          reconnectGraceSeconds: Number(payload.reconnectGraceSeconds ?? 120),
          autoSubmit: payload.autoSubmit !== false,
          allowResumeAfterDisconnect: payload.allowResumeAfterDisconnect !== false,
          instructions: payload.instructions ? stringValue(payload.instructions) : null,
        });
        break;
      case 'set_exam_status':
        result = await setSecureExamStatus(
          stringValue(payload.configId),
          stringValue(payload.status) as 'DRAFT' | 'PUBLISHED' | 'CANCELLED' | 'ARCHIVED',
        );
        break;
      case 'create_terms':
        result = await createExamTermsVersion({
          version: stringValue(payload.version),
          title: stringValue(payload.title),
          content: stringValue(payload.content),
          effectiveAt: payload.effectiveAt ? stringValue(payload.effectiveAt) : null,
        });
        break;
      case 'create_attempt':
        result = await createStudentAttempt(stringValue(payload.configId));
        break;
      case 'accept_terms':
        result = await acceptExamTerms(
          stringValue(payload.configId),
          stringValue(payload.termsVersionId),
          {
            ipAddress: request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null,
            userAgent: request.headers.get('user-agent'),
          },
        );
        break;
      case 'save_precheck':
        result = await saveDevicePrecheck(stringValue(payload.attemptId), {
          browserSupported: payload.browserSupported === true,
          cameraReady: payload.cameraReady === true,
          microphoneReady: payload.microphoneReady === true,
          screenShareReady: payload.screenShareReady === true,
          fullscreenReady: payload.fullscreenReady === true,
          secondCameraReady: payload.secondCameraReady === true,
          networkQuality: stringValue(payload.networkQuality || 'UNKNOWN') as NetworkQuality,
          clientDetails: payload.clientDetails && typeof payload.clientDetails === 'object'
            ? payload.clientDetails as Record<string, unknown>
            : {},
        });
        break;
      case 'verify_identity':
        result = await verifyStudentIdentityForExam(stringValue(payload.attemptId), {
          idCaptureDataUrl: stringValue(payload.idCaptureDataUrl),
          selfieDataUrl: stringValue(payload.selfieDataUrl),
        });
        break;
      case 'review_identity':
        result = await reviewStudentIdentity(
          stringValue(payload.attemptId),
          stringValue(payload.decision) as 'APPROVED' | 'REJECTED',
          payload.note ? stringValue(payload.note) : undefined,
        );
        break;
      case 'create_3d_pairing':
        result = await create3DEyesPairing(stringValue(payload.attemptId));
        break;
      case 'pair_3d_eyes':
        result = await pair3DEyes({
          token: payload.token ? stringValue(payload.token) : undefined,
          code: payload.code ? stringValue(payload.code) : undefined,
          deviceReference: payload.deviceReference ? stringValue(payload.deviceReference) : undefined,
        });
        break;
      case 'heartbeat_3d_eyes':
        result = await heartbeat3DEyes(stringValue(payload.sessionId));
        break;
      case 'send_3d_signal':
        result = await send3DEyesSignal({
          sessionId: stringValue(payload.sessionId),
          sender: stringValue(payload.sender) as 'LAPTOP' | 'MOBILE',
          signalType: stringValue(payload.signalType) as 'OFFER' | 'ANSWER' | 'ICE' | 'CONTROL',
          payload: payload.payload,
        });
        break;
      case 'admit_attempt':
        result = await admitStudentAttempt(stringValue(payload.attemptId));
        break;
      case 'assign_proctor':
        result = await assignExamProctor(stringValue(payload.configId), stringValue(payload.proctorUserId));
        break;
      case 'record_event':
        result = await recordClientProctoringEvent(stringValue(payload.attemptId), {
          source: stringValue(payload.source),
          eventType: stringValue(payload.eventType),
          severity: stringValue(payload.severity || 'INFO') as ProctoringSeverity,
          metadata: payload.metadata && typeof payload.metadata === 'object'
            ? payload.metadata as Record<string, unknown>
            : {},
        });
        break;
      case 'proctor_report':
        result = await createProctorReport(stringValue(payload.attemptId), {
          category: stringValue(payload.category) as 'INFORMATIONAL' | 'WARNING' | 'TECHNICAL' | 'INTEGRITY_CONCERN' | 'CRITICAL_INCIDENT',
          severity: stringValue(payload.severity || 'INFO') as ProctoringSeverity,
          description: stringValue(payload.description),
          evidenceEventId: payload.evidenceEventId ? stringValue(payload.evidenceEventId) : null,
        });
        break;
      case 'start_attempt': {
        const attemptId = stringValue(payload.attemptId);
        const secureClient = await getSecureClientGate(attemptId);
        if (secureClient.required && !secureClient.ready) {
          result = { attemptId, secureClientRequired: true, attestationRequired: true };
        } else {
          result = await startExamAttempt(attemptId);
        }
        break;
      }
      case 'save_answer':
        result = await saveExamAnswer(stringValue(payload.attemptId), {
          attemptQuestionId: stringValue(payload.attemptQuestionId),
          answer: payload.answer,
          idempotencyKey: payload.idempotencyKey ? stringValue(payload.idempotencyKey) : undefined,
        });
        break;
      case 'submit_attempt':
        result = await submitExamAttempt(stringValue(payload.attemptId), payload.auto === true);
        break;
      case 'create_question':
        result = await createExamQuestion({
          courseId: payload.courseId ? stringValue(payload.courseId) : null,
          questionType: stringValue(payload.questionType),
          prompt: stringValue(payload.prompt),
          options: payload.options,
          answerKey: payload.answerKey,
          maxMarks: Number(payload.maxMarks ?? 1),
          difficulty: stringValue(payload.difficulty || 'MEDIUM') as 'EASY' | 'MEDIUM' | 'HARD',
          tags: Array.isArray(payload.tags) ? payload.tags.map(String) : [],
        });
        break;
      case 'attach_question':
        result = await attachExamQuestion({
          configId: stringValue(payload.configId),
          questionId: stringValue(payload.questionId),
          sectionTitle: stringValue(payload.sectionTitle || 'Main'),
          position: Number(payload.position ?? 0),
          marks: Number(payload.marks ?? 1),
        });
        break;
      default:
        throw new SecureExaminationError('Unsupported secure examination action.', 400);
    }

    return NextResponse.json(result, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    if (error instanceof SecureExaminationError) {
      return NextResponse.json({ error: error.message, code: error.code }, { status: error.status });
    }
    console.error('Secure examination action failed:', error);
    return NextResponse.json({ error: 'Unable to complete secure examination action.' }, { status: 500 });
  }
}