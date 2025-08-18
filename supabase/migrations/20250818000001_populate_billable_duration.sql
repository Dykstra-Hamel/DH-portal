-- Ensure all call records have billable_duration_seconds calculated
-- This handles cases where records were added after the column was created but before the calculation logic

UPDATE call_records 
SET billable_duration_seconds = CASE 
    WHEN duration_seconds IS NULL OR duration_seconds <= 0 THEN 30
    ELSE CEILING(duration_seconds::FLOAT / 30.0) * 30
END
WHERE billable_duration_seconds IS NULL;