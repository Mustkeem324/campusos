export type ExamDeliveryMode =
  | 'OFFLINE'
  | 'ONLINE_UNPROCTORED'
  | 'ONLINE_PROCTORED'
  | 'HUMAN_PROCTORED'
  | 'AI_ASSISTED_PROCTORED'
  | 'HYBRID';

export type ExamAttemptStatus =
  | 'SCHEDULED'
  | 'PRECHECK_AVAILABLE'
  | 'VERIFICATION_PENDING'
  | 'WAITING_ROOM'
  | 'APPROVED'
  | 'READY'
  | 'IN_PROGRESS'
  | 'RECONNECTING'
  | 'SUBMITTED'
  | 'AUTO_SUBMITTED'
  | 'TECHNICAL_REVIEW'
  | 'PROCTORING_REVIEW'
  | 'COMPLETED'
  | 'CANCELLED';

export type VerificationState =
  | 'PENDING'
  | 'MATCH'
  | 'POSSIBLE_MATCH'
  | 'REVIEW_REQUIRED'
  | 'FAILED'
  | 'PROVIDER_UNAVAILABLE'
  | 'APPROVED'
  | 'REJECTED';

export type PrecheckState = 'INCOMPLETE' | 'READY' | 'REVIEW_REQUIRED' | 'FAILED';
export type NetworkQuality = 'UNKNOWN' | 'POOR' | 'FAIR' | 'GOOD' | 'EXCELLENT';
export type ProctoringSeverity = 'INFO' | 'LOW' | 'MEDIUM' | 'HIGH';

export type ExamSecurityProfile = {
  id: string;
  name: string;
  description: string | null;
  status: 'ACTIVE' | 'INACTIVE' | 'ARCHIVED';
  identityRequired: boolean;
  selfieRequired: boolean;
  livenessRequired: boolean;
  primaryCameraRequired: boolean;
  microphoneRequired: boolean;
  screenShareRequired: boolean;
  fullscreenRequired: boolean;
  secondCameraRequired: boolean;
  humanAdmissionRequired: boolean;
  aiEventAnalysisEnabled: boolean;
  clipboardRestricted: boolean;
  permittedMaterials: Record<string, unknown>;
};

export type DevicePrecheck = {
  browserSupported: boolean;
  cameraReady: boolean;
  microphoneReady: boolean;
  screenShareReady: boolean;
  fullscreenReady: boolean;
  secondCameraReady: boolean;
  networkQuality: NetworkQuality;
  state: PrecheckState;
  checkedAt?: string | null;
};

export type ReadinessItem = {
  key: 'TERMS' | 'IDENTITY' | 'CAMERA' | 'MICROPHONE' | 'SCREEN' | 'FULLSCREEN' | 'SECOND_CAMERA' | 'HUMAN_APPROVAL';
  label: string;
  required: boolean;
  ready: boolean;
  blocking: boolean;
  detail?: string;
};

export type ExamReadiness = {
  ready: boolean;
  items: ReadinessItem[];
};

export type StudentExamCard = {
  configId: string;
  examId: string;
  examName: string;
  examType: string;
  courseOfferingId: string | null;
  courseCode: string | null;
  courseTitle: string | null;
  deliveryMode: ExamDeliveryMode;
  status: string;
  startsAt: string | null;
  endsAt: string | null;
  durationMinutes: number | null;
  instructions: string | null;
  securityProfile: ExamSecurityProfile | null;
  attempt: {
    id: string;
    attemptNo: number;
    status: ExamAttemptStatus;
    startedAt: string | null;
    deadlineAt: string | null;
    submittedAt: string | null;
    submissionReference: string | null;
    admittedAt: string | null;
  } | null;
  terms: {
    id: string;
    version: string;
    title: string;
    content: string;
    accepted: boolean;
  } | null;
  identityState: VerificationState | null;
  precheck: DevicePrecheck | null;
  secondCamera: {
    status: 'PAIRING' | 'PAIRED' | 'CONNECTED' | 'DEGRADED' | 'DISCONNECTED' | 'CLOSED' | 'EXPIRED';
    lastHeartbeatAt: string | null;
  } | null;
  readiness: ExamReadiness;
};

export type ProctorLiveAttempt = {
  attemptId: string;
  configId: string;
  studentId: string;
  studentName: string;
  rollNumber: string;
  examName: string;
  examType: string;
  status: ExamAttemptStatus;
  deliveryMode: ExamDeliveryMode;
  identityState: VerificationState | null;
  precheckState: PrecheckState | null;
  secondCameraStatus: string | null;
  lastHeartbeatAt: string | null;
  unreviewedHighEvents: number;
  unreviewedMediumEvents: number;
};

export type ExamConfigSummary = {
  configId: string;
  examId: string;
  examName: string;
  examType: string;
  deliveryMode: ExamDeliveryMode;
  status: string;
  startsAt: string | null;
  endsAt: string | null;
  courseOfferingId: string | null;
  courseCode: string | null;
  courseTitle: string | null;
  securityProfileId: string | null;
  securityProfileName: string | null;
  attemptCount: number;
  activeAttemptCount: number;
  reviewRequiredCount: number;
};

export type SecureExamWorkspace =
  | {
      kind: 'STUDENT';
      role: 'STUDENT';
      storeReady: boolean;
      student: { id: string; name: string; rollNumber: string };
      exams: StudentExamCard[];
    }
  | {
      kind: 'ADMIN';
      role: string;
      storeReady: boolean;
      exams: ExamConfigSummary[];
      securityProfiles: ExamSecurityProfile[];
      liveAttempts: ProctorLiveAttempt[];
      availableExams: Array<{ id: string; name: string; type: string; termName: string }>;
      courseOfferings: Array<{ id: string; courseCode: string; courseTitle: string; sectionName: string }>;
    };

export type ExamAttemptQuestion = {
  id: string;
  questionId: string;
  sectionTitle: string;
  displayOrder: number;
  marks: number;
  questionType: string;
  prompt: string;
  options: unknown;
  answer: unknown | null;
  savedAt: string | null;
};

export type ExamAttemptSession = {
  attemptId: string;
  examName: string;
  examType: string;
  deliveryMode: ExamDeliveryMode;
  status: ExamAttemptStatus;
  startedAt: string | null;
  deadlineAt: string | null;
  serverNow: string;
  questions: ExamAttemptQuestion[];
  savedAt: string | null;
  submissionReference: string | null;
};
