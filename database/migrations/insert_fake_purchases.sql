-- Generate realistic fake purchases that actually work!
-- This script creates purchases for existing users and courses

DO $$
DECLARE
    user_ids uuid[];
    course_ids uuid[];
    course_prices numeric[];
    total_users integer;
    total_courses integer;
    random_user_idx integer;
    random_course_idx integer;
    purchase_date timestamp;
    i integer;
BEGIN
    -- Get all existing users
    SELECT ARRAY_AGG(id) INTO user_ids FROM auth.users;
    total_users := COALESCE(array_length(user_ids, 1), 0);
    
    -- Get all existing courses with their prices
    SELECT ARRAY_AGG(id), ARRAY_AGG(price) 
    INTO course_ids, course_prices 
    FROM courses 
    WHERE is_published = true;
    total_courses := COALESCE(array_length(course_ids, 1), 0);
    
    RAISE NOTICE 'Found % users and % courses', total_users, total_courses;
    
    -- Check if we have data to work with
    IF total_users = 0 THEN
        RAISE NOTICE '❌ No users found! Please create some users first.';
        RETURN;
    END IF;
    
    IF total_courses = 0 THEN
        RAISE NOTICE '❌ No courses found! Please run create_courses_table.sql first.';
        RETURN;
    END IF;
    
    RAISE NOTICE '✨ Generating 200 fake purchases...';
    
    -- Generate 200 purchases over the last 90 days
    FOR i IN 1..200 LOOP
        -- Pick random user and course
        random_user_idx := 1 + floor(random() * total_users)::integer;
        random_course_idx := 1 + floor(random() * total_courses)::integer;
        
        -- Random date in last 90 days
        purchase_date := NOW() - (random() * interval '90 days');
        
        -- Insert purchase
        INSERT INTO purchases (
            user_id,
            course_id,
            amount,
            currency,
            payment_status,
            stripe_payment_intent_id,
            created_at
        ) VALUES (
            user_ids[random_user_idx],
            course_ids[random_course_idx],
            course_prices[random_course_idx],
            'USD',
            'completed',
            'pi_fake_' || gen_random_uuid()::text,
            purchase_date
        )
        ON CONFLICT DO NOTHING;
        
        -- Progress indicator
        IF i % 50 = 0 THEN
            RAISE NOTICE 'Created % purchases...', i;
        END IF;
    END LOOP;
    
    RAISE NOTICE '✅ Successfully created purchases!';
    RAISE NOTICE '';
    
    -- Show summary
    DECLARE
        total_count integer;
        total_revenue numeric;
        recent_count integer;
    BEGIN
        SELECT COUNT(*), COALESCE(SUM(amount), 0)
        INTO total_count, total_revenue
        FROM purchases;
        
        SELECT COUNT(*)
        INTO recent_count
        FROM purchases
        WHERE created_at >= NOW() - interval '30 days';
        
        RAISE NOTICE '====================================';
        RAISE NOTICE '📊 PURCHASE SUMMARY';
        RAISE NOTICE '====================================';
        RAISE NOTICE 'Total Purchases: %', total_count;
        RAISE NOTICE 'Total Revenue: $%', ROUND(total_revenue, 2);
        RAISE NOTICE 'Purchases (Last 30 days): %', recent_count;
        RAISE NOTICE '====================================';
    END;
END $$;
