import { describe, it, expect } from 'vitest';
import {
  autoGradeQuiz,
  calculateWeightedFinalGrade,
  QuizQuestion,
  GradeComponent,
} from '../lib/lms-service';

describe('Phase 3 LMS Quiz Auto-Grading & Gradebook Test Suite', () => {
  it('should auto-grade quiz with negative marking deduction', () => {
    const questions: QuizQuestion[] = [
      { id: 'q1', questionText: 'What is O(1) space?', options: ['Array', 'Const', 'Tree'], correctOptionIndex: 1, negativeMarkingPoints: 0.25, marks: 1 },
      { id: 'q2', questionText: 'What is AVL tree?', options: ['Balanced', 'Heap', 'Graph'], correctOptionIndex: 0, negativeMarkingPoints: 0.25, marks: 1 },
    ];

    // Q1 correct (1 pt), Q2 wrong (-0.25 pt) -> Net = 0.75 / 2 = 38%
    const answers = { q1: 1, q2: 1 };
    const res = autoGradeQuiz(questions, answers);

    expect(res.scoreObtained).toBe(0.75);
    expect(res.maxScore).toBe(2);
    expect(res.percentage).toBe(38);
  });

  it('should compute weighted final grade and CGPA grade letter accurately', () => {
    const components: GradeComponent[] = [
      { name: 'Internal', weightPct: 20, scoreObtained: 80 }, // 16 pts
      { name: 'Mid Term', weightPct: 30, scoreObtained: 90 }, // 27 pts
      { name: 'End Term', weightPct: 50, scoreObtained: 86 }, // 43 pts
    ];

    const result = calculateWeightedFinalGrade(components);
    // Total = 16 + 27 + 43 = 86% -> Grade A+ (9.0)
    expect(result.finalPercentage).toBe(86);
    expect(result.estimatedGrade).toBe('A+ (9.0)');
  });
});
