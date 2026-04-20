ALTER TABLE quotes DROP CONSTRAINT check_quote_status;

ALTER TABLE quotes
  ADD CONSTRAINT check_quote_status CHECK (
    quote_status IN ('draft', 'quoted', 'sent', 'accepted', 'declined', 'expired', 'completed')
  );
