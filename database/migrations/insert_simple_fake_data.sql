-- Simple Fake Data for Analytics Testing
-- This creates sample purchases and subscriptions without needing existing courses

DO $$
DECLARE
  user1_id UUID;
  user2_id UUID;
  user3_id UUID;
  plan1_id UUID;
  plan2_id UUID;
BEGIN
  -- Get some existing user IDs
  SELECT id INTO user1_id FROM auth.users WHERE email LIKE '%john%' OR email LIKE '%test%' LIMIT 1;
  SELECT id INTO user2_id FROM auth.users WHERE email LIKE '%jane%' LIMIT 1 OFFSET 0;
  IF user2_id IS NULL THEN
    SELECT id INTO user2_id FROM auth.users LIMIT 1 OFFSET 1;
  END IF;
  SELECT id INTO user3_id FROM auth.users LIMIT 1 OFFSET 2;

  -- Get existing subscription plan IDs
  SELECT id INTO plan1_id FROM subscription_plans WHERE billing_period = 'monthly' LIMIT 1;
  SELECT id INTO plan2_id FROM subscription_plans WHERE billing_period = 'yearly' LIMIT 1;

  RAISE NOTICE 'User 1 ID: %', user1_id;
  RAISE NOTICE 'User 2 ID: %', user2_id;
  RAISE NOTICE 'User 3 ID: %', user3_id;
  RAISE NOTICE 'Plan 1 ID: %', plan1_id;
  RAISE NOTICE 'Plan 2 ID: %', plan2_id;

  -- Insert fake purchases (without needing courses table)
  IF user1_id IS NOT NULL THEN
    RAISE NOTICE 'Inserting fake purchases...';
    INSERT INTO purchases (user_id, course_id, amount, currency, payment_status, created_at)
    VALUES 
      (user1_id, gen_random_uuid(), 99.99, 'USD', 'completed', NOW() - INTERVAL '1 days'),
      (user1_id, gen_random_uuid(), 149.99, 'USD', 'completed', NOW() - INTERVAL '3 days'),
      (user1_id, gen_random_uuid(), 79.99, 'USD', 'completed', NOW() - INTERVAL '5 days')
    ON CONFLICT DO NOTHING;
    
    IF user2_id IS NOT NULL THEN
      INSERT INTO purchases (user_id, course_id, amount, currency, payment_status, created_at)
      VALUES 
        (user2_id, gen_random_uuid(), 199.99, 'USD', 'completed', NOW() - INTERVAL '2 days'),
        (user2_id, gen_random_uuid(), 129.99, 'USD', 'completed', NOW() - INTERVAL '7 days'),
        (user2_id, gen_random_uuid(), 89.99, 'USD', 'completed', NOW() - INTERVAL '10 days')
      ON CONFLICT DO NOTHING;
    END IF;

    IF user3_id IS NOT NULL THEN
      INSERT INTO purchases (user_id, course_id, amount, currency, payment_status, created_at)
      VALUES 
        (user3_id, gen_random_uuid(), 159.99, 'USD', 'completed', NOW() - INTERVAL '4 days'),
        (user3_id, gen_random_uuid(), 119.99, 'USD', 'completed', NOW() - INTERVAL '8 days'),
        (user3_id, gen_random_uuid(), 99.99, 'USD', 'completed', NOW() - INTERVAL '12 days')
      ON CONFLICT DO NOTHING;
    END IF;
  END IF;

  -- Insert fake user subscriptions
  IF user1_id IS NOT NULL AND plan1_id IS NOT NULL THEN
    RAISE NOTICE 'Inserting fake subscriptions...';
    INSERT INTO user_subscriptions (user_id, plan_id, status, current_period_start, current_period_end, created_at)
    VALUES 
      (user1_id, plan1_id, 'active', NOW() - INTERVAL '15 days', NOW() + INTERVAL '15 days', NOW() - INTERVAL '15 days')
    ON CONFLICT DO NOTHING;
    
    IF user2_id IS NOT NULL AND plan2_id IS NOT NULL THEN
      INSERT INTO user_subscriptions (user_id, plan_id, status, current_period_start, current_period_end, created_at)
      VALUES 
        (user2_id, plan2_id, 'active', NOW() - INTERVAL '30 days', NOW() + INTERVAL '335 days', NOW() - INTERVAL '30 days')
      ON CONFLICT DO NOTHING;
    END IF;
  END IF;

  -- Insert fake analytics events for more data points
  IF user1_id IS NOT NULL THEN
    RAISE NOTICE 'Inserting fake analytics events...';
    INSERT INTO analytics_events (event_type, user_id, revenue, created_at, metadata)
    VALUES 
      -- Recent purchases
      ('course_purchase', user1_id, 99.99, NOW() - INTERVAL '1 days', '{"course_name": "React Basics"}'::jsonb),
      ('course_purchase', user1_id, 149.99, NOW() - INTERVAL '3 days', '{"course_name": "Advanced JS"}'::jsonb),
      ('course_purchase', user1_id, 79.99, NOW() - INTERVAL '5 days', '{"course_name": "CSS Mastery"}'::jsonb),
      
      -- Subscriptions
      ('subscription_purchase', user1_id, 200.00, NOW() - INTERVAL '15 days', '{"plan_name": "Premium Monthly"}'::jsonb)
    ON CONFLICT DO NOTHING;

    IF user2_id IS NOT NULL THEN
      INSERT INTO analytics_events (event_type, user_id, revenue, created_at, metadata)
      VALUES 
        ('course_purchase', user2_id, 199.99, NOW() - INTERVAL '2 days', '{"course_name": "Full Stack Dev"}'::jsonb),
        ('course_purchase', user2_id, 129.99, NOW() - INTERVAL '7 days', '{"course_name": "Node.js Pro"}'::jsonb),
        ('course_purchase', user2_id, 89.99, NOW() - INTERVAL '10 days', '{"course_name": "Python Basics"}'::jsonb),
        ('subscription_purchase', user2_id, 2000.00, NOW() - INTERVAL '30 days', '{"plan_name": "Premium Yearly"}'::jsonb)
      ON CONFLICT DO NOTHING;
    END IF;

    IF user3_id IS NOT NULL THEN
      INSERT INTO analytics_events (event_type, user_id, revenue, created_at, metadata)
      VALUES 
        ('course_purchase', user3_id, 159.99, NOW() - INTERVAL '4 days', '{"course_name": "Vue Mastery"}'::jsonb),
        ('course_purchase', user3_id, 119.99, NOW() - INTERVAL '8 days', '{"course_name": "MongoDB Pro"}'::jsonb),
        ('course_purchase', user3_id, 99.99, NOW() - INTERVAL '12 days', '{"course_name": "Docker Basics"}'::jsonb)
      ON CONFLICT DO NOTHING;
    END IF;
  END IF;

  RAISE NOTICE '✅ Fake data inserted successfully!';
  RAISE NOTICE 'You should now see revenue data in the analytics dashboard';
END $$;
