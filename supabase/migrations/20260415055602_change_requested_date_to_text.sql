ALTER TABLE leads ALTER COLUMN requested_date TYPE TEXT;

COMMENT ON COLUMN leads.requested_date IS
  'Preferred day of week for scheduling (monday–friday), or legacy date string from older submissions';
