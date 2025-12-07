-- Fix cadence task creation to work on both INSERT and UPDATE
-- This ensures that when changing cadences via PUT (which uses upsert),
-- the first task is created correctly

-- Drop the existing trigger
DROP TRIGGER IF EXISTS trigger_create_first_task_on_cadence_assignment ON lead_cadence_assignments;

-- Recreate trigger to fire on both INSERT and UPDATE
CREATE TRIGGER trigger_create_first_task_on_cadence_assignment
    AFTER INSERT OR UPDATE ON lead_cadence_assignments
    FOR EACH ROW
    EXECUTE FUNCTION trigger_create_first_cadence_task();

COMMENT ON TRIGGER trigger_create_first_task_on_cadence_assignment ON lead_cadence_assignments IS 'Creates first cadence task on INSERT or UPDATE of cadence assignment';
