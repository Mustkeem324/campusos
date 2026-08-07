export type TransportPhase2Settings = {
  parentEtaAlertsEnabled: boolean;
  parentEmailAlertsEnabled: boolean;
  etaAlertLeadMinutes: number;
  etaDefaultSpeedKph: number;
};

export type TransportRouteStop = {
  id: string;
  routeId: string;
  routeName: string;
  name: string;
  sequenceNo: number;
  latitude: number;
  longitude: number;
  geofenceRadiusM: number;
  plannedOffsetMinutes: number;
};

export type TransportJourneyInsight = {
  vehicleId: string;
  routeId: string;
  serviceDate: string;
  tripStartedAt: string;
  nextStop: TransportRouteStop | null;
  lastStop: TransportRouteStop | null;
  distanceToNextM: number | null;
  etaMinutes: number | null;
  predictedArrivalAt: string | null;
  delayMinutes: number | null;
  status: 'ON_TIME' | 'DELAYED' | 'AT_STOP' | 'COMPLETED' | 'NO_STOPS';
  updatedAt: string;
};

export type TransportPhase2LiveData = {
  generatedAt: string;
  enabled: boolean;
  settings: TransportPhase2Settings;
  journeys: TransportJourneyInsight[];
};

export type TransportPhase2AdminData = TransportPhase2LiveData & {
  routes: Array<{
    id: string;
    routeName: string;
    stops: TransportRouteStop[];
  }>;
  metrics: {
    configuredRoutes: number;
    configuredStops: number;
    activeJourneys: number;
    delayedJourneys: number;
  };
};
