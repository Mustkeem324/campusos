import type { TransportWorkspaceData } from './transport-gps-types';

/**
 * Never serialize route/vehicle details to a student or guardian when the
 * institution feature gate or student eligibility says Transport is hidden.
 * Server-side loaders may read assignments to evaluate policy; this boundary
 * controls what is allowed to leave the server.
 */
export function clientSafeTransportWorkspace(data: TransportWorkspaceData): TransportWorkspaceData {
  const isRiderView = data.role === 'STUDENT' || data.role === 'PARENT';
  if (!isRiderView || data.availability.visible) return data;

  return {
    ...data,
    fleet: [],
    riders: data.riders.map((rider) => ({
      ...rider,
      routeId: null,
      routeName: null,
      vehicleId: null,
      vehicle: null,
    })),
  };
}
