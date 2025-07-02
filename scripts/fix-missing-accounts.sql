-- Fix missing account instances and registrations for users
-- This script identifies users without account instances and creates them

DO $$
DECLARE
    user_record RECORD;
    plan_id UUID;
    new_subscription_id UUID;
BEGIN
    -- Get the basic regular plan
    SELECT id INTO plan_id
    FROM subscription_plans
    WHERE user_type = 'regular' AND is_active = true
    ORDER BY price_monthly ASC
    LIMIT 1;
    
    -- Loop through users who don't have account instances
    FOR user_record IN 
        SELECT u.id, u.email
        FROM auth.users u
        LEFT JOIN account_instances ai ON u.id = ai.owner_user_id
        WHERE ai.owner_user_id IS NULL
    LOOP
        RAISE NOTICE 'Creating account for user: % (%)', user_record.email, user_record.id;
        
        -- Create account instance
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
            user_record.email, 
            user_record.id, 
            'USD', 
            'trial',
            now() + interval '15 days',
            COALESCE((SELECT max_events FROM subscription_plans WHERE id = plan_id), 1),
            COALESCE((SELECT max_participants FROM subscription_plans WHERE id = plan_id), 50),
            COALESCE((SELECT max_professional_accounts FROM subscription_plans WHERE id = plan_id), 0)
        );
        
        -- Create user type registration
        INSERT INTO user_type_registrations (
            user_id, 
            user_type, 
            is_active, 
            requires_payment,
            payment_required_at
        ) VALUES (
            user_record.id, 
            'regular', 
            true, 
            true,
            now() + interval '15 days'
        );
        
        -- Create subscription if plan exists
        IF plan_id IS NOT NULL THEN
            INSERT INTO user_subscriptions (
                user_id, 
                plan_id, 
                status, 
                trial_start, 
                trial_end,
                payment_provider
            ) VALUES (
                user_record.id,
                plan_id,
                'trial',
                now(),
                now() + interval '15 days',
                'internal'
            ) RETURNING id INTO new_subscription_id;
            
            -- Update the registration with subscription_id
            UPDATE user_type_registrations 
            SET subscription_id = new_subscription_id
            WHERE user_id = user_record.id;
        END IF;
        
        RAISE NOTICE 'Successfully created account for user: %', user_record.email;
    END LOOP;
    
    RAISE NOTICE 'Fixed missing accounts successfully';
END $$; 