-- CampusOS optional institution transport / GPS module.
--
-- This module intentionally lives outside Prisma's managed public schema so an
-- institution can opt into live transport without changing core academic
-- models. Public academic identity stays source-of-truth through foreign keys.

CREATE SCHEMA IF NOT EXISTS campusos_transport;

CREATE TABLE IF NOT EXISTS campusos_transport.settings (
  tenant_id uuid PRIMARY KEY REFERENCES public.institutions(id) ON DELETE CASCADE,
  enabled boolean NOT NULL DEFAULT false,
  gps_tracking_enabled boolean NOT NULL DEFAULT true,
  allow_hybrid_students boolean NOT NULL DEFAULT true,
  telemetry_stale_seconds integer NOT NULL DEFAULT 180,
  updated_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT transport_settings_stale_window
    CHECK (telemetry_stale_seconds BETWEEN 30 AND 3600)
);

ALTER TABLE campusos_transport.settings
  ADD COLUMN IF NOT EXISTS parent_eta_alerts_enabled boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS parent_email_alerts_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS eta_alert_lead_minutes integer NOT NULL DEFAULT 10,
  ADD COLUMN IF NOT EXISTS eta_default_speed_kph integer NOT NULL DEFAULT 25;

DO $$ BEGIN
  ALTER TABLE campusos_transport.settings
    ADD CONSTRAINT transport_settings_eta_lead
    CHECK (eta_alert_lead_minutes BETWEEN 2 AND 60);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE campusos_transport.settings
    ADD CONSTRAINT transport_settings_eta_speed
    CHECK (eta_default_speed_kph BETWEEN 5 AND 100);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS campusos_transport.student_profiles (
  student_id uuid PRIMARY KEY REFERENCES public.students(id) ON DELETE CASCADE,
  tenant_id uuid NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
  study_mode text NOT NULL DEFAULT 'OFFLINE',
  transport_opt_in boolean NOT NULL DEFAULT true,
  updated_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT transport_student_mode
    CHECK (study_mode IN ('ONLINE', 'OFFLINE', 'HYBRID'))
);

CREATE INDEX IF NOT EXISTS transport_student_profiles_tenant_idx
  ON campusos_transport.student_profiles (tenant_id, study_mode);

CREATE TABLE IF NOT EXISTS campusos_transport.vehicles (
  id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
  route_id uuid REFERENCES public.transport_routes(id) ON DELETE SET NULL,
  label text NOT NULL,
  registration_number text NOT NULL,
  driver_name text,
  driver_phone text,
  device_token_hash text NOT NULL UNIQUE,
  status text NOT NULL DEFAULT 'ACTIVE',
  is_active boolean NOT NULL DEFAULT true,
  last_seen_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT transport_vehicle_status
    CHECK (status IN ('ACTIVE', 'MAINTENANCE', 'INACTIVE')),
  CONSTRAINT transport_vehicle_registration_nonempty
    CHECK (length(trim(registration_number)) > 0)
);

CREATE UNIQUE INDEX IF NOT EXISTS transport_vehicle_registration_tenant_idx
  ON campusos_transport.vehicles (tenant_id, upper(registration_number));
CREATE INDEX IF NOT EXISTS transport_vehicle_route_idx
  ON campusos_transport.vehicles (tenant_id, route_id);

CREATE TABLE IF NOT EXISTS campusos_transport.student_assignments (
  id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
  student_id uuid NOT NULL UNIQUE REFERENCES public.students(id) ON DELETE CASCADE,
  route_id uuid NOT NULL REFERENCES public.transport_routes(id) ON DELETE CASCADE,
  vehicle_id uuid REFERENCES campusos_transport.vehicles(id) ON DELETE SET NULL,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS transport_assignments_tenant_route_idx
  ON campusos_transport.student_assignments (tenant_id, route_id, active);
CREATE INDEX IF NOT EXISTS transport_assignments_vehicle_idx
  ON campusos_transport.student_assignments (vehicle_id, active);

CREATE TABLE IF NOT EXISTS campusos_transport.gps_positions (
  id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
  vehicle_id uuid NOT NULL REFERENCES campusos_transport.vehicles(id) ON DELETE CASCADE,
  latitude double precision NOT NULL,
  longitude double precision NOT NULL,
  speed_kph double precision,
  heading_degrees double precision,
  accuracy_meters double precision,
  recorded_at timestamptz NOT NULL,
  received_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT transport_gps_latitude CHECK (latitude BETWEEN -90 AND 90),
  CONSTRAINT transport_gps_longitude CHECK (longitude BETWEEN -180 AND 180),
  CONSTRAINT transport_gps_speed CHECK (speed_kph IS NULL OR speed_kph BETWEEN 0 AND 250),
  CONSTRAINT transport_gps_heading CHECK (heading_degrees IS NULL OR heading_degrees BETWEEN 0 AND 360),
  CONSTRAINT transport_gps_accuracy CHECK (accuracy_meters IS NULL OR accuracy_meters BETWEEN 0 AND 10000)
);

CREATE INDEX IF NOT EXISTS transport_gps_vehicle_recorded_idx
  ON campusos_transport.gps_positions (vehicle_id, recorded_at DESC);
CREATE INDEX IF NOT EXISTS transport_gps_tenant_recorded_idx
  ON campusos_transport.gps_positions (tenant_id, recorded_at DESC);

-- Phase 2: ordered route stops, ETA state, geofence events and deduplicated parent alerts.
CREATE TABLE IF NOT EXISTS campusos_transport.route_stops (
  id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
  route_id uuid NOT NULL REFERENCES public.transport_routes(id) ON DELETE CASCADE,
  name text NOT NULL,
  sequence_no integer NOT NULL,
  latitude double precision NOT NULL,
  longitude double precision NOT NULL,
  geofence_radius_m integer NOT NULL DEFAULT 120,
  planned_offset_minutes integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT transport_stop_sequence CHECK (sequence_no BETWEEN 1 AND 500),
  CONSTRAINT transport_stop_latitude CHECK (latitude BETWEEN -90 AND 90),
  CONSTRAINT transport_stop_longitude CHECK (longitude BETWEEN -180 AND 180),
  CONSTRAINT transport_stop_geofence CHECK (geofence_radius_m BETWEEN 25 AND 2000),
  CONSTRAINT transport_stop_offset CHECK (planned_offset_minutes BETWEEN 0 AND 1440)
);

CREATE UNIQUE INDEX IF NOT EXISTS transport_route_stops_sequence_idx
  ON campusos_transport.route_stops (tenant_id, route_id, sequence_no)
  WHERE is_active = true;
CREATE INDEX IF NOT EXISTS transport_route_stops_route_idx
  ON campusos_transport.route_stops (tenant_id, route_id, sequence_no);

CREATE TABLE IF NOT EXISTS campusos_transport.vehicle_trip_state (
  vehicle_id uuid PRIMARY KEY REFERENCES campusos_transport.vehicles(id) ON DELETE CASCADE,
  tenant_id uuid NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
  route_id uuid NOT NULL REFERENCES public.transport_routes(id) ON DELETE CASCADE,
  service_date date NOT NULL,
  trip_started_at timestamptz NOT NULL,
  next_stop_id uuid REFERENCES campusos_transport.route_stops(id) ON DELETE SET NULL,
  last_stop_id uuid REFERENCES campusos_transport.route_stops(id) ON DELETE SET NULL,
  distance_to_next_m integer,
  eta_minutes integer,
  predicted_arrival_at timestamptz,
  delay_minutes integer,
  journey_status text NOT NULL DEFAULT 'ON_TIME',
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT transport_journey_status
    CHECK (journey_status IN ('ON_TIME', 'DELAYED', 'AT_STOP', 'COMPLETED', 'NO_STOPS'))
);

CREATE INDEX IF NOT EXISTS transport_trip_state_tenant_idx
  ON campusos_transport.vehicle_trip_state (tenant_id, service_date, updated_at DESC);

CREATE TABLE IF NOT EXISTS campusos_transport.stop_events (
  id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
  vehicle_id uuid NOT NULL REFERENCES campusos_transport.vehicles(id) ON DELETE CASCADE,
  route_id uuid NOT NULL REFERENCES public.transport_routes(id) ON DELETE CASCADE,
  stop_id uuid NOT NULL REFERENCES campusos_transport.route_stops(id) ON DELETE CASCADE,
  service_date date NOT NULL,
  event_type text NOT NULL,
  distance_m integer,
  occurred_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT transport_stop_event_type CHECK (event_type IN ('ARRIVED'))
);

CREATE UNIQUE INDEX IF NOT EXISTS transport_stop_event_once_idx
  ON campusos_transport.stop_events (vehicle_id, stop_id, service_date, event_type);
CREATE INDEX IF NOT EXISTS transport_stop_events_tenant_idx
  ON campusos_transport.stop_events (tenant_id, service_date, occurred_at DESC);

CREATE TABLE IF NOT EXISTS campusos_transport.parent_alert_events (
  id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
  guardian_user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  vehicle_id uuid NOT NULL REFERENCES campusos_transport.vehicles(id) ON DELETE CASCADE,
  stop_id uuid NOT NULL REFERENCES campusos_transport.route_stops(id) ON DELETE CASCADE,
  service_date date NOT NULL,
  alert_kind text NOT NULL,
  eta_minutes integer,
  sent_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT transport_parent_alert_kind CHECK (alert_kind IN ('ETA_NEAR_STOP', 'STOP_ARRIVAL'))
);

CREATE UNIQUE INDEX IF NOT EXISTS transport_parent_alert_once_idx
  ON campusos_transport.parent_alert_events
    (guardian_user_id, vehicle_id, stop_id, service_date, alert_kind);
CREATE INDEX IF NOT EXISTS transport_parent_alert_tenant_idx
  ON campusos_transport.parent_alert_events (tenant_id, sent_at DESC);
