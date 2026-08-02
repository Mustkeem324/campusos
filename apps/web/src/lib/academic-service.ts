import { z } from 'zod';

export interface CourseOutcome {
  id: string;
  code: string; // e.g. CO1, CO2
  description: string;
  targetAttainmentPct: number;
}

export interface ProgramOutcome {
  id: string;
  code: string; // e.g. PO1, PO2
  title: string;
  description: string;
}

export interface COPOMapping {
  coId: string;
  poId: string;
  weight: 1 | 2 | 3; // 1=Low, 2=Medium, 3=High correlation
}

export interface CourseDetail {
  id: string;
  tenantId: string;
  code: string;
  title: string;
  departmentId: string;
  lectureCredits: number;
  tutorialCredits: number;
  practicalCredits: number;
  totalCredits: number;
  type: 'CORE' | 'ELECTIVE' | 'OPEN_ELECTIVE';
  prerequisiteCodes: string[];
  outcomes: CourseOutcome[];
  coPoMatrix: COPOMapping[];
}

export interface GradingScale {
  type: 'CGPA_10' | 'GPA_4_0' | 'RELATIVE';
  gradePoints: { grade: string; minPct: number; points: number }[];
}

export const DEFAULT_10_POINT_SCALE: GradingScale = {
  type: 'CGPA_10',
  gradePoints: [
    { grade: 'O', minPct: 90, points: 10.0 },
    { grade: 'A+', minPct: 80, points: 9.0 },
    { grade: 'A', minPct: 70, points: 8.0 },
    { grade: 'B+', minPct: 60, points: 7.0 },
    { grade: 'B', minPct: 50, points: 6.0 },
    { grade: 'C', minPct: 40, points: 5.0 },
    { grade: 'F', minPct: 0, points: 0.0 },
  ],
};

export const DEMO_COURSES: CourseDetail[] = [
  {
    id: 'crs_cs401',
    tenantId: 'inst_apex_univ',
    code: 'CS401',
    title: 'Advanced Data Structures & Algorithms',
    departmentId: 'dept_cs',
    lectureCredits: 3,
    tutorialCredits: 0,
    practicalCredits: 1,
    totalCredits: 4,
    type: 'CORE',
    prerequisiteCodes: ['CS201'],
    outcomes: [
      { id: 'co_1', code: 'CO1', description: 'Analyze asymptotic time complexity of non-linear data structures', targetAttainmentPct: 75 },
      { id: 'co_2', code: 'CO2', description: 'Design dynamic programming algorithms for graph problems', targetAttainmentPct: 70 },
    ],
    coPoMatrix: [
      { coId: 'co_1', poId: 'po_1', weight: 3 },
      { coId: 'co_2', poId: 'po_2', weight: 3 },
    ],
  },
  {
    id: 'crs_cs405',
    tenantId: 'inst_apex_univ',
    code: 'CS405',
    title: 'Machine Learning & Neural Networks',
    departmentId: 'dept_cs',
    lectureCredits: 3,
    tutorialCredits: 1,
    practicalCredits: 0,
    totalCredits: 4,
    type: 'ELECTIVE',
    prerequisiteCodes: ['CS301', 'MA202'],
    outcomes: [
      { id: 'co_3', code: 'CO1', description: 'Implement supervised classification and gradient descent models', targetAttainmentPct: 80 },
    ],
    coPoMatrix: [
      { coId: 'co_3', poId: 'po_1', weight: 2 },
    ],
  },
  {
    id: 'crs_cs410',
    tenantId: 'inst_apex_univ',
    code: 'CS410',
    title: 'Distributed Systems & Cloud Computing',
    departmentId: 'dept_cs',
    lectureCredits: 3,
    tutorialCredits: 0,
    practicalCredits: 0,
    totalCredits: 3,
    type: 'ELECTIVE',
    prerequisiteCodes: ['CS305'],
    outcomes: [
      { id: 'co_4', code: 'CO1', description: 'Design fault-tolerant distributed consensus models', targetAttainmentPct: 75 },
    ],
    coPoMatrix: [
      { coId: 'co_4', poId: 'po_3', weight: 3 },
    ],
  },
];

export function calculateCOPOAttainment(course: CourseDetail, studentScores: { coId: string; scorePct: number }[]): {
  coCode: string;
  attainmentPct: number;
  isAchieved: boolean;
}[] {
  return course.outcomes.map((co) => {
    const scores = studentScores.filter((s) => s.coId === co.id);
    const avgScore = scores.length > 0 ? scores.reduce((acc, s) => acc + s.scorePct, 0) / scores.length : 0;
    return {
      coCode: co.code,
      attainmentPct: Math.round(avgScore),
      isAchieved: avgScore >= co.targetAttainmentPct,
    };
  });
}
