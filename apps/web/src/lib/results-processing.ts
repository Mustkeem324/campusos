import { PrismaClient } from '@prisma/client';

export async function processExaminationResults(db: any, examinationId: string, tenantId: string) {
  // 1. Get all MarksEntryBatches for this exam that are APPROVED
  const batches = await db.marksEntryBatch.findMany({
    where: { examinationId, status: 'APPROVED', tenantId },
    include: {
      marks: true,
      courseOffering: {
        include: { course: true }
      }
    }
  });

  if (batches.length === 0) {
    throw new Error('No approved marks entry batches found for processing.');
  }

  // 2. Map student marks
  const studentCourseData = new Map<string, any[]>();
  
  // Also get the default grade scale
  const gradeScales = await db.gradeScale.findMany({
    where: { tenantId },
    orderBy: { minMarks: 'desc' }
  });

  // Function to calculate grade
  const calculateGrade = (percentage: number) => {
    for (const scale of gradeScales) {
      if (percentage >= scale.minMarks) {
        return scale;
      }
    }
    return gradeScales[gradeScales.length - 1]; // Fallback to lowest
  };

  for (const batch of batches) {
    const course = batch.courseOffering.course;
    const credits = course.lectureCredits + course.tutorialCredits + course.practicalCredits;
    
    for (const mark of batch.marks) {
      const percentage = (mark.marksObtained / mark.maxMarks) * 100;
      const grade = calculateGrade(percentage);

      const data = {
        courseOfferingId: batch.courseOfferingId,
        totalMarks: mark.marksObtained,
        grade: grade?.gradeLetter || 'F',
        gradePoints: grade?.gradePoints || 0,
        credits: credits,
        isPass: (grade?.gradePoints || 0) > 0,
      };

      if (!studentCourseData.has(mark.studentId)) {
        studentCourseData.set(mark.studentId, []);
      }
      studentCourseData.get(mark.studentId)?.push(data);
    }
  }

  // 3. Create Semester Results and Course Results
  const results = [];
  for (const [studentId, courses] of Array.from(studentCourseData.entries())) {
    let totalPoints = 0;
    let totalCredits = 0;
    let earnedCredits = 0;
    let isFail = false;

    for (const c of courses) {
      totalCredits += c.credits;
      totalPoints += c.gradePoints * c.credits;
      if (c.isPass) {
        earnedCredits += c.credits;
      } else {
        isFail = true;
      }
    }

    const sgpa = totalCredits > 0 ? (totalPoints / totalCredits) : 0;
    
    // For CGPA, ideally we'd fetch previous semesters, but we'll approximate/stub
    const student = await db.student.findUnique({ where: { id: studentId } });
    
    // Update student overall
    const newTotalCredits = (student?.creditsEarned || 0) + earnedCredits;
    // Simple CGPA calculation approximation for stub:
    const prevCgpa = student?.cgpa || 0;
    const cgpa = newTotalCredits > 0 ? ((prevCgpa * (student?.creditsEarned || 0) + (sgpa * totalCredits)) / (newTotalCredits + (student?.creditsEarned === 0 && newTotalCredits === 0 ? 1 : 0))) : 0;

    await db.student.update({
      where: { id: studentId },
      data: { cgpa, creditsEarned: newTotalCredits }
    });

    const semesterResult = await db.studentSemesterResult.create({
      data: {
        tenantId,
        studentId,
        examinationId,
        sgpa,
        cgpa,
        totalCredits,
        earnedCredits,
        status: isFail ? 'FAIL' : 'PASS',
        published: false,
        courseResults: {
          create: courses.map((c: any) => ({
            tenantId,
            studentId,
            courseOfferingId: c.courseOfferingId,
            totalMarks: c.totalMarks,
            grade: c.grade,
            gradePoints: c.gradePoints,
            credits: c.credits,
            isPass: c.isPass
          }))
        }
      }
    });

    results.push(semesterResult);
  }

  return results;
}
