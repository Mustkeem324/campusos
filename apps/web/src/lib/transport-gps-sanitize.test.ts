import { describe, expect, it } from 'vitest';

import { clientSafeTransportWorkspace } from './transport-gps-sanitize';
import type { TransportWorkspaceData } from './transport-gps-types';

function fixture(visible: boolean): TransportWorkspaceData {
  return {
    generatedAt: '2026-08-08T00:00:00.000Z',
    institutionName: 'Nexus Institute of Technology',
    role: 'STUDENT',
    settings: {
      enabled: visible,
      gpsTrackingEnabled: true,
      allowHybridStudents: true,
      telemetryStaleSeconds: 180,
    },
    availability: {
      storeReady: true,
      visible,
      enabled: visible,
      eligible: visible,
      reason: visible ? 'AVAILABLE' : 'MODULE_DISABLED',
      studyMode: 'OFFLINE',
    },
    riders: [{
      studentId: 'student-1',
      name: 'Student One',
      rollNumber: 'NITX-001',
      programme: 'B.Tech',
      section: 'A',
      studyMode: 'OFFLINE',
      transportOptIn: true,
      eligible: true,
      routeId: 'route-1',
      routeName: 'Route 01',
      vehicleId: 'vehicle-1',
      vehicle: null,
    }],
    fleet: [{
      id: 'vehicle-1',
      label: 'Bus 01',
      registrationNumber: 'UP32 AB 1234',
      driverName: null,
      driverPhone: null,
      status: 'ACTIVE',
      routeId: 'route-1',
      routeName: 'Route 01',
      lastSeenAt: null,
      latestPosition: null,
    }],
  };
}

describe('transport GPS client serialization', () => {
  it('strips route and fleet details when transport is hidden', () => {
    const safe = clientSafeTransportWorkspace(fixture(false));
    expect(safe.fleet).toEqual([]);
    expect(safe.riders[0].routeId).toBeNull();
    expect(safe.riders[0].routeName).toBeNull();
    expect(safe.riders[0].vehicleId).toBeNull();
  });

  it('preserves authorised GPS details when transport is visible', () => {
    const safe = clientSafeTransportWorkspace(fixture(true));
    expect(safe.fleet).toHaveLength(1);
    expect(safe.riders[0].routeId).toBe('route-1');
  });
});
