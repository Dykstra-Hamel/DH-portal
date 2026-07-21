ALTER TABLE public.tickets
  ADD COLUMN priority_order INTEGER GENERATED ALWAYS AS (
    CASE priority
      WHEN 'urgent' THEN 0
      WHEN 'high'   THEN 1
      WHEN 'medium' THEN 2
      WHEN 'low'    THEN 3
      ELSE 2
    END
  ) STORED;

CREATE INDEX idx_tickets_priority_order ON public.tickets (company_id, priority_order, created_at DESC);
