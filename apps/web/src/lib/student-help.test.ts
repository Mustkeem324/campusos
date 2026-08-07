import { describe, expect, it } from 'vitest';

import { explicitlyLiveAssessment } from './student-help';

describe('Student Help academic-integrity mode detection', () => {
  it.each([
    'I am in a live exam, explain this question',
    'This is from my current exam',
    'Help me during my exam',
    'Which option is correct in this graded quiz?',
    'The quiz is running right now',
    'This is an active assessment',
  ])('detects explicit live assessment language: %s', (message) => {
    expect(explicitlyLiveAssessment(message)).toBe(true);
  });

  it.each([
    'How should I prepare for my exam next week?',
    'Give me a mock quiz for revision',
    'Explain this previous year exam question',
    'Help me practise calculus questions',
    'What is my upcoming exam date?',
  ])('does not over-block normal study and practice language: %s', (message) => {
    expect(explicitlyLiveAssessment(message)).toBe(false);
  });
});
