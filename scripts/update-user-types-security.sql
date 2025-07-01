-- Create user type registrations table
CREATE TABLE IF NOT EXISTS user_type_registrations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_type TEXT NOT NULL CHECK (user_type IN ('regular', 'professional', 'vendor')),
  is_active BOOLEAN DEFAULT true,
  registered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB DEFAULT '{}',
  UNIQUE(user_id, user_type)
);

-- Create account creation requests table
CREATE TABLE IF NOT EXISTS account_creation_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  professional_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_email TEXT NOT NULL,
  client_name TEXT,
  account_name TEXT NOT NULL,
  message TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'expired')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '7 days')
);

-- Create professional account access table (updated)
CREATE TABLE IF NOT EXISTS professional_account_access (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  professional_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  account_instance_id UUID NOT NULL,
  access_level TEXT DEFAULT 'full' CHECK (access_level IN ('full', 'limited')),
  granted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  granted_by UUID REFERENCES auth.users(id),
  is_active BOOLEAN DEFAULT true,
  UNIQUE(professional_id, account_instance_id)
);

-- Add owner_id column to account_instances if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'account_instances' AND column_name = 'owner_id'
  ) THEN
    ALTER TABLE account_instances ADD COLUMN owner_id UUID REFERENCES auth.users(id);
    
    -- Update existing records to link them to users (you may need to adjust this logic)
    -- This is a basic example - you might want to do this manually based on your data
    UPDATE account_instances 
    SET owner_id = (
      SELECT id FROM auth.users 
      WHERE email = 'your-admin-email@example.com' -- Replace with actual admin email
      LIMIT 1
    )
    WHERE owner_id IS NULL;
  END IF;
END $$;

-- Enable RLS on new tables
ALTER TABLE user_type_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE account_creation_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE professional_account_access ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_type_registrations
CREATE POLICY "Users can view their own registrations" ON user_type_registrations
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own registrations" ON user_type_registrations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own registrations" ON user_type_registrations
  FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for account_creation_requests
CREATE POLICY "Professionals can view their own requests" ON account_creation_requests
  FOR SELECT USING (auth.uid() = professional_id);

CREATE POLICY "Professionals can insert their own requests" ON account_creation_requests
  FOR INSERT WITH CHECK (auth.uid() = professional_id);

CREATE POLICY "Professionals can update their own requests" ON account_creation_requests
  FOR UPDATE USING (auth.uid() = professional_id);

-- RLS Policies for professional_account_access
CREATE POLICY "Professionals can view their own access" ON professional_account_access
  FOR SELECT USING (auth.uid() = professional_id);

CREATE POLICY "Account owners can view access to their accounts" ON professional_account_access
  FOR SELECT USING (
    auth.uid() IN (
      SELECT owner_id FROM account_instances 
      WHERE id = account_instance_id
    )
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_type_registrations_user_id ON user_type_registrations(user_id);
CREATE INDEX IF NOT EXISTS idx_user_type_registrations_user_type ON user_type_registrations(user_type);
CREATE INDEX IF NOT EXISTS idx_account_creation_requests_professional_id ON account_creation_requests(professional_id);
CREATE INDEX IF NOT EXISTS idx_account_creation_requests_status ON account_creation_requests(status);
CREATE INDEX IF NOT EXISTS idx_professional_account_access_professional_id ON professional_account_access(professional_id);
CREATE INDEX IF NOT EXISTS idx_professional_account_access_account_id ON professional_account_access(account_instance_id);

-- Insert default registration for existing users (optional)
-- This gives existing users regular access by default
INSERT INTO user_type_registrations (user_id, user_type)
SELECT id, 'regular' 
FROM auth.users 
WHERE id NOT IN (SELECT user_id FROM user_type_registrations WHERE user_type = 'regular')
ON CONFLICT (user_id, user_type) DO NOTHING;
