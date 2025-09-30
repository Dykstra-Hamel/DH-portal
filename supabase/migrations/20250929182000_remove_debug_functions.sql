-- Remove debug and test functions created during development
-- These are not needed for production

-- Remove test broadcast functions
DROP FUNCTION IF EXISTS test_broadcast_message(UUID);
DROP FUNCTION IF EXISTS check_recent_broadcasts(UUID);

-- Clean up any test notifications created during development
DELETE FROM notifications 
WHERE title = 'Test Notification' 
   OR message LIKE '%Testing%broadcast%'
   OR message LIKE '%test%';