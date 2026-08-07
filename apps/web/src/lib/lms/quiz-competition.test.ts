import { describe, expect, it } from 'vitest';

import {
  isAnswerCorrect,
  normalizeQuestion,
  publicQuestionsForAttempt,
  scoreCompetition,
  type CompetitionConfig,
  type CompetitionQuestion,
} from './quiz-competition';

const questions: CompetitionQuestion[] = [
  {
    id: 'q1',
    prompt: 'Which value is even?',
    type: 'SINGLE_CHOICE',
    options: [{ id: 'a', text: '3' }, { id: 'b', text: '4' }],
    correctOptionIds: ['b'],
    points: 2,
    negativePoints: 0.5,
    explanation: 'Four is divisible by two.',
    difficulty: 'EASY',
    topic: 'Arithmetic',
    sequence: 0,
  },
  {
    id: 'q2',
    prompt: 'Select the database languages.',
    type: 'MULTIPLE_CHOICE',
    options: [{ id: 'c', text: 'SQL' }, { id: 'd', text: 'CQL' }, { id: 'e', text: 'HTML' }],
    correctOptionIds: ['c', 'd'],
    points: 3,
    negativePoints: 1,
    explanation: 'SQL and CQL are database query languages.',
    difficulty: 'MEDIUM',
    topic: 'Databases',
    sequence: 1,
  },
  {
    id: 'q3',
    prompt: 'CampusOS is a university platform.',
    type: 'TRUE_FALSE',
    options: [{ id: 't', text: 'True' }, { id: 'f', text: 'False' }],
    correctOptionIds: ['t'],
    points: 1,
    negativePoints: 0.25,
    difficulty: 'EASY',
    sequence: 2,
  },
];

const config: CompetitionConfig = {
  version: 1,
  instructions: '',
  maxAttempts: 1,
  shuffleQuestions: true,
  shuffleOptions: true,
  negativeMarking: true,
  leaderboardEnabled: true,
  leaderboardLive: false,
  resultRelease: 'AFTER_END',
  questionCount: questions.length,
  totalMarks: 6,
  createdByUserId: 'faculty-user',
  createdAt: '2026-08-07T00:00:00.000Z',
};

describe('quiz competition scoring', () => {
  it('scores exact single and multiple-choice answers and applies negative marking', () => {
    const result = scoreCompetition(
      questions,
      new Map([
        ['q1', ['b']],
        ['q2', ['c']],
        ['q3', ['f']],
      ]),
      true,
    );

    expect(result.score).toBe(0.75);
    expect(result.totalMarks).toBe(6);
    expect(result.correctCount).toBe(1);
    expect(result.wrongCount).toBe(2);
    expect(result.unansweredCount).toBe(0);
    expect(result.percentage).toBe(12.5);
  });

  it('does not give partial credit for an incomplete multiple-choice answer', () => {
    expect(isAnswerCorrect(questions[1], ['c'])).toBe(false);
    expect(isAnswerCorrect(questions[1], ['d', 'c'])).toBe(true);
  });

  it('counts unanswered questions without a penalty', () => {
    const result = scoreCompetition(questions, new Map([['q1', ['b']]]), true);
    expect(result.score).toBe(2);
    expect(result.correctCount).toBe(1);
    expect(result.wrongCount).toBe(0);
    expect(result.unansweredCount).toBe(2);
  });
});

describe('active competition question payload', () => {
  it('never exposes the correct answer key or faculty explanation', () => {
    const publicQuestions = publicQuestionsForAttempt(questions, config, 'attempt-123');
    expect(publicQuestions).toHaveLength(3);
    for (const question of publicQuestions) {
      expect(question).not.toHaveProperty('correctOptionIds');
      expect(question).not.toHaveProperty('explanation');
    }
  });

  it('uses stable question and option ordering for the same attempt', () => {
    const first = publicQuestionsForAttempt(questions, config, 'attempt-123');
    const second = publicQuestionsForAttempt(questions, config, 'attempt-123');
    expect(second).toEqual(first);
  });
});

describe('question validation', () => {
  it('rejects duplicate option identifiers and missing correct answers', () => {
    expect(() => normalizeQuestion({
      prompt: 'Invalid question',
      type: 'SINGLE_CHOICE',
      options: [{ id: 'same', text: 'A' }, { id: 'same', text: 'B' }],
      correctOptionIds: ['same'],
      points: 1,
      negativePoints: 0,
      difficulty: 'EASY',
    }, 0)).toThrow(/duplicate option/i);

    expect(() => normalizeQuestion({
      prompt: 'No key',
      type: 'SINGLE_CHOICE',
      options: [{ id: 'a', text: 'A' }, { id: 'b', text: 'B' }],
      correctOptionIds: [],
      points: 1,
      negativePoints: 0,
      difficulty: 'EASY',
    }, 0)).toThrow(/correct option/i);
  });
});
