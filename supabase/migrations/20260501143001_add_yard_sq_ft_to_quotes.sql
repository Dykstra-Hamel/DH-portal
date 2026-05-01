-- Add yard_sq_ft column to quotes table
-- Stores the numeric sq ft of the yard from map measurements, so all
-- contexts (public quote page, LeadQuoteBuilder) can use it for accurate pricing.
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS yard_sq_ft INTEGER;
