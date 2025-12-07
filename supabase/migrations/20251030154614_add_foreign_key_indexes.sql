-- Migration: Add Foreign Key Indexes for Performance
-- Purpose: Add missing indexes on foreign key columns to improve JOIN performance
-- Impact: Should significantly improve call_records and tickets query performance (~8% of slow queries)

-- Indexes for call_records table
-- These foreign keys are used in LATERAL JOINs and should have indexes
CREATE INDEX IF NOT EXISTS idx_call_records_lead_id
  ON call_records(lead_id)
  WHERE lead_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_call_records_customer_id
  ON call_records(customer_id)
  WHERE customer_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_call_records_agent_id
  ON call_records(agent_id)
  WHERE agent_id IS NOT NULL;

-- Indexes for tickets table
-- These foreign keys are used in LATERAL JOINs and WHERE clauses
CREATE INDEX IF NOT EXISTS idx_tickets_customer_id
  ON tickets(customer_id)
  WHERE customer_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_tickets_service_address_id
  ON tickets(service_address_id)
  WHERE service_address_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_tickets_reviewed_by
  ON tickets(reviewed_by)
  WHERE reviewed_by IS NOT NULL;

-- Add comment for documentation
COMMENT ON INDEX idx_call_records_lead_id IS
  'Performance: Speeds up JOIN with leads table in call_records queries';

COMMENT ON INDEX idx_call_records_customer_id IS
  'Performance: Speeds up JOIN with customers table in call_records queries';

COMMENT ON INDEX idx_call_records_agent_id IS
  'Performance: Speeds up JOIN with agents table in call_records queries';

COMMENT ON INDEX idx_tickets_customer_id IS
  'Performance: Speeds up JOIN with customers table in tickets queries';

COMMENT ON INDEX idx_tickets_service_address_id IS
  'Performance: Speeds up JOIN with service_addresses table in tickets queries';

COMMENT ON INDEX idx_tickets_reviewed_by IS
  'Performance: Speeds up JOIN with profiles table for reviewed_by in tickets queries';
