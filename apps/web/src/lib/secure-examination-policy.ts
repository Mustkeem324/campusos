import type { RoleType } from '@prisma/client';

import type {
  DevicePrecheck,
  ExamDeliveryMode,
  ExamReadiness,
  ExamSecurityProfile,
  VerificationState,
} from './secure-examination-types';

const MANAGE_ROLES = new Set<RoleType>(['EXAMINATION_CONTROLLER', 'REGISTRAR', 'INSTITUTION_ADMIN']);
const PROCTOR_ROLES = new Set<RoleType>(['FACULTY', 'HOD', 'DEAN', 'EXAMINATION_CONTROLLER', 'REGISTRAR', 'INSTITUTION_ADMIN']);
const QUESTION_AUTHOR_ROLES = new Set<RoleType>(['FACULTY', 'HOD', 'DEAN', 'EXAMINATION_CONTROLLER', 'REGISTRAR', 'INSTITUTION_ADMIN']);

export function canManageSecureExams(role: RoleType) {
  return MANAGE_ROLES.has(role);
}

export function canProctorSecureExam(role: RoleType) {
  return PROCTOR_ROLES.has(role);
}

export function canAuthorExamQuestions(role: RoleType) {
  return QUESTION_AUTHOR_ROLES.has(role);
}

export function isOnlineExamMode(mode: ExamDeliveryMode) {
  return mode !== 'OFFLINE';
}

/**
 * Exam delivery is deliberately independent from a student's institution study
 * mode. An online learner may sit an offline semester exam and an on-campus
 * learner may sit an online quiz when the institution configures it that way.
 */
export function resolveExamDeliveryMode(configuredMode: ExamDeliveryMode): ExamDeliveryMode {
  return configuredMode;
}

export function verificationPasses(state: VerificationState | null | undefined) {
  return state === 'MATCH' || state === 'APPROVED';
}

export function precheckSatisfiesProfile(precheck: DevicePrecheck | null, profile: ExamSecurityProfile | null) {
  if (!profile) return true;
  if (!precheck) return false;
  if (!precheck.browserSupported) return false;
  if (profile.primaryCameraRequired && !precheck.cameraReady) return false;
  if (profile.microphoneRequired && !precheck.microphoneReady) return false;
  if (profile.screenShareRequired && !precheck.screenShareReady) return false;
  if (profile.fullscreenRequired && !precheck.fullscreenReady) return false;
  if (profile.secondCameraRequired && !precheck.secondCameraReady) return false;
  return precheck.state !== 'FAILED';
}

export function evaluateExamReadiness(input: {
  online: boolean;
  termsRequired: boolean;
  termsAccepted: boolean;
  profile: ExamSecurityProfile | null;
  identityState: VerificationState | null;
  precheck: DevicePrecheck | null;
  secondCameraStatus: string | null;
  humanAdmitted: boolean;
}): ExamReadiness {
  const { online, termsRequired, termsAccepted, profile, identityState, precheck, secondCameraStatus, humanAdmitted } = input;

  if (!online) {
    return {
      ready: true,
      items: [],
    };
  }

  const identityRequired = Boolean(profile?.identityRequired || profile?.selfieRequired || profile?.livenessRequired);
  const identityReady = !identityRequired || verificationPasses(identityState);
  const cameraRequired = Boolean(profile?.primaryCameraRequired);
  const microphoneRequired = Boolean(profile?.microphoneRequired);
  const screenRequired = Boolean(profile?.screenShareRequired);
  const fullscreenRequired = Boolean(profile?.fullscreenRequired);
  const secondCameraRequired = Boolean(profile?.secondCameraRequired);
  const humanRequired = Boolean(profile?.humanAdmissionRequired);
  const secondCameraReady = !secondCameraRequired || ['PAIRED', 'CONNECTED'].includes(secondCameraStatus ?? '');

  const items: ExamReadiness['items'] = [
    {
      key: 'TERMS',
      label: 'Terms & privacy notice',
      required: termsRequired,
      ready: !termsRequired || termsAccepted,
      blocking: termsRequired && !termsAccepted,
    },
    {
      key: 'IDENTITY',
      label: 'Identity verification',
      required: identityRequired,
      ready: identityReady,
      blocking: identityRequired && !identityReady,
      detail: identityRequired && identityState === 'REVIEW_REQUIRED' ? 'Human review is required.' : undefined,
    },
    {
      key: 'CAMERA',
      label: 'Primary camera',
      required: cameraRequired,
      ready: !cameraRequired || Boolean(precheck?.cameraReady),
      blocking: cameraRequired && !precheck?.cameraReady,
    },
    {
      key: 'MICROPHONE',
      label: 'Microphone',
      required: microphoneRequired,
      ready: !microphoneRequired || Boolean(precheck?.microphoneReady),
      blocking: microphoneRequired && !precheck?.microphoneReady,
    },
    {
      key: 'SCREEN',
      label: 'Screen sharing',
      required: screenRequired,
      ready: !screenRequired || Boolean(precheck?.screenShareReady),
      blocking: screenRequired && !precheck?.screenShareReady,
    },
    {
      key: 'FULLSCREEN',
      label: 'Fullscreen support',
      required: fullscreenRequired,
      ready: !fullscreenRequired || Boolean(precheck?.fullscreenReady),
      blocking: fullscreenRequired && !precheck?.fullscreenReady,
    },
    {
      key: 'SECOND_CAMERA',
      label: '3D Eyes mobile camera',
      required: secondCameraRequired,
      ready: secondCameraReady,
      blocking: secondCameraRequired && !secondCameraReady,
    },
    {
      key: 'HUMAN_APPROVAL',
      label: 'Examiner approval',
      required: humanRequired,
      ready: !humanRequired || humanAdmitted,
      blocking: humanRequired && !humanAdmitted,
    },
  ];

  const browserReady = Boolean(precheck?.browserSupported);
  const requiredItemsReady = items.every((item) => !item.blocking);
  return { ready: browserReady && requiredItemsReady && precheckSatisfiesProfile(precheck, profile), items };
}

export function shouldHumanReviewProctoringEvent(severity: 'INFO' | 'LOW' | 'MEDIUM' | 'HIGH') {
  return severity === 'MEDIUM' || severity === 'HIGH';
}

/** AI signals are evidence inputs only; they never produce an academic verdict. */
export function integrityStateFromAutomatedEvent(severity: 'INFO' | 'LOW' | 'MEDIUM' | 'HIGH') {
  return shouldHumanReviewProctoringEvent(severity) ? 'REVIEW_REQUIRED' as const : 'NO_ISSUE' as const;
}

export function calculateAttemptDeadline(startedAt: Date, durationMinutes: number | null) {
  if (!durationMinutes) return null;
  return new Date(startedAt.getTime() + durationMinutes * 60_000);
}

export function clampExamPageSize(value: unknown, fallback = 50, max = 100) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return Math.min(Math.floor(parsed), max);
}
