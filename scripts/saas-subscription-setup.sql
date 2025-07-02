-- SaaS Subscription Setup for Modernized Events App
-- This script sets up subscription management, trial periods, and payment integration

-- ============================================================================
-- CLEANUP: Remove unused fields
-- ============================================================================

-- Drop any RLS policies that might reference the owner_id column
DROP POLICY IF EXISTS "Account owners can manage professional access" ON professional_account_access;
DROP POLICY IF EXISTS "Users can access their own account instances" ON account_instances;
DROP POLICY IF EXISTS "Professionals can access granted accounts" ON account_instances;

-- Remove unused owner_id field from account_instances (we use owner_user_id)
ALTER TABLE account_instances DROP COLUMN IF EXISTS owner_id;

-- ============================================================================
-- SUBSCRIPTION MANAGEMENT TABLES
-- ============================================================================

-- Subscription plans table
CREATE TABLE IF NOT EXISTS subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  user_type TEXT NOT NULL CHECK (user_type IN ('regular', 'professional', 'vendor')),
  price_monthly DECIMAL(10,2),
  price_yearly DECIMAL(10,2),
  features JSONB,
  max_events INTEGER,
  max_participants INTEGER,
  max_professional_accounts INTEGER, -- For professional users
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- User subscriptions table
CREATE TABLE IF NOT EXISTS user_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES subscription_plans(id),
  status TEXT NOT NULL CHECK (status IN ('trial', 'active', 'past_due', 'canceled', 'unpaid')),
  current_period_start TIMESTAMP WITH TIME ZONE,
  current_period_end TIMESTAMP WITH TIME ZONE,
  trial_start TIMESTAMP WITH TIME ZONE,
  trial_end TIMESTAMP WITH TIME ZONE,
  cancel_at_period_end BOOLEAN DEFAULT false,
  canceled_at TIMESTAMP WITH TIME ZONE,
  payment_provider TEXT, -- 'stripe', 'chargebee', etc.
  payment_provider_subscription_id TEXT,
  payment_provider_customer_id TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Subscription usage tracking
CREATE TABLE IF NOT EXISTS subscription_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  account_instance_id UUID NOT NULL REFERENCES account_instances(id) ON DELETE CASCADE,
  usage_type TEXT NOT NULL, -- 'events', 'participants', 'professional_accounts'
  usage_count INTEGER NOT NULL DEFAULT 0,
  usage_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, account_instance_id, usage_type, usage_date)
);

-- Payment webhooks for external payment providers
CREATE TABLE IF NOT EXISTS payment_webhooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider TEXT NOT NULL, -- 'stripe', 'chargebee'
  event_type TEXT NOT NULL,
  event_id TEXT NOT NULL,
  payload JSONB NOT NULL,
  processed BOOLEAN DEFAULT false,
  processed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(provider, event_id)
);

-- ============================================================================
-- UPDATE EXISTING TABLES
-- ============================================================================

-- Add subscription status to account_instances
ALTER TABLE account_instances 
ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'trial' CHECK (subscription_status IN ('trial', 'active', 'past_due', 'canceled', 'unpaid')),
ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS subscription_ends_at TIMESTAMP WITH TIME ZONE;

-- Add subscription limits to account_instances
ALTER TABLE account_instances 
ADD COLUMN IF NOT EXISTS max_events INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS max_participants INTEGER DEFAULT 50,
ADD COLUMN IF NOT EXISTS max_professional_accounts INTEGER DEFAULT 0;

-- Update user_type_registrations to include subscription info
ALTER TABLE user_type_registrations 
ADD COLUMN IF NOT EXISTS subscription_id UUID REFERENCES user_subscriptions(id),
ADD COLUMN IF NOT EXISTS requires_payment BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS payment_required_at TIMESTAMP WITH TIME ZONE;

-- Add is_active column to professional_account_access if it doesn't exist
ALTER TABLE professional_account_access 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- ============================================================================
-- DEFAULT SUBSCRIPTION PLANS
-- ============================================================================

-- Insert default subscription plans
INSERT INTO subscription_plans (name, description, user_type, price_monthly, price_yearly, features, max_events, max_participants, max_professional_accounts) VALUES
-- Regular User Plans
('Basic', 'Perfect for small events', 'regular', 9.99, 99.99, 
 '{"features": ["Event Planning", "Guest Management", "RSVP Tracking", "Basic Budget Tools", "Email Support"]}', 
 1, 50, 0),

('Standard', 'Great for medium events', 'regular', 19.99, 199.99, 
 '{"features": ["Event Planning", "Guest Management", "RSVP Tracking", "Advanced Budget Tools", "Website Builder", "Priority Support"]}', 
 3, 150, 0),

('Premium', 'For large events', 'regular', 39.99, 399.99, 
 '{"features": ["Event Planning", "Guest Management", "RSVP Tracking", "Advanced Budget Tools", "Website Builder", "Vendor Management", "Priority Support", "Phone Support"]}', 
 10, 500, 0),

-- Professional User Plans
('Professional Starter', 'For new event planners', 'professional', 49.99, 499.99, 
 '{"features": ["Multi-Account Access", "Client Management", "Professional Tools", "Email Support", "Basic Analytics"]}', 
 5, 1000, 5),

('Professional Growth', 'For growing businesses', 'professional', 99.99, 999.99, 
 '{"features": ["Multi-Account Access", "Client Management", "Professional Tools", "Priority Support", "Advanced Analytics", "White-label Options"]}', 
 15, 3000, 15),

('Professional Enterprise', 'For established businesses', 'professional', 199.99, 1999.99, 
 '{"features": ["Multi-Account Access", "Client Management", "Professional Tools", "Priority Support", "Advanced Analytics", "White-label Options", "API Access", "Dedicated Support"]}', 
 50, 10000, 50),

-- Vendor Plans (Free)
('Vendor Basic', 'Free vendor access', 'vendor', 0, 0, 
 '{"features": ["Profile Management", "Client Communication", "Booking Management"]}', 
 0, 0, 0)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- FUNCTIONS FOR SUBSCRIPTION MANAGEMENT
-- ============================================================================

-- Function to check if user has active subscription
CREATE OR REPLACE FUNCTION has_active_subscription(user_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
  subscription_status TEXT;
BEGIN
  SELECT us.status INTO subscription_status
  FROM user_subscriptions us
  WHERE us.user_id = user_uuid
  AND us.status IN ('active', 'trial')
  AND (us.current_period_end IS NULL OR us.current_period_end > now())
  AND (us.trial_end IS NULL OR us.trial_end > now())
  LIMIT 1;
  
  RETURN subscription_status IS NOT NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user's subscription plan
CREATE OR REPLACE FUNCTION get_user_subscription_plan(user_uuid UUID)
RETURNS TABLE(
  plan_id UUID,
  plan_name TEXT,
  user_type TEXT,
  status TEXT,
  trial_end TIMESTAMP WITH TIME ZONE,
  current_period_end TIMESTAMP WITH TIME ZONE,
  max_events INTEGER,
  max_participants INTEGER,
  max_professional_accounts INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    sp.id,
    sp.name,
    sp.user_type,
    us.status,
    us.trial_end,
    us.current_period_end,
    sp.max_events,
    sp.max_participants,
    sp.max_professional_accounts
  FROM user_subscriptions us
  JOIN subscription_plans sp ON us.plan_id = sp.id
  WHERE us.user_id = user_uuid
  AND us.status IN ('active', 'trial')
  AND (us.current_period_end IS NULL OR us.current_period_end > now())
  AND (us.trial_end IS NULL OR us.trial_end > now())
  ORDER BY us.created_at DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create trial subscription for new users
CREATE OR REPLACE FUNCTION create_trial_subscription(user_uuid UUID, user_type_param TEXT)
RETURNS UUID AS $$
DECLARE
  plan_id UUID;
  trial_days INTEGER;
  new_subscription_id UUID;
BEGIN
  -- Get appropriate plan for user type
  SELECT id INTO plan_id
  FROM subscription_plans
  WHERE subscription_plans.user_type = user_type_param
  AND is_active = true
  ORDER BY price_monthly ASC
  LIMIT 1;
  
  IF plan_id IS NULL THEN
    RAISE EXCEPTION 'No active plan found for user type: %', user_type_param;
  END IF;
  
  -- Set trial period based on user type
  trial_days := CASE 
    WHEN user_type_param = 'vendor' THEN 0
    WHEN user_type_param = 'regular' THEN 15
    WHEN user_type_param = 'professional' THEN 5
    ELSE 15
  END;
  
  -- Create subscription
  INSERT INTO user_subscriptions (
    user_id, 
    plan_id, 
    status, 
    trial_start, 
    trial_end,
    payment_provider
  ) VALUES (
    user_uuid,
    plan_id,
    CASE WHEN trial_days = 0 THEN 'active' ELSE 'trial' END,
    CASE WHEN trial_days > 0 THEN now() ELSE NULL END,
    CASE WHEN trial_days > 0 THEN now() + interval '1 day' * trial_days ELSE NULL END,
    'internal'
  ) RETURNING id INTO new_subscription_id;
  
  -- Update account instance with subscription info
  UPDATE account_instances 
  SET 
    subscription_status = CASE WHEN trial_days = 0 THEN 'active' ELSE 'trial' END,
    trial_ends_at = CASE WHEN trial_days > 0 THEN now() + interval '1 day' * trial_days ELSE NULL END,
    max_events = (SELECT max_events FROM subscription_plans WHERE id = plan_id),
    max_participants = (SELECT max_participants FROM subscription_plans WHERE id = plan_id),
    max_professional_accounts = (SELECT max_professional_accounts FROM subscription_plans WHERE id = plan_id)
  WHERE owner_user_id = user_uuid;
  
  -- Update user type registration
  UPDATE user_type_registrations 
  SET 
    subscription_id = new_subscription_id,
    requires_payment = trial_days > 0,
    payment_required_at = CASE WHEN trial_days > 0 THEN now() + interval '1 day' * trial_days ELSE NULL END
  WHERE user_id = user_uuid AND user_type = user_type_registrations.user_type;
  
  RETURN new_subscription_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to upgrade user subscription (for payment processing)
CREATE OR REPLACE FUNCTION upgrade_user_subscription(
  user_uuid UUID, 
  new_plan_id UUID, 
  payment_provider TEXT,
  payment_provider_subscription_id TEXT,
  payment_provider_customer_id TEXT
)
RETURNS UUID AS $$
DECLARE
  new_subscription_id UUID;
  plan_user_type TEXT;
BEGIN
  -- Get plan user type
  SELECT user_type INTO plan_user_type
  FROM subscription_plans
  WHERE id = new_plan_id;
  
  -- Cancel existing subscription
  UPDATE user_subscriptions 
  SET 
    status = 'canceled',
    cancel_at_period_end = true,
    canceled_at = now()
  WHERE user_id = user_uuid 
  AND status IN ('trial', 'active');
  
  -- Create new subscription
  INSERT INTO user_subscriptions (
    user_id,
    plan_id,
    status,
    current_period_start,
    current_period_end,
    payment_provider,
    payment_provider_subscription_id,
    payment_provider_customer_id
  ) VALUES (
    user_uuid,
    new_plan_id,
    'active',
    now(),
    now() + interval '1 month',
    payment_provider,
    payment_provider_subscription_id,
    payment_provider_customer_id
  ) RETURNING id INTO new_subscription_id;
  
  -- Update account instance
  UPDATE account_instances 
  SET 
    subscription_status = 'active',
    trial_ends_at = NULL,
    subscription_ends_at = now() + interval '1 month',
    max_events = (SELECT max_events FROM subscription_plans WHERE id = new_plan_id),
    max_participants = (SELECT max_participants FROM subscription_plans WHERE id = new_plan_id),
    max_professional_accounts = (SELECT max_professional_accounts FROM subscription_plans WHERE id = new_plan_id)
  WHERE account_instances.owner_user_id = user_uuid;
  
  -- Update user type registration
  UPDATE user_type_registrations 
  SET 
    subscription_id = new_subscription_id,
    requires_payment = false,
    payment_required_at = NULL
  WHERE user_id = user_uuid AND user_type = plan_user_type;
  
  RETURN new_subscription_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- UPDATED TRIGGER FOR NEW USER REGISTRATION
-- ============================================================================

-- Drop existing trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Updated function for new user registration
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Create account instance for new user
  INSERT INTO account_instances (name, owner_user_id, currency, subscription_status)
  VALUES (NEW.email, NEW.id, 'USD', 'trial');
  
  -- Register user as regular type with trial
  INSERT INTO user_type_registrations (user_id, user_type, is_active, requires_payment)
  VALUES (NEW.id, 'regular', true, true);
  
  -- Create trial subscription
  PERFORM create_trial_subscription(NEW.id, 'regular');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user registration
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================================================
-- RLS POLICIES FOR SUBSCRIPTION TABLES
-- ============================================================================

-- Enable RLS
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_webhooks ENABLE ROW LEVEL SECURITY;

-- Subscription plans - read only for authenticated users
CREATE POLICY "Users can view subscription plans" ON subscription_plans
  FOR SELECT USING (true);

-- User subscriptions - users can only see their own
CREATE POLICY "Users can manage their own subscriptions" ON user_subscriptions
  FOR ALL USING (user_id = auth.uid());

-- Subscription usage - users can only see their own
CREATE POLICY "Users can view their own usage" ON subscription_usage
  FOR SELECT USING (user_id = auth.uid());

-- Payment webhooks - only system can manage
CREATE POLICY "System can manage payment webhooks" ON payment_webhooks
  FOR ALL USING (false); -- Only allow system access

-- ============================================================================
-- UPDATED RLS POLICIES FOR EXISTING TABLES
-- ============================================================================

-- Update account instances policies to include subscription checks
DROP POLICY IF EXISTS "Users can access their own account instances" ON account_instances;
CREATE POLICY "Users can access their own account instances" ON account_instances
  FOR ALL USING (
    owner_user_id = auth.uid() 
    AND (
      subscription_status IN ('active', 'trial') 
      OR EXISTS (
        SELECT 1 FROM user_type_registrations 
        WHERE user_id = auth.uid() 
        AND user_type = 'vendor'
        AND is_active = true
      )
    )
  );

-- Update professional access policies
DROP POLICY IF EXISTS "Professionals can access granted accounts" ON account_instances;
CREATE POLICY "Professionals can access granted accounts" ON account_instances
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM professional_account_access 
      WHERE professional_id = auth.uid() 
      AND account_instance_id = account_instances.id 
      AND is_active = true
    )
    AND EXISTS (
      SELECT 1 FROM user_subscriptions us
      JOIN subscription_plans sp ON us.plan_id = sp.id
      WHERE us.user_id = auth.uid()
      AND sp.user_type = 'professional'
      AND us.status IN ('active', 'trial')
      AND (us.current_period_end IS NULL OR us.current_period_end > now())
    )
  );

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_id ON user_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_status ON user_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_trial_end ON user_subscriptions(trial_end);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_current_period_end ON user_subscriptions(current_period_end);
CREATE INDEX IF NOT EXISTS idx_subscription_usage_user_date ON subscription_usage(user_id, usage_date);
CREATE INDEX IF NOT EXISTS idx_payment_webhooks_provider_event ON payment_webhooks(provider, event_id);
CREATE INDEX IF NOT EXISTS idx_account_instances_subscription_status ON account_instances(subscription_status);
CREATE INDEX IF NOT EXISTS idx_account_instances_trial_ends_at ON account_instances(trial_ends_at);

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================

GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- ============================================================================
-- INITIAL DATA
-- ============================================================================

-- Create trial subscriptions for existing users (if any)
DO $$
DECLARE
  user_record RECORD;
BEGIN
  FOR user_record IN 
    SELECT DISTINCT u.id, u.email
    FROM auth.users u
    LEFT JOIN user_subscriptions us ON u.id = us.user_id
    WHERE us.id IS NULL
  LOOP
    -- Create trial subscription for existing users
    PERFORM create_trial_subscription(user_record.id, 'regular');
  END LOOP;
END $$; 