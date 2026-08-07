import type { HostelWorkspaceData } from './hostel-types';

const WELFARE_ROLES = new Set(['FACULTY', 'HOD', 'DEAN', 'REGISTRAR']);

export function clientSafeHostelWorkspace(data: HostelWorkspaceData): HostelWorkspaceData {
  if (!WELFARE_ROLES.has(data.role)) return data;
  return {
    ...data,
    charges: [],
    outpasses: [],
    incidents: [],
    allocation: null,
    student: data.student ? { ...data.student, balanceDue: 0, allocation: sanitizeAllocation(data.student.allocation) } : data.student,
    operations: data.operations
      ? {
          ...data.operations,
          outstandingAmount: 0,
          students: data.operations.students.map((student) => ({
            ...student,
            balanceDue: 0,
            allocation: sanitizeAllocation(student.allocation),
          })),
        }
      : data.operations,
  };
}

function sanitizeAllocation(allocation: HostelWorkspaceData['allocation']) {
  if (!allocation) return null;
  return {
    ...allocation,
    building: null,
    roomNumber: null,
    bedLabel: null,
    mealPlan: null,
    providerName: null,
  };
}
