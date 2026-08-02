export interface ExamStudent {
  studentId: string;
  rollNumber: string;
  name: string;
  branch: string; // e.g. "CS", "ME", "EE"
  attendancePct: number;
  hasFeeDues: boolean;
  cgpa: number;
}

export interface SeatAllocation {
  seatNumber: string; // e.g. "A1", "A2"
  row: number;
  col: number;
  studentId: string;
  rollNumber: string;
  name: string;
  branch: string;
}

export interface ExamMarkRecord {
  studentId: string;
  rollNumber: string;
  name: string;
  internalScore: number; // Max 30
  endTermScore: number;   // Max 70
  totalScore: number;    // Out of 100
  graceMarks: number;    // Moderation grace
  finalScore: number;
  gradeLetter: string;
  gradePoints: number;
  status: 'FACULTY_SUBMITTED' | 'HOD_APPROVED' | 'COE_PUBLISHED';
}

// 1. Exam Eligibility Gatekeeper Check (Attendance >= 75% AND Fee Dues == 0)
export function checkExamEligibility(student: ExamStudent): {
  eligible: boolean;
  reason?: string;
} {
  if (student.attendancePct < 75) {
    return {
      eligible: false,
      reason: `Ineligible: Attendance is ${student.attendancePct.toFixed(1)}% (Min required: 75%)`,
    };
  }

  if (student.hasFeeDues) {
    return {
      eligible: false,
      reason: 'Ineligible: Pending tuition/hostel fee dues exist on account',
    };
  }

  return { eligible: true };
}

// 2. Anti-Cheating Mixed-Branch Seating Plan Generator
export function generateAntiCheatingSeatingPlan(
  students: ExamStudent[],
  rows = 5,
  cols = 6
): SeatAllocation[] {
  const allocations: SeatAllocation[] = [];

  // Group students by branch
  const csStudents = students.filter((s) => s.branch === 'CS');
  const meStudents = students.filter((s) => s.branch === 'ME');
  const eeStudents = students.filter((s) => s.branch === 'EE');

  // Interleave students from different branches in checkerboard pattern
  let csIdx = 0, meIdx = 0, eeIdx = 0;

  for (let r = 1; r <= rows; r++) {
    for (let c = 1; c <= cols; c++) {
      const isEvenCell = (r + c) % 2 === 0;
      let selectedStudent: ExamStudent | undefined;

      if (isEvenCell && csIdx < csStudents.length) {
        selectedStudent = csStudents[csIdx++];
      } else if (!isEvenCell && meIdx < meStudents.length) {
        selectedStudent = meStudents[meIdx++];
      } else if (eeIdx < eeStudents.length) {
        selectedStudent = eeStudents[eeIdx++];
      } else if (csIdx < csStudents.length) {
        selectedStudent = csStudents[csIdx++];
      } else if (meIdx < meStudents.length) {
        selectedStudent = meStudents[meIdx++];
      }

      if (selectedStudent) {
        allocations.push({
          seatNumber: `R${r}C${c}`,
          row: r,
          col: c,
          studentId: selectedStudent.studentId,
          rollNumber: selectedStudent.rollNumber,
          name: selectedStudent.name,
          branch: selectedStudent.branch,
        });
      }
    }
  }

  return allocations;
}

// 3. Grace Mark Moderation & Grade Point Computation
export function processExamResult(
  internalScore: number,
  endTermScore: number,
  applyGraceModeration = true
): { totalScore: number; graceMarks: number; finalScore: number; gradeLetter: string; gradePoints: number; isPassed: boolean } {
  let totalScore = internalScore + endTermScore;
  let graceMarks = 0;

  // Moderation Rule: If score is 38 or 39 (passing cutoff is 40), apply up to 2 grace marks to pass
  if (applyGraceModeration && (totalScore === 38 || totalScore === 39)) {
    graceMarks = 40 - totalScore;
  }

  const finalScore = totalScore + graceMarks;
  const isPassed = finalScore >= 40;

  let gradeLetter = 'F';
  let gradePoints = 0;

  if (finalScore >= 90) { gradeLetter = 'O'; gradePoints = 10; }
  else if (finalScore >= 80) { gradeLetter = 'A+'; gradePoints = 9; }
  else if (finalScore >= 70) { gradeLetter = 'A'; gradePoints = 8; }
  else if (finalScore >= 60) { gradeLetter = 'B+'; gradePoints = 7; }
  else if (finalScore >= 50) { gradeLetter = 'B'; gradePoints = 6; }
  else if (finalScore >= 40) { gradeLetter = 'C'; gradePoints = 5; }

  return { totalScore, graceMarks, finalScore, gradeLetter, gradePoints, isPassed };
}
