-- Allow admin and project_manager roles to read all profiles.
-- Required for mention-list avatars, user assignment dropdowns, etc.
-- Uses SECURITY DEFINER to avoid infinite RLS recursion on the profiles table.

CREATE OR REPLACE FUNCTION public.is_admin_or_pm()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  RETURN (
    SELECT role IN ('admin', 'project_manager')
    FROM public.profiles
    WHERE id = auth.uid()
  );
END;
$$;

-- Drop and recreate the profiles SELECT policy with the role bypass
DROP POLICY IF EXISTS "profiles_company_access" ON public.profiles;

CREATE POLICY "profiles_company_access" ON public.profiles
    FOR SELECT
    TO authenticated
    USING (
        -- Own profile
        auth.uid() = id
        OR
        -- Admin / PM can see all profiles (mention lists, user management, avatars)
        public.is_admin_or_pm()
        OR
        -- All other authenticated users see only same-company profiles
        public.user_shares_company_with(id)
    );

COMMENT ON POLICY "profiles_company_access" ON public.profiles IS
'Users see their own profile. Admins and project managers see all profiles. Others see only same-company profiles.';
