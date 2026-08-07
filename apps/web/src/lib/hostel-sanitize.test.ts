import { describe, expect, it } from 'vitest';

import { clientSafeHostelWorkspace } from './hostel-sanitize';
import type { HostelWorkspaceData } from './hostel-types';

function workspace(role: string): HostelWorkspaceData {
  return {
    role,
    settings: {
      storeReady: true,
      enabled: true,
      ownershipMode: 'MIXED',
      allowHybridStudents: true,
      requireParentOutpassApproval: true,
      requireWardenOutpassApproval: true,
      facultyWelfareVisibility: true,
      thirdPartySyncEnabled: true,
      currency: 'INR',
    },
    availability: { visible: true, reason: 'AVAILABLE', studyMode: 'OFFLINE' },
    allocation: {
      id: 'allocation-1',
      facilityName: 'North Residence',
      ownership: 'THIRD_PARTY',
      building: 'Block A',
      roomNumber: '204',
      bedLabel: 'B',
      mealPlan: 'Full Mess',
      status: 'ACTIVE',
      providerName: 'Partner Hostel Pvt Ltd',
    },
    student: {
      studentId: 'student-1',
      studentName: 'Student One',
      rollNumber: 'NIT001',
      studyMode: 'OFFLINE',
      eligible: true,
      enrolled: true,
      allocation: {
        id: 'allocation-1',
        facilityName: 'North Residence',
        ownership: 'THIRD_PARTY',
        building: 'Block A',
        roomNumber: '204',
        bedLabel: 'B',
        mealPlan: 'Full Mess',
        status: 'ACTIVE',
        providerName: 'Partner Hostel Pvt Ltd',
      },
      balanceDue: 24500,
      currentOutpassStatus: 'PENDING',
    },
    charges: [{
      id: 'charge-1',
      studentId: 'student-1',
      category: 'MESS',
      description: 'August mess fee',
      amount: 4500,
      paidAmount: 0,
      balanceAmount: 4500,
      currency: 'INR',
      dueDate: '2026-08-10',
      status: 'DUE',
      source: 'THIRD_PARTY',
    }],
    outpasses: [{
      id: 'outpass-1',
      studentId: 'student-1',
      destination: 'Home',
      reason: 'Weekend',
      departureAt: '2026-08-08T10:00:00.000Z',
      expectedReturnAt: '2026-08-09T18:00:00.000Z',
      status: 'PENDING',
      parentApproval: 'APPROVED',
      wardenApproval: 'PENDING',
    }],
    incidents: [{
      id: 'incident-1',
      studentId: 'student-1',
      kind: 'DAMAGE',
      title: 'Fixture review',
      status: 'UNDER_REVIEW',
      occurredAt: '2026-08-08T08:00:00.000Z',
      chargeAmount: 1200,
      currency: 'INR',
    }],
    operations: {
      totalEligible: 1,
      activeResidents: 1,
      roomsOccupied: 1,
      pendingOutpasses: 1,
      outstandingAmount: 24500,
      thirdPartyResidents: 1,
      students: [{
        studentId: 'student-1',
        studentName: 'Student One',
        rollNumber: 'NIT001',
        studyMode: 'OFFLINE',
        eligible: true,
        enrolled: true,
        allocation: {
          id: 'allocation-1',
          facilityName: 'North Residence',
          ownership: 'THIRD_PARTY',
          building: 'Block A',
          roomNumber: '204',
          bedLabel: 'B',
          mealPlan: 'Full Mess',
          status: 'ACTIVE',
          providerName: 'Partner Hostel Pvt Ltd',
        },
        balanceDue: 24500,
        currentOutpassStatus: 'PENDING',
      }],
    },
  };
}

describe('clientSafeHostelWorkspace', () => {
  it('strips finance, incident, provider and room detail from academic welfare roles', () => {
    const safe = clientSafeHostelWorkspace(workspace('FACULTY'));

    expect(safe.charges).toEqual([]);
    expect(safe.outpasses).toEqual([]);
    expect(safe.incidents).toEqual([]);
    expect(safe.allocation).toBeNull();
    expect(safe.operations?.outstandingAmount).toBe(0);
    expect(safe.operations?.students[0]?.balanceDue).toBe(0);
    expect(safe.operations?.students[0]?.allocation).toMatchObject({
      facilityName: 'North Residence',
      roomNumber: null,
      bedLabel: null,
      mealPlan: null,
      providerName: null,
      building: null,
    });
  });

  it('preserves authorised student operational data', () => {
    const original = workspace('STUDENT');
    const safe = clientSafeHostelWorkspace(original);

    expect(safe).toBe(original);
    expect(safe.charges).toHaveLength(1);
    expect(safe.allocation?.roomNumber).toBe('204');
    expect(safe.outpasses).toHaveLength(1);
  });
});
