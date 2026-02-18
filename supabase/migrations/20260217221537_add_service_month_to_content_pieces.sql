-- Add service_month to monthly_service_content_pieces
-- Stores the YYYY-MM month this content piece belongs to within a service cycle.
-- Enables the content calendar to correctly bucket pieces that have no publish_date
-- or task due_date (e.g. pieces created manually from the calendar before a task is generated).

ALTER TABLE monthly_service_content_pieces
ADD COLUMN IF NOT EXISTS service_month TEXT
    CHECK (service_month ~ '^\d{4}-(0[1-9]|1[0-2])$');

CREATE INDEX IF NOT EXISTS idx_ms_content_pieces_service_month
    ON monthly_service_content_pieces(service_month);

COMMENT ON COLUMN monthly_service_content_pieces.service_month IS 'The YYYY-MM month this content piece belongs to within its monthly service cycle';
