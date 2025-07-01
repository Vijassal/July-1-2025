-- Add user_type column to existing users table (if using custom users table)
-- ALTER TABLE users ADD COLUMN user_type VARCHAR(20) DEFAULT 'regular' CHECK (user_type IN ('regular', 'professional', 'vendor'));

-- Create professional_account_access table for managing professional access to multiple accounts
CREATE TABLE IF NOT EXISTS professional_account_access (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    professional_id UUID NOT NULL,
    account_instance_id UUID NOT NULL REFERENCES account_instances(id) ON DELETE CASCADE,
    access_level VARCHAR(20) DEFAULT 'full' CHECK (access_level IN ('full', 'limited')),
    granted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    granted_by UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(professional_id, account_instance_id)
);

-- Create vendor_profiles table for vendor-specific information
CREATE TABLE IF NOT EXISTS vendor_profiles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL UNIQUE,
    business_name VARCHAR(255) NOT NULL,
    service_category VARCHAR(100) NOT NULL,
    description TEXT,
    contact_info JSONB DEFAULT '{}',
    availability JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_professional_account_access_professional_id ON professional_account_access(professional_id);
CREATE INDEX IF NOT EXISTS idx_professional_account_access_account_instance_id ON professional_account_access(account_instance_id);
CREATE INDEX IF NOT EXISTS idx_vendor_profiles_user_id ON vendor_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_vendor_profiles_service_category ON vendor_profiles(service_category);

-- Add RLS policies for professional_account_access
ALTER TABLE professional_account_access ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Professionals can view their own access" ON professional_account_access
    FOR SELECT USING (professional_id = auth.uid());

CREATE POLICY "Account owners can manage professional access" ON professional_account_access
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM account_instances 
            WHERE id = account_instance_id 
            AND owner_id = auth.uid()
        )
    );

-- Add RLS policies for vendor_profiles
ALTER TABLE vendor_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Vendors can manage their own profile" ON vendor_profiles
    FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Anyone can view vendor profiles" ON vendor_profiles
    FOR SELECT USING (true);
