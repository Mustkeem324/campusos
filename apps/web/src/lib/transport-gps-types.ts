export type StudentStudyMode = 'ONLINE' | 'OFFLINE' | 'HYBRID';

export type TransportModuleSettings = {
  enabled: boolean;
  gpsTrackingEnabled: boolean;
  allowHybridStudents: boolean;
  telemetryStaleSeconds: number;
};

export type TransportAvailability = {
  storeReady: boolean;
  visible: boolean;
  enabled: boolean;
  eligible: boolean;
  reason: 'AVAILABLE' | 'MODULE_DISABLED' | 'GPS_DISABLED' | 'ONLINE_ONLY' | 'HYBRID_DISABLED' | 'NOT_OPTED_IN' | 'ROLE_NOT_SUPPORTED' | 'STORE_UNAVAILABLE';
  studyMode: StudentStudyMode | null;
};

export type TransportPosition = {
  latitude: number;
  longitude: number;
  speedKph: number | null;
  headingDegrees: number | null;
  accuracyMeters: number | null;
  recordedAt: string;
  receivedAt: string;
  stale: boolean;
};

export type TransportVehicle = {
  id: string;
  label: string;
  registrationNumber: string;
  driverName: string | null;
  driverPhone: string | null;
  status: string;
  routeId: string | null;
  routeName: string | null;
  lastSeenAt: string | null;
  latestPosition: TransportPosition | null;
};

export type TransportRider = {
  studentId: string;
  name: string;
  rollNumber: string;
  programme: string | null;
  section: string | null;
  studyMode: StudentStudyMode;
  transportOptIn: boolean;
  eligible: boolean;
  routeId: string | null;
  routeName: string | null;
  vehicleId: string | null;
  vehicle: TransportVehicle | null;
};

export type TransportWorkspaceData = {
  generatedAt: string;
  institutionName: string;
  role: string;
  settings: TransportModuleSettings;
  availability: TransportAvailability;
  riders: TransportRider[];
  fleet: TransportVehicle[];
};

export type TransportAdminData = {
  generatedAt: string;
  institutionName: string;
  settings: TransportModuleSettings;
  storeReady: boolean;
  routes: Array<{ id: string; routeName: string }>;
  students: Array<{
    studentId: string;
    name: string;
    email: string;
    rollNumber: string;
    programme: string;
    section: string | null;
    studyMode: StudentStudyMode;
    transportOptIn: boolean;
    eligible: boolean;
    routeId: string | null;
    vehicleId: string | null;
  }>;
  fleet: TransportVehicle[];
  metrics: {
    totalStudents: number;
    onlineStudents: number;
    offlineStudents: number;
    hybridStudents: number;
    eligibleStudents: number;
    assignedStudents: number;
    vehicles: number;
    liveVehicles: number;
    staleVehicles: number;
  };
};
