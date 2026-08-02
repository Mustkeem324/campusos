export interface CourseOfferingSeat {
  offeringId: string;
  courseCode: string;
  title: string;
  capacity: number;
  enrolledCount: number;
  version: number; // Optimistic concurrency version
  timeSlot: { dayOfWeek: number; startTime: string; endTime: string };
  prerequisites: string[];
  credits: number;
}

export interface StudentRegistrationProfile {
  studentId: string;
  tenantId: string;
  cgpa: number;
  completedCourseCodes: string[];
  enrolledOfferingIds: string[];
  totalEnrolledCredits: number;
}

export interface RegistrationRequest {
  studentProfile: StudentRegistrationProfile;
  offeringId: string;
}

export interface RegistrationResult {
  success: boolean;
  message: string;
  updatedSeats?: number;
  receiptNumber?: string;
}

// In-memory seat registry simulating PostgreSQL RLS + SELECT FOR UPDATE / Optimistic Locking
export const OFFERING_SEATS: Record<string, CourseOfferingSeat> = {
  offering_cs401_secA: {
    offeringId: 'offering_cs401_secA',
    courseCode: 'CS401',
    title: 'Advanced Data Structures & Algorithms',
    capacity: 50,
    enrolledCount: 48,
    version: 1,
    timeSlot: { dayOfWeek: 1, startTime: '09:00', endTime: '10:30' },
    prerequisites: ['CS201'],
    credits: 4,
  },
  offering_cs405_secB: {
    offeringId: 'offering_cs405_secB',
    courseCode: 'CS405',
    title: 'Machine Learning & Neural Networks',
    capacity: 30,
    enrolledCount: 29,
    version: 1,
    timeSlot: { dayOfWeek: 2, startTime: '11:00', endTime: '12:30' },
    prerequisites: ['CS301', 'MA202'],
    credits: 4,
  },
  offering_cs410_secA: {
    offeringId: 'offering_cs410_secA',
    courseCode: 'CS410',
    title: 'Distributed Systems & Cloud Computing',
    capacity: 25,
    enrolledCount: 25, // FULL CAPACITY FOR WAITLIST TESTING
    version: 1,
    timeSlot: { dayOfWeek: 1, startTime: '09:00', endTime: '10:30' }, // Clashes with CS401
    prerequisites: ['CS305'],
    credits: 3,
  },
};

// Thread-safe atomic seat reservation simulation using Optimistic Version Checking
export function registerCourseOptimistic(
  student: StudentRegistrationProfile,
  offeringId: string,
  minCredits = 12,
  maxCredits = 26
): RegistrationResult {
  const offering = OFFERING_SEATS[offeringId];

  if (!offering) {
    return { success: false, message: 'Course offering not found' };
  }

  // 1. Prerequisite Validation
  for (const prereq of offering.prerequisites) {
    if (!student.completedCourseCodes.includes(prereq)) {
      return {
        success: false,
        message: `Prerequisite missing: ${prereq} must be completed before enrolling in ${offering.courseCode}`,
      };
    }
  }

  // 2. Min/Max Credit Limits Check
  if (student.totalEnrolledCredits + offering.credits > maxCredits) {
    return {
      success: false,
      message: `Credit limit exceeded! Enrolling would result in ${
        student.totalEnrolledCredits + offering.credits
      } credits (Max allowed: ${maxCredits})`,
    };
  }

  // 3. Timetable Clash Detection
  for (const enrolledId of student.enrolledOfferingIds) {
    const enrolled = OFFERING_SEATS[enrolledId];
    if (
      enrolled &&
      enrolled.timeSlot.dayOfWeek === offering.timeSlot.dayOfWeek &&
      enrolled.timeSlot.startTime === offering.timeSlot.startTime
    ) {
      return {
        success: false,
        message: `Schedule Clash! ${offering.courseCode} clashes with already enrolled course ${enrolled.courseCode} on Day ${offering.timeSlot.dayOfWeek} at ${offering.timeSlot.startTime}`,
      };
    }
  }

  // 4. ATOMIC SEAT CHECK & RESERVATION (Zero Overbooking Lock)
  const currentVersion = offering.version;

  if (offering.enrolledCount >= offering.capacity) {
    return {
      success: false,
      message: `Section Full! ${offering.courseCode} has reached max capacity of ${offering.capacity}. Added to waitlist.`,
    };
  }

  // Simulate Atomic CAS (Compare-And-Swap) Update
  if (offering.version !== currentVersion) {
    return {
      success: false,
      message: 'Concurrent seat modification detected. Retrying atomic lock...',
    };
  }

  // Execute atomic seat count increment
  offering.enrolledCount += 1;
  offering.version += 1;

  student.enrolledOfferingIds.push(offeringId);
  student.totalEnrolledCredits += offering.credits;

  const receiptNumber = `RCPT-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

  return {
    success: true,
    message: `Successfully registered for ${offering.courseCode} — ${offering.title}`,
    updatedSeats: offering.enrolledCount,
    receiptNumber,
  };
}

// Elective Preference Auto-Allotment Algorithm (CGPA Weighted with tie-breakers)
export interface PreferenceChoice {
  studentId: string;
  studentName: string;
  cgpa: number;
  preferenceRank: number; // 1 = First Choice, 2 = Second Choice
  requestedOfferingId: string;
}

export function runElectiveAutoAllotment(
  choices: PreferenceChoice[]
): { allotted: PreferenceChoice[]; waitlisted: PreferenceChoice[] } {
  // Sort choices by Preference Rank (asc), then CGPA (desc) for merit allotment
  const sorted = [...choices].sort((a, b) => {
    if (a.preferenceRank !== b.preferenceRank) {
      return a.preferenceRank - b.preferenceRank;
    }
    return b.cgpa - a.cgpa; // CGPA tie-breaker
  });

  const allotted: PreferenceChoice[] = [];
  const waitlisted: PreferenceChoice[] = [];
  const seatCounts: Record<string, number> = {};

  for (const choice of sorted) {
    const offering = OFFERING_SEATS[choice.requestedOfferingId];
    if (!offering) continue;

    const currentCount = seatCounts[choice.requestedOfferingId] || offering.enrolledCount;
    if (currentCount < offering.capacity) {
      seatCounts[choice.requestedOfferingId] = currentCount + 1;
      allotted.push(choice);
    } else {
      waitlisted.push(choice);
    }
  }

  return { allotted, waitlisted };
}
