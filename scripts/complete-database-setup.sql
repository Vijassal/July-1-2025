-- Complete Database Setup for Modernized Events App
-- This script sets up all necessary tables, RLS policies, and indexes

-- Enable RLS on all tables
ALTER TABLE account_instances ENABLE ROW LEVEL SECURITY;
ALTER TABLE professional_account_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_type_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE account_creation_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE website_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE website_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE website_components ENABLE ROW LEVEL SECURITY;
ALTER TABLE participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE additional_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can read their own configurations" ON app_configurations;
DROP POLICY IF EXISTS "Users can insert their own configurations" ON app_configurations;
DROP POLICY IF EXISTS "Users can update their own configurations" ON app_configurations;
DROP POLICY IF EXISTS "Users can delete their own configurations" ON app_configurations;

DROP POLICY IF EXISTS "Users can manage their own website configurations" ON website_configurations;
DROP POLICY IF EXISTS "Users can manage their own website pages" ON website_pages;
DROP POLICY IF EXISTS "Users can manage their own website components" ON website_components;

DROP POLICY IF EXISTS "Users can manage their own events" ON events;
DROP POLICY IF EXISTS "Users can manage their own participants" ON participants;
DROP POLICY IF EXISTS "Users can manage their own additional participants" ON additional_participants;

DROP POLICY IF EXISTS "Users can manage their own vendor profiles" ON vendor_profiles;

-- Account Instances Policies
CREATE POLICY "Users can access their own account instances" ON account_instances
  FOR ALL USING (owner_user_id = auth.uid());

CREATE POLICY "Professionals can access granted accounts" ON account_instances
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM professional_account_access 
      WHERE professional_id = auth.uid() 
      AND account_instance_id = account_instances.id 
      AND is_active = true
    )
  );

-- Professional Account Access Policies
CREATE POLICY "Professionals can manage their own access" ON professional_account_access
  FOR ALL USING (professional_id = auth.uid());

CREATE POLICY "Account owners can manage professional access" ON professional_account_access
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM account_instances 
      WHERE id = professional_account_access.account_instance_id 
      AND owner_user_id = auth.uid()
    )
  );

-- User Type Registrations Policies
CREATE POLICY "Users can manage their own type registrations" ON user_type_registrations
  FOR ALL USING (user_id = auth.uid());

-- Account Creation Requests Policies
CREATE POLICY "Professionals can manage their own requests" ON account_creation_requests
  FOR ALL USING (professional_id = auth.uid());

CREATE POLICY "Users can view requests for their email" ON account_creation_requests
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE email = account_creation_requests.client_email 
      AND id = auth.uid()
    )
  );

-- Events Policies
CREATE POLICY "Users can manage events in their accounts" ON events
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM account_instances 
      WHERE id = events.account_instance_id 
      AND owner_user_id = auth.uid()
    )
  );

CREATE POLICY "Professionals can manage events in accessible accounts" ON events
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM professional_account_access 
      WHERE professional_id = auth.uid() 
      AND account_instance_id = events.account_instance_id 
      AND is_active = true
    )
  );

-- App Configurations Policies
CREATE POLICY "Users can manage configurations in their accounts" ON app_configurations
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM account_instances 
      WHERE id = app_configurations.account_instance_id 
      AND owner_user_id = auth.uid()
    )
  );

CREATE POLICY "Professionals can manage configurations in accessible accounts" ON app_configurations
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM professional_account_access 
      WHERE professional_id = auth.uid() 
      AND account_instance_id = app_configurations.account_instance_id 
      AND is_active = true
    )
  );

-- Website Configurations Policies
CREATE POLICY "Users can manage website configurations in their accounts" ON website_configurations
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM account_instances 
      WHERE id = website_configurations.account_instance_id 
      AND owner_user_id = auth.uid()
    )
  );

CREATE POLICY "Professionals can manage website configurations in accessible accounts" ON website_configurations
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM professional_account_access 
      WHERE professional_id = auth.uid() 
      AND account_instance_id = website_configurations.account_instance_id 
      AND is_active = true
    )
  );

-- Website Pages Policies
CREATE POLICY "Users can manage website pages in their accounts" ON website_pages
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM account_instances 
      WHERE id = website_pages.account_instance_id 
      AND owner_user_id = auth.uid()
    )
  );

CREATE POLICY "Professionals can manage website pages in accessible accounts" ON website_pages
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM professional_account_access 
      WHERE professional_id = auth.uid() 
      AND account_instance_id = website_pages.account_instance_id 
      AND is_active = true
    )
  );

-- Website Components Policies
CREATE POLICY "Users can manage website components in their accounts" ON website_components
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM account_instances 
      WHERE id = website_components.account_instance_id 
      AND owner_user_id = auth.uid()
    )
  );

CREATE POLICY "Professionals can manage website components in accessible accounts" ON website_components
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM professional_account_access 
      WHERE professional_id = auth.uid() 
      AND account_instance_id = website_components.account_instance_id 
      AND is_active = true
    )
  );

-- Participants Policies
CREATE POLICY "Users can manage participants in their accounts" ON participants
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM account_instances 
      WHERE id = participants.account_instance_id 
      AND owner_user_id = auth.uid()
    )
  );

CREATE POLICY "Professionals can manage participants in accessible accounts" ON participants
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM professional_account_access 
      WHERE professional_id = auth.uid() 
      AND account_instance_id = participants.account_instance_id 
      AND is_active = true
    )
  );

-- Additional Participants Policies
CREATE POLICY "Users can manage additional participants in their accounts" ON additional_participants
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM account_instances 
      WHERE id = additional_participants.account_instance_id 
      AND owner_user_id = auth.uid()
    )
  );

CREATE POLICY "Professionals can manage additional participants in accessible accounts" ON additional_participants
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM professional_account_access 
      WHERE professional_id = auth.uid() 
      AND account_instance_id = additional_participants.account_instance_id 
      AND is_active = true
    )
  );

-- Vendor Profiles Policies
CREATE POLICY "Users can manage their own vendor profiles" ON vendor_profiles
  FOR ALL USING (user_id = auth.uid());

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_account_instances_owner_user_id ON account_instances(owner_user_id);
CREATE INDEX IF NOT EXISTS idx_professional_access_professional_id ON professional_account_access(professional_id);
CREATE INDEX IF NOT EXISTS idx_professional_access_account_id ON professional_account_access(account_instance_id);
CREATE INDEX IF NOT EXISTS idx_professional_access_active ON professional_account_access(is_active);
CREATE INDEX IF NOT EXISTS idx_events_account_instance_id ON events(account_instance_id);
CREATE INDEX IF NOT EXISTS idx_app_config_account_instance_id ON app_configurations(account_instance_id);
CREATE INDEX IF NOT EXISTS idx_website_config_account_instance_id ON website_configurations(account_instance_id);
CREATE INDEX IF NOT EXISTS idx_website_pages_account_instance_id ON website_pages(account_instance_id);
CREATE INDEX IF NOT EXISTS idx_website_components_account_instance_id ON website_components(account_instance_id);
CREATE INDEX IF NOT EXISTS idx_participants_account_instance_id ON participants(account_instance_id);
CREATE INDEX IF NOT EXISTS idx_additional_participants_account_instance_id ON additional_participants(account_instance_id);
CREATE INDEX IF NOT EXISTS idx_additional_participants_main_id ON additional_participants(main_participant_id);
CREATE INDEX IF NOT EXISTS idx_vendor_profiles_user_id ON vendor_profiles(user_id);

-- Create function to automatically create account instance for new users
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Create account instance for new user
  INSERT INTO account_instances (name, owner_user_id, currency)
  VALUES (NEW.email, NEW.id, 'USD');
  
  -- Register user as regular type
  INSERT INTO user_type_registrations (user_id, user_type, is_active)
  VALUES (NEW.id, 'regular', true);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user registration
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated; 