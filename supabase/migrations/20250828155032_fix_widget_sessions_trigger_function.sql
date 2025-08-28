-- Fix update_widget_sessions_last_activity function to remove non-existent updated_at field
-- This function is triggered on widget_sessions table updates and was trying to set
-- an updated_at field that doesn't exist in the table schema

CREATE OR REPLACE FUNCTION public.update_widget_sessions_last_activity()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
    -- Only update the field that actually exists in widget_sessions table
    NEW.last_activity_at = NOW();
    RETURN NEW;
END;
$function$;