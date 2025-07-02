-- Fix the trigger function to properly bypass RLS policies
-- The issue is that RLS policies are blocking the trigger from inserting data

-- Drop the existing trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create a new trigger function that properly bypasses RLS
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  plan_id UUID;
  trial_days INTEGER := 15; -- Default trial period for regular users
BEGIN
  -- Get the basic regular plan
  SELECT id INTO plan_id
  FROM subscription_plans
  WHERE user_type = 'regular' AND is_active = true
  ORDER BY price_monthly ASC
  LIMIT 1;
  
  -- Create account instance for new user (bypass RLS)
  INSERT INTO account_instances (
    name, 
    owner_user_id, 
    currency, 
    subscription_status,
    trial_ends_at,
    max_events,
    max_participants,
    max_professional_accounts
  ) VALUES (
    NEW.email, 
    NEW.id, 
    'USD', 
    'trial',
    now() + interval '1 day' * trial_days,
    COALESCE((SELECT max_events FROM subscription_plans WHERE id = plan_id), 1),
    COALESCE((SELECT max_participants FROM subscription_plans WHERE id = plan_id), 50),
    COALESCE((SELECT max_professional_accounts FROM subscription_plans WHERE id = plan_id), 0)
  );
  
  -- Register user as regular type (bypass RLS)
  INSERT INTO user_type_registrations (
    user_id, 
    user_type, 
    is_active, 
    requires_payment,
    payment_required_at
  ) VALUES (
    NEW.id, 
    'regular', 
    true, 
    true,
    now() + interval '1 day' * trial_days
  );
  
  -- Create subscription if plan exists (bypass RLS)
  IF plan_id IS NOT NULL THEN
    INSERT INTO user_subscriptions (
      user_id, 
      plan_id, 
      status, 
      trial_start, 
      trial_end,
      payment_provider
    ) VALUES (
      NEW.id,
      plan_id,
      'trial',
      now(),
      now() + interval '1 day' * trial_days,
      'internal'
    );
  END IF;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error but don't fail the user creation
    RAISE WARNING 'Error in handle_new_user trigger: %', SQLERRM;
    RETURN NEW;
END;
$function$;

-- Re-create the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user(); 