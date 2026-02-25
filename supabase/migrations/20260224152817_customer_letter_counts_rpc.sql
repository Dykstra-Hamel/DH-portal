-- Replace JS-side letter counting (limited by PostgREST max-rows) with a
-- server-side COUNT aggregate that is accurate regardless of company size.
CREATE OR REPLACE FUNCTION get_customer_letter_counts(p_company_id uuid DEFAULT NULL)
RETURNS TABLE(letter text, count bigint)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT
    UPPER(LEFT(last_name, 1)) AS letter,
    COUNT(*)::bigint           AS count
  FROM customers
  WHERE
    (p_company_id IS NULL OR company_id = p_company_id)
    AND last_name IS NOT NULL
    AND last_name <> ''
  GROUP BY UPPER(LEFT(last_name, 1));
$$;
