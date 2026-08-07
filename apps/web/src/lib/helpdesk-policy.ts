import type { RoleType } from '@prisma/client';

import type { HelpdeskCategory, HelpdeskPriority } from './helpdesk-types';

export const HELPDESK_CATEGORIES: Array<{ value: HelpdeskCategory; label: string; description: string }> = [
  { value: 'ACADEMIC', label: 'Academic / course doubt', description: 'Course delivery, learning, curriculum or academic guidance.' },
  { value: 'EXAMINATION', label: 'Examination', description: 'Exam schedule, eligibility, marks, result or examination-process issue.' },
  { value: 'FACULTY_CONCERN', label: 'Faculty / professor concern', description: 'Concern involving teaching conduct, communication or unresolved faculty support.' },
  { value: 'ATTENDANCE', label: 'Attendance', description: 'Attendance record, shortage or attendance-related clarification.' },
  { value: 'FEES', label: 'Fees & finance', description: 'Invoice, payment, receipt, refund or fee-account issue.' },
  { value: 'ADMISSIONS', label: 'Admissions', description: 'Admission, registration or onboarding support.' },
  { value: 'LIBRARY', label: 'Library', description: 'Borrowing, digital library, fine or resource-access issue.' },
  { value: 'HOSTEL', label: 'Hostel', description: 'Hostel allocation, outpass, room or residence support.' },
  { value: 'TRANSPORT', label: 'Transport', description: 'Bus route, GPS, rider assignment or transport operations.' },
  { value: 'PLACEMENT', label: 'Placement & careers', description: 'Placement cell, eligibility, internship or career-process issue.' },
  { value: 'HR', label: 'HR / staff support', description: 'Staff employment, leave or people-operations issue.' },
  { value: 'TECHNICAL', label: 'CampusOS / technical', description: 'Institution application, access, workflow or technical issue.' },
  { value: 'REGISTRAR', label: 'Registrar / records', description: 'Student record, registration, official record or administrative issue.' },
  { value: 'OTHER', label: 'Other campus service', description: 'A campus issue that does not fit another category.' },
];

const studentRoute: Record<HelpdeskCategory, RoleType> = {
  ACADEMIC: 'FACULTY',
  EXAMINATION: 'EXAMINATION_CONTROLLER',
  FACULTY_CONCERN: 'HOD',
  ATTENDANCE: 'FACULTY',
  FEES: 'FINANCE_OFFICER',
  ADMISSIONS: 'REGISTRAR',
  LIBRARY: 'LIBRARIAN',
  HOSTEL: 'WARDEN',
  TRANSPORT: 'TRANSPORT_MANAGER',
  PLACEMENT: 'PLACEMENT_OFFICER',
  HR: 'HOD',
  TECHNICAL: 'INSTITUTION_ADMIN',
  REGISTRAR: 'REGISTRAR',
  OTHER: 'REGISTRAR',
};

export function initialHelpdeskQueue(requesterRole: RoleType, category: HelpdeskCategory): RoleType {
  if (requesterRole === 'STUDENT' || requesterRole === 'PARENT') return studentRoute[category];

  if (requesterRole === 'FACULTY') {
    if (category === 'EXAMINATION') return 'EXAMINATION_CONTROLLER';
    if (category === 'HR') return 'HR_ADMIN';
    if (category === 'TECHNICAL') return 'INSTITUTION_ADMIN';
    return 'HOD';
  }

  if (requesterRole === 'HOD') {
    if (category === 'EXAMINATION') return 'EXAMINATION_CONTROLLER';
    if (category === 'HR') return 'HR_ADMIN';
    if (category === 'TECHNICAL') return 'INSTITUTION_ADMIN';
    return 'DEAN';
  }

  if (requesterRole === 'DEAN') return category === 'EXAMINATION' ? 'EXAMINATION_CONTROLLER' : 'INSTITUTION_ADMIN';
  if (requesterRole === 'EXAMINATION_CONTROLLER') return category === 'ACADEMIC' ? 'DEAN' : 'INSTITUTION_ADMIN';
  if (requesterRole === 'REGISTRAR') return category === 'ACADEMIC' ? 'DEAN' : 'INSTITUTION_ADMIN';
  if (requesterRole === 'ACCOUNTANT') return 'FINANCE_OFFICER';
  if (requesterRole === 'ADMISSIONS_COUNSELLOR') return 'REGISTRAR';
  if (requesterRole === 'FINANCE_OFFICER' || requesterRole === 'HR_ADMIN' || requesterRole === 'WARDEN'
    || requesterRole === 'LIBRARIAN' || requesterRole === 'TRANSPORT_MANAGER' || requesterRole === 'PLACEMENT_OFFICER') {
    return 'INSTITUTION_ADMIN';
  }
  return 'INSTITUTION_ADMIN';
}

const escalationMap: Partial<Record<RoleType, RoleType[]>> = {
  FACULTY: ['HOD'],
  HOD: ['DEAN', 'EXAMINATION_CONTROLLER'],
  EXAMINATION_CONTROLLER: ['DEAN', 'REGISTRAR', 'INSTITUTION_ADMIN'],
  REGISTRAR: ['DEAN', 'INSTITUTION_ADMIN'],
  ACCOUNTANT: ['FINANCE_OFFICER'],
  FINANCE_OFFICER: ['INSTITUTION_ADMIN'],
  HR_ADMIN: ['INSTITUTION_ADMIN'],
  WARDEN: ['INSTITUTION_ADMIN'],
  LIBRARIAN: ['INSTITUTION_ADMIN'],
  TRANSPORT_MANAGER: ['INSTITUTION_ADMIN'],
  PLACEMENT_OFFICER: ['INSTITUTION_ADMIN'],
  ADMISSIONS_COUNSELLOR: ['REGISTRAR', 'INSTITUTION_ADMIN'],
  DEAN: ['INSTITUTION_ADMIN'],
};

export function escalationTargetsForRole(role: RoleType): RoleType[] {
  return escalationMap[role] ?? [];
}

export function canEscalateTo(fromRole: RoleType, toRole: RoleType) {
  return escalationTargetsForRole(fromRole).includes(toRole);
}

export function slaHoursForPriority(priority: HelpdeskPriority) {
  if (priority === 'URGENT') return 4;
  if (priority === 'HIGH') return 12;
  if (priority === 'LOW') return 72;
  return 48;
}

export function helpdeskRoleLabel(role: RoleType) {
  return role.split('_').map((word) => word.charAt(0) + word.slice(1).toLowerCase()).join(' ');
}

export function categoryLabel(category: HelpdeskCategory) {
  return HELPDESK_CATEGORIES.find((item) => item.value === category)?.label ?? category;
}

export function isDepartmentScopedQueue(role: RoleType) {
  return role === 'FACULTY' || role === 'HOD';
}
