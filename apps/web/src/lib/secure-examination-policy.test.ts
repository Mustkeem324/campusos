import { describe, expect, it } from 'vitest';

import {
  calculateAttemptDeadline,
  evaluateExamReadiness,
  integrityStateFromAutomatedEvent,
  resolveExamDeliveryMode,
  shouldHumanReviewProctoringEvent,
} from './secure-examination-policy';
import type { DevicePrecheck, ExamSecurityProfile } from './secure-examination-types';

const highSecurity: ExamSecurityProfile = {
  id: 'profile-1',
  name: 'High Security',
  description: null,
  status: 'ACTIVE',
  identityRequired: true,
  selfieRequired: true,
  livenessRequired: false,
  primaryCameraRequired: true,
  microphoneRequired: false,
  screenShareRequired: false,
  fullscreenRequired: true,
  secondCameraRequired: true,
  humanAdmissionRequired: true,
  aiEventAnalysisEnabled: true,
  clipboardRestricted: true,
  permittedMaterials: {},
};

const readyPrecheck: DevicePrecheck = {
  browserSupported: true,
  cameraReady: true,
  microphoneReady: true,
  screenShareReady: true,
  fullscreenReady: true,
  secondCameraReady: true,
  networkQuality: 'GOOD',
  state: 'READY',
};

describe('secure examination policy', () => {
  it('keeps examination delivery independent from institution study mode', () => {
    expect(resolveExamDeliveryMode('OFFLINE')).toBe('OFFLINE');
    expect(resolveExamDeliveryMode('ONLINE_PROCTORED')).toBe('ONLINE_PROCTORED');
    expect(resolveExamDeliveryMode('HYBRID')).toBe('HYBRID');
  });

  it('does not apply online proctoring gates to an offline exam', () => {
    const readiness = evaluateExamReadiness({
      online: false,
      termsRequired: true,
      termsAccepted: false,
      profile: highSecurity,
      identityState: null,
      precheck: null,
      secondCameraStatus: null,
      humanAdmitted: false,
    });
    expect(readiness.ready).toBe(true);
    expect(readiness.items).toEqual([]);
  });

  it('blocks a high-security exam until all authoritative gates pass', () => {
    const blocked = evaluateExamReadiness({
      online: true,
      termsRequired: true,
      termsAccepted: true,
      profile: highSecurity,
      identityState: 'MATCH',
      precheck: readyPrecheck,
      secondCameraStatus: 'CONNECTED',
      humanAdmitted: false,
    });
    expect(blocked.ready).toBe(false);
    expect(blocked.items.find((item) => item.key === 'HUMAN_APPROVAL')?.blocking).toBe(true);

    const ready = evaluateExamReadiness({
      online: true,
      termsRequired: true,
      termsAccepted: true,
      profile: highSecurity,
      identityState: 'APPROVED',
      precheck: readyPrecheck,
      secondCameraStatus: 'PAIRED',
      humanAdmitted: true,
    });
    expect(ready.ready).toBe(true);
    expect(ready.items.every((item) => !item.blocking)).toBe(true);
  });

  it('requires the second camera only when the selected profile requires it', () => {
    const withoutSecondCamera = { ...highSecurity, secondCameraRequired: false };
    const readiness = evaluateExamReadiness({
      online: true,
      termsRequired: true,
      termsAccepted: true,
      profile: withoutSecondCamera,
      identityState: 'MATCH',
      precheck: { ...readyPrecheck, secondCameraReady: false },
      secondCameraStatus: null,
      humanAdmitted: true,
    });
    expect(readiness.ready).toBe(true);
  });

  it('treats medium and high automated events as review signals, never guilt', () => {
    expect(shouldHumanReviewProctoringEvent('INFO')).toBe(false);
    expect(shouldHumanReviewProctoringEvent('LOW')).toBe(false);
    expect(shouldHumanReviewProctoringEvent('MEDIUM')).toBe(true);
    expect(shouldHumanReviewProctoringEvent('HIGH')).toBe(true);
    expect(integrityStateFromAutomatedEvent('MEDIUM')).toBe('REVIEW_REQUIRED');
    expect(integrityStateFromAutomatedEvent('HIGH')).toBe('REVIEW_REQUIRED');
    expect(integrityStateFromAutomatedEvent('LOW')).toBe('NO_ISSUE');
  });

  it('calculates an authoritative attempt deadline from server start time', () => {
    const start = new Date('2026-08-08T10:00:00.000Z');
    expect(calculateAttemptDeadline(start, 60)?.toISOString()).toBe('2026-08-08T11:00:00.000Z');
    expect(calculateAttemptDeadline(start, null)).toBeNull();
  });
});
