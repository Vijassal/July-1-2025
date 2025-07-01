-- Query to check all user type registrations for a specific user
-- Replace 'USER_ID_HERE' with actual user ID
SELECT 
  id,
  user_type,
  is_active,
  registered_at,
  metadata
FROM user_type_registrations 
WHERE user_id = 'USER_ID_HERE'
ORDER BY registered_at DESC;

-- Query to get all active user types for a user
SELECT user_type 
FROM user_type_registrations 
WHERE user_id = 'USER_ID_HERE' AND is_active = true;

-- Query to check if a user has a specific user type
SELECT EXISTS(
  SELECT 1 FROM user_type_registrations 
  WHERE user_id = 'USER_ID_HERE' 
  AND user_type = 'professional' 
  AND is_active = true
) as has_professional_access;

-- Query to deactivate a user type (soft delete)
UPDATE user_type_registrations 
SET is_active = false 
WHERE user_id = 'USER_ID_HERE' AND user_type = 'professional';

-- Query to reactivate a user type
UPDATE user_type_registrations 
SET is_active = true 
WHERE user_id = 'USER_ID_HERE' AND user_type = 'professional';

-- Query to get user statistics by type
SELECT 
  user_type,
  COUNT(*) as total_users,
  COUNT(CASE WHEN is_active THEN 1 END) as active_users
FROM user_type_registrations 
GROUP BY user_type;
