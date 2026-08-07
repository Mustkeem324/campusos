export type AttendanceStudyMode = 'ONLINE' | 'OFFLINE' | 'HYBRID';
export type AttendanceMarkStatus = 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED';
export type AttendanceMethod = 'MANUAL' | 'FACE_CLASS' | 'FACE_DAILY' | 'OVERRIDE';
export type CalendarDayType = 'WORKING' | 'HOLIDAY' | 'INSTITUTION_CLOSED' | 'EXAM' | 'EVENT' | 'SPECIAL_WORKING';

export type AttendanceSettings = {
  storeReady: boolean;
  requiredPercentage: number;
  timezone: string;
  allowOfflineSelfCheckIn: boolean;
  requireOnlineFace: boolean;
  requireOfflineSelfFace: boolean;
  allowHybridDailyCheckIn: boolean;
  checkinEarlyMinutes: number;
  checkinLateMinutes: number;
  checkoutEnabled: boolean;
};

export type AttendanceClass = {
  timetableSlotId: string;
  courseOfferingId: string;
  courseCode: string;
  courseTitle: string;
  facultyName: string;
  roomLabel: string;
  startTime: string;
  endTime: string;
  sessionId: string | null;
  sessionStatus: 'SCHEDULED' | 'OPEN' | 'SUBMITTED' | 'CANCELLED';
  markStatus: AttendanceMarkStatus | null;
  method: AttendanceMethod | null;
  checkedInAt: string | null;
  checkedOutAt: string | null;
  canCheckIn: boolean;
  canCheckOut: boolean;
};

export type AttendanceCourseSummary = {
  courseOfferingId: string;
  courseCode: string;
  courseTitle: string;
  held: number;
  present: number;
  absent: number;
  late: number;
  excused: number;
  percentage: number;
  threshold: number;
  shortage: boolean;
  classesNeededForTarget: number;
  missedClasses: number;
};

export type AttendanceStudentView = {
  studentId: string;
  studentName: string;
  rollNumber: string;
  studyMode: AttendanceStudyMode | 'UNCLASSIFIED';
  todayLabel: string;
  calendarDay: { type: CalendarDayType; title: string } | null;
  todayClasses: AttendanceClass[];
  dailyPresence: {
    checkedInAt: string;
    checkedOutAt: string | null;
    status: 'ACTIVE' | 'COMPLETED' | 'VOID';
  } | null;
  summaries: AttendanceCourseSummary[];
  faceReady: boolean;
  faceConsent: boolean;
  selfCheckInAllowed: boolean;
};

export type AttendanceFacultyStudent = {
  studentId: string;
  name: string;
  rollNumber: string;
  studyMode: AttendanceStudyMode | 'UNCLASSIFIED';
  status: AttendanceMarkStatus | null;
  method: AttendanceMethod | null;
};

export type AttendanceFacultySession = {
  sessionId: string;
  timetableSlotId: string | null;
  courseOfferingId: string;
  courseCode: string;
  courseTitle: string;
  sessionDate: string;
  startTime: string;
  endTime: string;
  status: 'SCHEDULED' | 'OPEN' | 'SUBMITTED' | 'CANCELLED';
  students: AttendanceFacultyStudent[];
};

export type AttendanceWorkspace = {
  role: string;
  settings: AttendanceSettings;
  student: AttendanceStudentView | null;
  wards: AttendanceStudentView[];
  facultySessions: AttendanceFacultySession[];
  institutionMetrics: {
    enrolledStudents: number;
    classifiedStudents: number;
    onlineStudents: number;
    offlineStudents: number;
    hybridStudents: number;
    belowThreshold: number;
    submittedToday: number;
  } | null;
};

export type AttendanceAdminStudent = {
  studentId: string;
  name: string;
  rollNumber: string;
  studyMode: AttendanceStudyMode | 'UNCLASSIFIED';
  programName: string;
  batchName: string;
  sectionName: string | null;
};

export type AttendanceCalendarEntry = {
  id: string;
  calendarDate: string;
  dayType: CalendarDayType;
  title: string;
  description: string | null;
  scopeLabel: string;
};

export type AttendanceAdminData = {
  settings: AttendanceSettings;
  students: AttendanceAdminStudent[];
  calendar: AttendanceCalendarEntry[];
  metrics: AttendanceWorkspace['institutionMetrics'];
};
