-- Fix the handle_new_user trigger function to avoid foreign key constraint issues
-- The issue is that we're inserting into user_type_registrations before creating the subscription

-- First, update the create_trial_subscription function to not update user_type_registrations
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
  
  -- Note: user_type_registrations will be handled by the trigger function
  -- No need to update it here to avoid conflicts
  
  RETURN new_subscription_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Now update the handle_new_user trigger function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  subscription_id UUID;
BEGIN
  -- Create account instance for new user
  INSERT INTO account_instances (name, owner_user_id, currency, subscription_status)
  VALUES (NEW.email, NEW.id, 'USD', 'trial');
  
  -- Create trial subscription first
  subscription_id := create_trial_subscription(NEW.id, 'regular');
  
  -- Register user as regular type with trial (now with the subscription_id)
  INSERT INTO user_type_registrations (
    user_id, 
    user_type, 
    is_active, 
    subscription_id,
    requires_payment,
    payment_required_at
  ) VALUES (
    NEW.id, 
    'regular', 
    true, 
    subscription_id,
    true,
    now() + interval '15 days'
  );
  
  RETURN NEW;
END;
$function$; 