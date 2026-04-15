-- =============================================================================
-- Routing & Scheduling Tables
-- Phase 1: Core Routing Foundation
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Table 1: routes
-- A route is a named, dated, assigned set of stops for one person.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS routes (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id                UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name                      VARCHAR(200),
  route_date                DATE NOT NULL,
  assigned_to               UUID REFERENCES auth.users(id),
  route_type                VARCHAR(50) NOT NULL DEFAULT 'technician',
  -- route_type: 'technician', 'sales', 'inspector'
  status                    VARCHAR(50) NOT NULL DEFAULT 'draft',
  -- status: 'draft', 'scheduled', 'in_progress', 'completed', 'cancelled'

  -- Start/end depot (optional)
  start_location_address    TEXT,
  start_location_lat        DECIMAL(10,8),
  start_location_lng        DECIMAL(11,8),
  end_location_address      TEXT,
  end_location_lat          DECIMAL(10,8),
  end_location_lng          DECIMAL(11,8),
  use_same_end_as_start     BOOLEAN DEFAULT TRUE,

  -- Metrics
  estimated_total_duration  INTEGER,
  estimated_total_distance  DECIMAL(10,2),
  actual_start_time         TIMESTAMPTZ,
  actual_end_time           TIMESTAMPTZ,
  optimization_applied      BOOLEAN DEFAULT FALSE,
  optimization_applied_at   TIMESTAMPTZ,

  notes                     TEXT,
  pestpac_route_id          VARCHAR(100),

  created_by                UUID REFERENCES auth.users(id),
  created_at                TIMESTAMPTZ DEFAULT NOW(),
  updated_at                TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_routes_company_date   ON routes(company_id, route_date);
CREATE INDEX idx_routes_assigned_to    ON routes(assigned_to);
CREATE INDEX idx_routes_status         ON routes(status);
CREATE INDEX idx_routes_pestpac        ON routes(pestpac_route_id) WHERE pestpac_route_id IS NOT NULL;

-- ---------------------------------------------------------------------------
-- Table 2: route_stops
-- Each stop on a route with ordering, scheduling, and completion tracking.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS route_stops (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  route_id                  UUID NOT NULL REFERENCES routes(id) ON DELETE CASCADE,
  company_id                UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  stop_order                INTEGER NOT NULL,

  -- Linked records
  service_address_id        UUID REFERENCES service_addresses(id),
  customer_id               UUID REFERENCES customers(id),
  lead_id                   UUID REFERENCES leads(id),

  -- Service details
  service_type              VARCHAR(100),
  service_description       TEXT,
  estimated_duration        INTEGER,
  line_items                JSONB,

  -- Scheduling windows
  scheduled_arrival         TIMESTAMPTZ,
  scheduled_departure       TIMESTAMPTZ,
  actual_arrival            TIMESTAMPTZ,
  actual_departure          TIMESTAMPTZ,

  -- Status
  status                    VARCHAR(50) NOT NULL DEFAULT 'pending',
  -- status: 'pending', 'en_route', 'arrived', 'in_progress', 'completed', 'skipped', 'rescheduled'
  skip_reason               TEXT,
  reschedule_date           DATE,

  -- Notes
  notes                     TEXT,
  access_instructions       TEXT,
  technician_notes          TEXT,

  -- Geo (denormalized for performance)
  lat                       DECIMAL(10,8),
  lng                       DECIMAL(11,8),
  address_display           TEXT,

  -- PestPac sync keys
  pestpac_stop_id           VARCHAR(100),
  pestpac_service_order_id  VARCHAR(100),

  created_at                TIMESTAMPTZ DEFAULT NOW(),
  updated_at                TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(route_id, stop_order)
);

CREATE INDEX idx_route_stops_route_id        ON route_stops(route_id);
CREATE INDEX idx_route_stops_customer        ON route_stops(customer_id);
CREATE INDEX idx_route_stops_service_address ON route_stops(service_address_id);
CREATE INDEX idx_route_stops_lead            ON route_stops(lead_id);
CREATE INDEX idx_route_stops_status          ON route_stops(status);
CREATE INDEX idx_route_stops_pestpac         ON route_stops(pestpac_stop_id) WHERE pestpac_stop_id IS NOT NULL;

-- ---------------------------------------------------------------------------
-- Table 3: recurring_schedules
-- Source of truth for auto-generating future route stops.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS recurring_schedules (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id                UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  customer_id               UUID REFERENCES customers(id),
  service_address_id        UUID REFERENCES service_addresses(id),
  lead_id                   UUID REFERENCES leads(id),

  service_type              VARCHAR(100) NOT NULL,
  service_description       TEXT,
  estimated_duration        INTEGER DEFAULT 30,

  -- Assignment
  assigned_tech_id          UUID REFERENCES auth.users(id),

  -- Cadence
  frequency                 VARCHAR(50) NOT NULL,
  -- frequency: 'one_time','weekly','biweekly','monthly','quarterly','semi_annual','annual'
  interval_weeks            INTEGER,
  preferred_days            INTEGER[],
  preferred_time_window     VARCHAR(50) DEFAULT 'anytime',
  preferred_time_start      TIME,
  preferred_time_end        TIME,

  -- Date tracking
  start_date                DATE NOT NULL,
  next_service_date         DATE,
  last_service_date         DATE,
  end_date                  DATE,

  -- Status
  status                    VARCHAR(50) NOT NULL DEFAULT 'active',
  -- status: 'active', 'paused', 'completed', 'cancelled'
  pause_reason              TEXT,
  cancellation_reason       TEXT,

  notes                     TEXT,
  access_instructions       TEXT,

  -- PestPac sync
  pestpac_service_setup_id  VARCHAR(100),

  created_at                TIMESTAMPTZ DEFAULT NOW(),
  updated_at                TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_recurring_company        ON recurring_schedules(company_id);
CREATE INDEX idx_recurring_customer       ON recurring_schedules(customer_id);
CREATE INDEX idx_recurring_tech           ON recurring_schedules(assigned_tech_id);
CREATE INDEX idx_recurring_next_service   ON recurring_schedules(next_service_date);
CREATE INDEX idx_recurring_status         ON recurring_schedules(status);
CREATE INDEX idx_recurring_pestpac        ON recurring_schedules(pestpac_service_setup_id) WHERE pestpac_service_setup_id IS NOT NULL;

-- ---------------------------------------------------------------------------
-- Table 4: technician_schedules
-- Technician availability and time-off for the scheduling engine.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS technician_schedules (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id                UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  user_id                   UUID NOT NULL REFERENCES auth.users(id),

  schedule_type             VARCHAR(50) NOT NULL DEFAULT 'availability',
  -- schedule_type: 'availability', 'time_off', 'training', 'meeting'
  schedule_date             DATE NOT NULL,

  -- Hours (null = all day)
  start_time                TIME,
  end_time                  TIME,
  is_all_day                BOOLEAN DEFAULT FALSE,
  is_available              BOOLEAN NOT NULL DEFAULT TRUE,

  -- For recurring patterns
  is_default_pattern        BOOLEAN DEFAULT FALSE,
  day_of_week               INTEGER,

  reason                    TEXT,
  notes                     TEXT,

  created_at                TIMESTAMPTZ DEFAULT NOW(),
  updated_at                TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_tech_sched_company      ON technician_schedules(company_id);
CREATE INDEX idx_tech_sched_user         ON technician_schedules(user_id);
CREATE INDEX idx_tech_sched_date         ON technician_schedules(schedule_date);
CREATE INDEX idx_tech_sched_availability ON technician_schedules(user_id, schedule_date) WHERE is_available = TRUE;

-- ---------------------------------------------------------------------------
-- Table 5: route_optimization_jobs
-- Audit trail for route optimizations with before/after snapshots.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS route_optimization_jobs (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id                UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  route_id                  UUID NOT NULL REFERENCES routes(id) ON DELETE CASCADE,

  triggered_by              UUID REFERENCES auth.users(id),
  status                    VARCHAR(50) NOT NULL DEFAULT 'pending',
  -- status: 'pending', 'processing', 'completed', 'failed'

  -- Before/after state for undo capability
  stop_order_before         JSONB,
  stop_order_after          JSONB,

  estimated_duration_before INTEGER,
  estimated_duration_after  INTEGER,
  estimated_distance_before DECIMAL(10,2),
  estimated_distance_after  DECIMAL(10,2),

  api_provider              VARCHAR(50) DEFAULT 'google_routes',
  error_message             TEXT,

  created_at                TIMESTAMPTZ DEFAULT NOW(),
  updated_at                TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_opt_jobs_route    ON route_optimization_jobs(route_id);
CREATE INDEX idx_opt_jobs_company  ON route_optimization_jobs(company_id);

-- ---------------------------------------------------------------------------
-- RLS Policies
-- ---------------------------------------------------------------------------

-- routes
ALTER TABLE routes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Company members can view routes"
  ON routes FOR SELECT
  USING (
    company_id IN (
      SELECT company_id FROM user_companies WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Company admins and managers can insert routes"
  ON routes FOR INSERT
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM user_companies
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'manager')
    )
  );

CREATE POLICY "Company admins and managers can update routes"
  ON routes FOR UPDATE
  USING (
    company_id IN (
      SELECT company_id FROM user_companies
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'manager')
    )
  );

CREATE POLICY "Company admins and managers can delete routes"
  ON routes FOR DELETE
  USING (
    company_id IN (
      SELECT company_id FROM user_companies
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'manager')
    )
  );

-- route_stops
ALTER TABLE route_stops ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Company members can view route stops"
  ON route_stops FOR SELECT
  USING (
    company_id IN (
      SELECT company_id FROM user_companies WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Company admins and managers can insert route stops"
  ON route_stops FOR INSERT
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM user_companies
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'manager')
    )
  );

CREATE POLICY "Company admins and managers can update route stops"
  ON route_stops FOR UPDATE
  USING (
    company_id IN (
      SELECT company_id FROM user_companies
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'manager')
    )
  );

CREATE POLICY "Company admins and managers can delete route stops"
  ON route_stops FOR DELETE
  USING (
    company_id IN (
      SELECT company_id FROM user_companies
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'manager')
    )
  );

-- recurring_schedules
ALTER TABLE recurring_schedules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Company members can view recurring schedules"
  ON recurring_schedules FOR SELECT
  USING (
    company_id IN (
      SELECT company_id FROM user_companies WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Company admins and managers can manage recurring schedules"
  ON recurring_schedules FOR ALL
  USING (
    company_id IN (
      SELECT company_id FROM user_companies
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'manager')
    )
  );

-- technician_schedules
ALTER TABLE technician_schedules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Company members can view tech schedules"
  ON technician_schedules FOR SELECT
  USING (
    company_id IN (
      SELECT company_id FROM user_companies WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Company admins and managers can manage tech schedules"
  ON technician_schedules FOR ALL
  USING (
    company_id IN (
      SELECT company_id FROM user_companies
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'manager')
    )
  );

-- route_optimization_jobs
ALTER TABLE route_optimization_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Company members can view optimization jobs"
  ON route_optimization_jobs FOR SELECT
  USING (
    company_id IN (
      SELECT company_id FROM user_companies WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Company admins and managers can manage optimization jobs"
  ON route_optimization_jobs FOR ALL
  USING (
    company_id IN (
      SELECT company_id FROM user_companies
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'manager')
    )
  );

-- ---------------------------------------------------------------------------
-- updated_at triggers
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_routes_updated_at
  BEFORE UPDATE ON routes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_route_stops_updated_at
  BEFORE UPDATE ON route_stops
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_recurring_schedules_updated_at
  BEFORE UPDATE ON recurring_schedules
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_technician_schedules_updated_at
  BEFORE UPDATE ON technician_schedules
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_route_optimization_jobs_updated_at
  BEFORE UPDATE ON route_optimization_jobs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
