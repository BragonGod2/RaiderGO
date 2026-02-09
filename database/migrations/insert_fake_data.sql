-- Fake Data for Admin Center Testing
-- Run this to populate your database with sample data

-- Note: You'll need to replace the user_id values with actual user IDs from your auth.users table
-- First, get some user IDs by running: SELECT id, email FROM auth.users LIMIT 5;

-- For this example, we'll use variables - replace these with your actual user IDs
DO $$
DECLARE
  admin_user_id UUID;
  user1_id UUID;
  user2_id UUID;
  user3_id UUID;
  course1_id UUID;
  course2_id UUID;
  course3_id UUID;
  plan1_id UUID;
  plan2_id UUID;
BEGIN
  -- Get some existing user IDs (adjust the emails to match your users)
  SELECT id INTO admin_user_id FROM auth.users WHERE email LIKE '%admin%' LIMIT 1;
  SELECT id INTO user1_id FROM auth.users WHERE email NOT LIKE '%admin%' LIMIT 1 OFFSET 0;
  SELECT id INTO user2_id FROM auth.users WHERE email NOT LIKE '%admin%' LIMIT 1 OFFSET 1;
  SELECT id INTO user3_id FROM auth.users WHERE email NOT LIKE '%admin%' LIMIT 1 OFFSET 2;

  -- Get existing subscription plan IDs
  SELECT id INTO plan1_id FROM subscription_plans WHERE billing_period = 'monthly' LIMIT 1;
  SELECT id INTO plan2_id FROM subscription_plans WHERE billing_period = 'yearly' LIMIT 1;

  -- Get existing course IDs (if you have courses table)
  SELECT id INTO course1_id FROM courses LIMIT 1 OFFSET 0;
  SELECT id INTO course2_id FROM courses LIMIT 1 OFFSET 1;
  SELECT id INTO course3_id FROM courses LIMIT 1 OFFSET 2;

  -- Insert fake purchases (if we have users and courses)
  IF user1_id IS NOT NULL AND course1_id IS NOT NULL THEN
    INSERT INTO purchases (user_id, course_id, amount, currency, payment_status, created_at)
    VALUES 
      (user1_id, course1_id, 99.99, 'USD', 'completed', NOW() - INTERVAL '5 days'),
      (user1_id, course2_id, 149.99, 'USD', 'completed', NOW() - INTERVAL '3 days'),
      (user2_id, course1_id, 99.99, 'USD', 'completed', NOW() - INTERVAL '10 days'),
      (user2_id, course3_id, 199.99, 'USD', 'completed', NOW() - INTERVAL '2 days'),
      (user3_id, course2_id, 149.99, 'USD', 'completed', NOW() - INTERVAL '7 days'),
      (admin_user_id, course1_id, 99.99, 'USD', 'completed', NOW() - INTERVAL '15 days')
    ON CONFLICT DO NOTHING;
  END IF;

  -- Insert fake user subscriptions (if we have users and plans)
  IF user1_id IS NOT NULL AND plan1_id IS NOT NULL THEN
    INSERT INTO user_subscriptions (user_id, plan_id, status, current_period_start, current_period_end, created_at)
    VALUES 
      (user1_id, plan1_id, 'active', NOW() - INTERVAL '15 days', NOW() + INTERVAL '15 days', NOW() - INTERVAL '15 days'),
      (user2_id, plan2_id, 'active', NOW() - INTERVAL '30 days', NOW() + INTERVAL '335 days', NOW() - INTERVAL '30 days'),
      (user3_id, plan1_id, 'cancelled', NOW() - INTERVAL '60 days', NOW() - INTERVAL '30 days', NOW() - INTERVAL '60 days')
    ON CONFLICT DO NOTHING;
  END IF;

  -- Insert fake analytics events
  IF user1_id IS NOT NULL THEN
    INSERT INTO analytics_events (event_type, user_id, revenue, created_at, metadata)
    VALUES 
      ('course_purchase', user1_id, 99.99, NOW() - INTERVAL '5 days', '{"course_name": "Introduction to React"}'::jsonb),
      ('course_purchase', user1_id, 149.99, NOW() - INTERVAL '3 days', '{"course_name": "Advanced JavaScript"}'::jsonb),
      ('subscription_purchase', user1_id, 200.00, NOW() - INTERVAL '15 days', '{"plan_name": "Premium Monthly"}'::jsonb),
      ('course_purchase', user2_id, 99.99, NOW() - INTERVAL '10 days', '{"course_name": "Introduction to React"}'::jsonb),
      ('course_purchase', user2_id, 199.99, NOW() - INTERVAL '2 days', '{"course_name": "Full Stack Development"}'::jsonb),
      ('subscription_purchase', user2_id, 2000.00, NOW() - INTERVAL '30 days', '{"plan_name": "Premium Yearly"}'::jsonb),
      ('course_purchase', user3_id, 149.99, NOW() - INTERVAL '7 days', '{"course_name": "Advanced JavaScript"}'::jsonb),
      ('subscription_cancel', user3_id, 0, NOW() - INTERVAL '30 days', '{"plan_name": "Premium Monthly"}'::jsonb),
      ('course_purchase', admin_user_id, 99.99, NOW() - INTERVAL '15 days', '{"course_name": "Introduction to React"}'::jsonb),
      ('user_signup', user1_id, 0, NOW() - INTERVAL '20 days', '{}'::jsonb),
      ('user_signup', user2_id, 0, NOW() - INTERVAL '35 days', '{}'::jsonb),
      ('user_signup', user3_id, 0, NOW() - INTERVAL '65 days', '{}'::jsonb)
    ON CONFLICT DO NOTHING;
  END IF;

  RAISE NOTICE 'Fake data inserted successfully!';
  RAISE NOTICE 'Admin user ID: %', admin_user_id;
  RAISE NOTICE 'User 1 ID: %', user1_id;
  RAISE NOTICE 'User 2 ID: %', user2_id;
  RAISE NOTICE 'User 3 ID: %', user3_id;
END $$;
