import { describe, expect, it } from 'vitest';
import { checkLinkSafety, isEligibleForCommunity, moderateText, sanitizeFileName, validateFile } from '../lib/community-chat-service';

describe('community chat trust boundaries', () => {
  it('isolates branch and enrolled-course communities', () => {
    const context = { isStudent: true, isStaff: false, programId: 'program-a', enrolledCourseOfferingIds: ['offering-a'], staffCourseOfferingIds: [] };
    expect(isEligibleForCommunity({ type: 'BRANCH', campusId: null, departmentId: null, programId: 'program-a', batchId: null, sectionId: null, semesterNumber: null, courseId: null, courseOfferingId: null }, context)).toBe(true);
    expect(isEligibleForCommunity({ type: 'BRANCH', campusId: null, departmentId: null, programId: 'program-b', batchId: null, sectionId: null, semesterNumber: null, courseId: null, courseOfferingId: null }, context)).toBe(false);
    expect(isEligibleForCommunity({ type: 'COURSE', campusId: null, departmentId: null, programId: null, batchId: null, sectionId: null, semesterNumber: null, courseId: null, courseOfferingId: 'offering-b' }, context)).toBe(false);
  });

  it('hides severe sexual content and blocks unsafe links', () => {
    expect(moderateText('please send nudes').status).toBe('HIDDEN_PENDING_REVIEW');
    expect(checkLinkSafety('http://127.0.0.1/private').status).toBe('BLOCKED');
    expect(checkLinkSafety('https://example.edu/resources').status).toBe('SAFE');
  });

  it('rejects executable uploads and sanitizes filenames', () => {
    expect(validateFile('payload.exe', 'application/octet-stream', 100).allowed).toBe(false);
    expect(validateFile('lecture.pdf', 'application/pdf', 1024).allowed).toBe(true);
    expect(sanitizeFileName('../../private notes.pdf')).toBe('__private_notes.pdf');
  });
});
