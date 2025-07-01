-- Create app_configurations table for storing application settings
CREATE TABLE IF NOT EXISTS app_configurations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    account_instance_id UUID NOT NULL REFERENCES account_instances(id) ON DELETE CASCADE,
    currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    religion_enabled BOOLEAN NOT NULL DEFAULT false,
    floorplan_enabled BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(account_instance_id)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_app_configurations_account_instance_id 
ON app_configurations(account_instance_id);

-- Add RLS policies
ALTER TABLE app_configurations ENABLE ROW LEVEL SECURITY;

-- Policy to allow users to read their own configurations
CREATE POLICY "Users can read their own configurations" ON app_configurations
    FOR SELECT USING (
        account_instance_id IN (
            SELECT id FROM account_instances 
            WHERE name = auth.jwt() ->> 'email'
        )
    );

-- Policy to allow users to insert their own configurations
CREATE POLICY "Users can insert their own configurations" ON app_configurations
    FOR INSERT WITH CHECK (
        account_instance_id IN (
            SELECT id FROM account_instances 
            WHERE name = auth.jwt() ->> 'email'
        )
    );

-- Policy to allow users to update their own configurations
CREATE POLICY "Users can update their own configurations" ON app_configurations
    FOR UPDATE USING (
        account_instance_id IN (
            SELECT id FROM account_instances 
            WHERE name = auth.jwt() ->> 'email'
        )
    );

-- Policy to allow users to delete their own configurations
CREATE POLICY "Users can delete their own configurations" ON app_configurations
    FOR DELETE USING (
        account_instance_id IN (
            SELECT id FROM account_instances 
            WHERE name = auth.jwt() ->> 'email'
        )
    );
