-- Add trip_plan_enabled field to existing app_configurations table
ALTER TABLE app_configurations 
ADD COLUMN IF NOT EXISTS trip_plan_enabled BOOLEAN NOT NULL DEFAULT false;

-- Update existing records to have trip_plan_enabled set to false by default
UPDATE app_configurations 
SET trip_plan_enabled = false 
WHERE trip_plan_enabled IS NULL; 