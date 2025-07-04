-- Add invited name fields to account_instance_users table
ALTER TABLE account_instance_users 
ADD COLUMN IF NOT EXISTS invited_first_name TEXT,
ADD COLUMN IF NOT EXISTS invited_last_name TEXT;

-- Add comment for documentation
COMMENT ON COLUMN account_instance_users.invited_first_name IS 'First name provided during invitation';
COMMENT ON COLUMN account_instance_users.invited_last_name IS 'Last name provided during invitation'; 