export interface LMSModule {
  id: string;
  title: string;
  order: number;
  lessons: LMSLesson[];
}

export interface LMSLesson {
  id: string;
  title: string;
  resourceType: 'VIDEO' | 'PDF' | 'QUIZ' | 'ASSIGNMENT';
  videoUrl?: string;
  pdfUrl?: string;
  durationMinutes?: number;
}

export interface QuizQuestion {
  id: string;
  questionText: string;
  options: string[];
  correctOptionIndex: number;
  negativeMarkingPoints: number; // e.g. 0.25
  marks: number;
}

export interface ProctoringViolation {
  studentId: string;
  timestamp: Date;
  violationType: 'TAB_SWITCH' | 'FULLSCREEN_EXIT' | 'MULTIPLE_FACES';
}

export interface GradeComponent {
  name: string; // e.g. "Internal Assessment", "Mid Term", "Assignments", "End Term"
  weightPct: number; // e.g. 20, 30, 10, 40
  scoreObtained: number; // Out of 100
}

export const DEMO_LMS_MODULES: LMSModule[] = [
  {
    id: 'mod_1',
    title: 'Unit 1: Advanced Trees & Graph Data Structures',
    order: 1,
    lessons: [
      { id: 'les_101', title: 'Lesson 1.1: Red-Black Trees & AVL Balance', resourceType: 'VIDEO', durationMinutes: 45, videoUrl: 'https://example.com/video1.mp4' },
      { id: 'les_102', title: 'Lesson 1.2: Graph Shortest Path Proofs PDF', resourceType: 'PDF', pdfUrl: 'https://example.com/notes1.pdf' },
      { id: 'les_103', title: 'Unit 1 Proctoring Self-Assessment Quiz', resourceType: 'QUIZ' },
    ],
  },
  {
    id: 'mod_2',
    title: 'Unit 2: Dynamic Programming & Greedy Heuristics',
    order: 2,
    lessons: [
      { id: 'les_201', title: 'Lesson 2.1: Knapsack & Matrix Chain Multiplication', resourceType: 'VIDEO', durationMinutes: 50 },
      { id: 'les_202', title: 'Assignment 1: Dynamic Programming Problem Set', resourceType: 'ASSIGNMENT' },
    ],
  },
];

// Quiz Auto-Grading Engine with Negative Marking
export function autoGradeQuiz(
  questions: QuizQuestion[],
  answers: Record<string, number>
): { scoreObtained: number; maxScore: number; percentage: number } {
  let scoreObtained = 0;
  let maxScore = 0;

  for (const q of questions) {
    maxScore += q.marks;
    const selectedOption = answers[q.id];

    if (selectedOption !== undefined) {
      if (selectedOption === q.correctOptionIndex) {
        scoreObtained += q.marks;
      } else {
        scoreObtained -= q.negativeMarkingPoints; // Deduct negative mark
      }
    }
  }

  scoreObtained = Math.max(0, scoreObtained);
  const percentage = maxScore > 0 ? Math.round((scoreObtained / maxScore) * 100) : 0;

  return { scoreObtained, maxScore, percentage };
}

// Student Gradebook "What-If" Calculator
export function calculateWeightedFinalGrade(components: GradeComponent[]): {
  finalPercentage: number;
  estimatedGrade: string;
} {
  let totalWeightedScore = 0;
  let totalWeight = 0;

  for (const comp of components) {
    totalWeightedScore += (comp.scoreObtained * comp.weightPct) / 100;
    totalWeight += comp.weightPct;
  }

  const finalPercentage = Math.round(totalWeightedScore);

  let estimatedGrade = 'F';
  if (finalPercentage >= 90) estimatedGrade = 'O (10.0)';
  else if (finalPercentage >= 80) estimatedGrade = 'A+ (9.0)';
  else if (finalPercentage >= 70) estimatedGrade = 'A (8.0)';
  else if (finalPercentage >= 60) estimatedGrade = 'B+ (7.0)';
  else if (finalPercentage >= 50) estimatedGrade = 'B (6.0)';

  return { finalPercentage, estimatedGrade };
}
