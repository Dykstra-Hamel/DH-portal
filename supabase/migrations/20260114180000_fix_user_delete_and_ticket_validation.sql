-- Fix user deletion issues: profiles cascade + activity tables nullable user_id

-- 1. Ensure profile rows are removed when the related auth user is deleted
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'profiles_id_fkey'
      AND connamespace = 'public'::regnamespace
  ) THEN
    ALTER TABLE public.profiles
      DROP CONSTRAINT profiles_id_fkey;
  END IF;
END$$;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_id_fkey
  FOREIGN KEY (id)
  REFERENCES auth.users(id)
  ON DELETE CASCADE;

-- 2. Fix NOT NULL + ON DELETE SET NULL contradiction in activity/history tables
-- These tables need to preserve records even when users are deleted, so user_id must be nullable
-- Use conditional logic to handle tables that may not exist yet

DO $$
BEGIN
  -- project_activity
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'project_activity') THEN
    ALTER TABLE project_activity ALTER COLUMN user_id DROP NOT NULL;
    COMMENT ON COLUMN project_activity.user_id IS 'User who performed the action. NULL if user was deleted.';
  END IF;

  -- project_task_activity
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'project_task_activity') THEN
    ALTER TABLE project_task_activity ALTER COLUMN user_id DROP NOT NULL;
    COMMENT ON COLUMN project_task_activity.user_id IS 'User who performed the action. NULL if user was deleted.';
  END IF;

  -- project_comments
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'project_comments') THEN
    ALTER TABLE project_comments ALTER COLUMN user_id DROP NOT NULL;
    COMMENT ON COLUMN project_comments.user_id IS 'User who created the comment. NULL if user was deleted.';
  END IF;

  -- project_tasks
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'project_tasks') THEN
    ALTER TABLE project_tasks ALTER COLUMN created_by DROP NOT NULL;
    COMMENT ON COLUMN project_tasks.created_by IS 'User who created the task. NULL if user was deleted.';
  END IF;

  -- project_task_comments
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'project_task_comments') THEN
    ALTER TABLE project_task_comments ALTER COLUMN user_id DROP NOT NULL;
    COMMENT ON COLUMN project_task_comments.user_id IS 'User who created the comment. NULL if user was deleted.';
  END IF;

  -- lead_activity (may not exist in all branches)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'lead_activity') THEN
    ALTER TABLE lead_activity ALTER COLUMN user_id DROP NOT NULL;
    COMMENT ON COLUMN lead_activity.user_id IS 'User who performed the action. NULL if user was deleted.';
  END IF;
END$$;

-- 3. Schema-qualify references in validate_ticket_conversion to avoid missing relation errors
CREATE OR REPLACE FUNCTION public.validate_ticket_conversion()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
BEGIN
    -- Existing lead conversion validation
    IF NEW.converted_to_lead_id IS NOT NULL THEN
        -- Verify the referenced lead exists and has the correct ticket reference
        IF NOT EXISTS (
            SELECT 1 FROM public.leads
            WHERE id = NEW.converted_to_lead_id
              AND converted_from_ticket_id = NEW.id
        ) THEN
            RAISE EXCEPTION 'Invalid lead conversion: lead must exist and reference this ticket';
        END IF;
    END IF;

    -- Support case conversion validation
    IF NEW.converted_to_support_case_id IS NOT NULL THEN
        -- Verify the referenced support case exists and has the correct ticket reference
        IF NOT EXISTS (
            SELECT 1 FROM public.support_cases
            WHERE id = NEW.converted_to_support_case_id
              AND ticket_id = NEW.id
        ) THEN
            RAISE EXCEPTION 'Invalid support case conversion: support case must exist and reference this ticket';
        END IF;
    END IF;

    -- If converted_at is set, ensure either converted_to_lead_id or converted_to_support_case_id is also set
    IF NEW.converted_at IS NOT NULL
       AND NEW.converted_to_lead_id IS NULL
       AND NEW.converted_to_support_case_id IS NULL THEN
        RAISE EXCEPTION 'converted_at requires either converted_to_lead_id or converted_to_support_case_id to be set';
    END IF;

    RETURN NEW;
END;
$function$;
