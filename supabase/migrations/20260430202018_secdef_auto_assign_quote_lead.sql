-- Make auto_assign_quote_lead run as SECURITY DEFINER so RLS on the lookup
-- tables (user_departments, zip_code_groups, user_branch_assignments) does
-- not block the trigger when the INSERT is performed by a low-privilege user
-- such as a technician submitting from TechRoutes.
--
-- Without this, technicians (who can only see their own user_departments row
-- per the RLS policy) cause the trigger's inspector-resolution join to come
-- back empty, leaving the lead unassigned even though admin-side queries
-- show a perfectly valid match.

ALTER FUNCTION auto_assign_quote_lead() SECURITY DEFINER;

-- Lock down the search_path to prevent function-hijacking via untrusted
-- schemas now that the function runs with elevated privileges.
ALTER FUNCTION auto_assign_quote_lead() SET search_path = public, pg_temp;
