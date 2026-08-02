export interface RoomSlot {
  id: string;
  roomNumber: string;
  building: string;
  capacity: number;
  type: 'LECTURE_HALL' | 'COMPUTER_LAB' | 'SEMINAR_ROOM';
}

export interface TimeSlotPeriod {
  periodIndex: number; // 1 to 6
  startTime: string;   // e.g. "09:00"
  endTime: string;     // e.g. "10:00"
  isLunchBreak?: boolean;
}

export interface TimetableClassRequirement {
  id: string;
  courseCode: string;
  courseTitle: string;
  facultyId: string;
  facultyName: string;
  batchSectionId: string;
  roomTypeNeeded: 'LECTURE_HALL' | 'COMPUTER_LAB' | 'SEMINAR_ROOM';
  durationHours: number; // 1 for lecture, 2 for lab
}

export interface ScheduledSlot {
  id: string;
  requirementId: string;
  courseCode: string;
  courseTitle: string;
  facultyId: string;
  facultyName: string;
  batchSectionId: string;
  roomId: string;
  roomNumber: string;
  dayOfWeek: number; // 1 = Mon ... 5 = Fri
  periodIndex: number;
  startTime: string;
  endTime: string;
}

export interface ClashConflict {
  type: 'FACULTY_CLASH' | 'ROOM_CLASH' | 'BATCH_CLASH' | 'LUNCH_CLASH';
  description: string;
}

export const PERIODS: TimeSlotPeriod[] = [
  { periodIndex: 1, startTime: '09:00', endTime: '10:00' },
  { periodIndex: 2, startTime: '10:00', endTime: '11:00' },
  { periodIndex: 3, startTime: '11:00', endTime: '12:00' },
  { periodIndex: 4, startTime: '12:00', endTime: '13:00', isLunchBreak: true },
  { periodIndex: 5, startTime: '13:00', endTime: '14:00' },
  { periodIndex: 6, startTime: '14:00', endTime: '15:00' },
];

export const DEMO_ROOMS: RoomSlot[] = [
  { id: 'rm_101', roomNumber: 'Hall A1', building: 'Academic Block 1', capacity: 60, type: 'LECTURE_HALL' },
  { id: 'rm_lab3b', roomNumber: 'Lab 3B', building: 'IT Block', capacity: 40, type: 'COMPUTER_LAB' },
  { id: 'rm_sem2', roomNumber: 'Seminar Room 2', building: 'Main Hall', capacity: 50, type: 'SEMINAR_ROOM' },
];

// CSP (Constraint Satisfaction Problem) Solver Algorithm for Timetable Generation
export function solveTimetableCSP(
  requirements: TimetableClassRequirement[],
  rooms: RoomSlot[] = DEMO_ROOMS
): { scheduledSlots: ScheduledSlot[]; conflicts: ClashConflict[] } {
  const scheduledSlots: ScheduledSlot[] = [];
  const conflicts: ClashConflict[] = [];

  // Track occupancy matrices
  const facultyBusy: Set<string> = new Set(); // `facultyId_day_period`
  const roomBusy: Set<string> = new Set();    // `roomId_day_period`
  const batchBusy: Set<string> = new Set();   // `batchId_day_period`

  const DAYS = [1, 2, 3, 4, 5]; // Monday to Friday

  for (const req of requirements) {
    let allocated = false;

    for (const day of DAYS) {
      if (allocated) break;

      for (const pd of PERIODS) {
        if (pd.isLunchBreak) continue; // Respect Lunch Break Constraint
        if (allocated) break;

        const periodKey = `${day}_${pd.periodIndex}`;
        const facultyKey = `${req.facultyId}_${periodKey}`;
        const batchKey = `${req.batchSectionId}_${periodKey}`;

        // Hard Constraint Check: Faculty or Batch already busy
        if (facultyBusy.has(facultyKey) || batchBusy.has(batchKey)) {
          continue;
        }

        // Find available suitable room
        const suitableRoom = rooms.find(
          (r) => r.type === req.roomTypeNeeded && !roomBusy.has(`${r.id}_${periodKey}`)
        );

        if (suitableRoom) {
          const roomKey = `${suitableRoom.id}_${periodKey}`;

          // Reserve slot
          facultyBusy.add(facultyKey);
          batchBusy.add(batchKey);
          roomBusy.add(roomKey);

          scheduledSlots.push({
            id: `slot_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
            requirementId: req.id,
            courseCode: req.courseCode,
            courseTitle: req.courseTitle,
            facultyId: req.facultyId,
            facultyName: req.facultyName,
            batchSectionId: req.batchSectionId,
            roomId: suitableRoom.id,
            roomNumber: suitableRoom.roomNumber,
            dayOfWeek: day,
            periodIndex: pd.periodIndex,
            startTime: pd.startTime,
            endTime: pd.endTime,
          });

          allocated = true;
        }
      }
    }

    if (!allocated) {
      conflicts.push({
        type: 'ROOM_CLASH',
        description: `Failed to schedule ${req.courseCode} for ${req.facultyName} due to room/time capacity constraints`,
      });
    }
  }

  return { scheduledSlots, conflicts };
}
