-- Fix existing users by adding missing user_type_registrations
-- This script adds 'regular' user type registration for users who have account_instances but no registrations

DO $$
DECLARE
    user_record RECORD;
    basic_plan_id UUID;
    subscription_id UUID;
BEGIN
    -- Get the basic regular plan
    SELECT id INTO basic_plan_id
    FROM subscription_plans
    WHERE user_type = 'regular' AND is_active = true
    ORDER BY price_monthly ASC
    LIMIT 1;
    
    IF basic_plan_id IS NULL THEN
        RAISE EXCEPTION 'No active regular plan found';
    END IF;
    
    -- Loop through users who have account_instances but no user_type_registrations
    FOR user_record IN 
        SELECT DISTINCT ai.owner_user_id, ai.name
        FROM account_instances ai
        LEFT JOIN user_type_registrations utr ON ai.owner_user_id = utr.user_id
        WHERE utr.user_id IS NULL
    LOOP
        -- Create subscription for the user
        INSERT INTO user_subscriptions (
            user_id, 
            plan_id, 
            status, 
            trial_start, 
            trial_end,
            payment_provider
        ) VALUES (
            user_record.owner_user_id,
            basic_plan_id,
            'trial',
            now(),
            now() + interval '15 days',
            'internal'
        ) RETURNING id INTO subscription_id;
        
        -- Create user type registration
        INSERT INTO user_type_registrations (
            user_id,
            user_type,
            is_active,
            subscription_id,
            requires_payment,
            payment_required_at
        ) VALUES (
            user_record.owner_user_id,
            'regular',
            true,
            subscription_id,
            true,
            now() + interval '15 days'
        );
        
        RAISE NOTICE 'Created registration for user: % (%)', user_record.name, user_record.owner_user_id;
    END LOOP;
    
    RAISE NOTICE 'Fixed existing users successfully';
END $$; 