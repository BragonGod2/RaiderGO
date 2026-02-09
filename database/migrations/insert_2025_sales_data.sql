-- Generate extensive fake sales data for 2025
-- This script creates realistic purchase and subscription data throughout the year

-- First, let's get some user IDs to use (we'll use existing users from user_profiles)
DO $$
DECLARE
    user_ids uuid[];
    course_ids uuid[];
    user_id uuid;
    course_id uuid;
    purchase_date date;
    days_in_year integer := 365;
    purchases_per_day integer;
    i integer;
    j integer;
    random_course integer;
    random_amount numeric;
BEGIN
    -- Get existing user IDs
    SELECT ARRAY_AGG(up.user_id) INTO user_ids FROM user_profiles up LIMIT 20;
    
    -- Get existing course IDs
    SELECT ARRAY_AGG(c.id) INTO course_ids FROM courses c;
    
    -- If no users or courses exist, exit
    IF user_ids IS NULL OR course_ids IS NULL THEN
        RAISE NOTICE 'No users or courses found. Please ensure users and courses exist first.';
        RETURN;
    END IF;
    
    RAISE NOTICE 'Generating sales data for % users and % courses...', array_length(user_ids, 1), array_length(course_ids, 1);
    
    -- Generate purchases for each day of 2025
    FOR i IN 0..364 LOOP
        purchase_date := '2025-01-01'::date + (i || ' days')::interval;
        
        -- Vary purchases per day (more on weekends, holidays, etc.)
        -- Base: 5-15 purchases per day
        purchases_per_day := 5 + floor(random() * 10)::integer;
        
        -- Increase for certain periods
        IF EXTRACT(DOW FROM purchase_date) IN (0, 6) THEN
            -- Weekends: 20% more
            purchases_per_day := purchases_per_day + floor(purchases_per_day * 0.2)::integer;
        END IF;
        
        -- Holiday season (Nov-Dec): 50% more
        IF EXTRACT(MONTH FROM purchase_date) IN (11, 12) THEN
            purchases_per_day := purchases_per_day + floor(purchases_per_day * 0.5)::integer;
        END IF;
        
        -- Back to school (August-September): 30% more
        IF EXTRACT(MONTH FROM purchase_date) IN (8, 9) THEN
            purchases_per_day := purchases_per_day + floor(purchases_per_day * 0.3)::integer;
        END IF;
        
        -- Generate purchases for this day
        FOR j IN 1..purchases_per_day LOOP
            -- Pick random user and course
            user_id := user_ids[1 + floor(random() * array_length(user_ids, 1))::integer];
            random_course := 1 + floor(random() * array_length(course_ids, 1))::integer;
            course_id := course_ids[random_course];
            
            -- Random amount between $29.99 and $199.99
            random_amount := 29.99 + (random() * 170)::numeric(10,2);
            
            -- Insert purchase (ignore if duplicate)
            INSERT INTO purchases (
                user_id,
                course_id,
                amount,
                currency,
                payment_status,
                created_at
            ) VALUES (
                user_id,
                course_id,
                random_amount,
                'USD',
                'completed',
                purchase_date + (random() * interval '23 hours')
            )
            ON CONFLICT DO NOTHING;
        END LOOP;
        
        -- Log progress every 30 days
        IF i % 30 = 0 THEN
            RAISE NOTICE 'Generated data through %', purchase_date;
        END IF;
    END LOOP;
    
    RAISE NOTICE 'Sales data generation complete!';
    
    -- Generate some subscription renewals throughout 2025
    RAISE NOTICE 'Generating subscription renewals...';
    
    FOR i IN 0..11 LOOP  -- 12 months
        FOR j IN 1..15 LOOP  -- 15 subscriptions per month
            user_id := user_ids[1 + floor(random() * array_length(user_ids, 1))::integer];
            
            INSERT INTO analytics_events (
                event_type,
                user_id,
                metadata,
                revenue,
                created_at
            ) VALUES (
                'subscription_purchase',
                user_id,
                jsonb_build_object(
                    'plan', CASE floor(random() * 3)::integer
                        WHEN 0 THEN 'monthly'
                        WHEN 1 THEN 'quarterly'
                        ELSE 'annual'
                    END
                ),
                CASE floor(random() * 3)::integer
                    WHEN 0 THEN 19.99  -- monthly
                    WHEN 1 THEN 49.99  -- quarterly
                    ELSE 149.99        -- annual
                END,
                ('2025-' || LPAD((i + 1)::text, 2, '0') || '-' || (1 + floor(random() * 28)::integer)::text)::timestamp
            );
        END LOOP;
    END LOOP;
    
    RAISE NOTICE 'Subscription renewals complete!';
END $$;

-- Show summary statistics
DO $$
DECLARE
    total_purchases integer;
    total_revenue numeric;
    total_subscriptions integer;
    subscription_revenue numeric;
BEGIN
    SELECT COUNT(*), COALESCE(SUM(amount), 0) 
    INTO total_purchases, total_revenue
    FROM purchases 
    WHERE EXTRACT(YEAR FROM created_at) = 2025;
    
    SELECT COUNT(*), COALESCE(SUM(revenue), 0)
    INTO total_subscriptions, subscription_revenue
    FROM analytics_events
    WHERE event_type = 'subscription_purchase' 
    AND EXTRACT(YEAR FROM created_at) = 2025;
    
    RAISE NOTICE '======================================';
    RAISE NOTICE 'SUMMARY FOR 2025:';
    RAISE NOTICE '======================================';
    RAISE NOTICE 'Total Purchases: %', total_purchases;
    RAISE NOTICE 'Purchase Revenue: $%', ROUND(total_revenue, 2);
    RAISE NOTICE 'Total Subscription Renewals: %', total_subscriptions;
    RAISE NOTICE 'Subscription Revenue: $%', ROUND(subscription_revenue, 2);
    RAISE NOTICE 'Combined Revenue: $%', ROUND(total_revenue + subscription_revenue, 2);
    RAISE NOTICE '======================================';
END $$;
