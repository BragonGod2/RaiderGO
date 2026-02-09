-- Admin Center Database Schema - STEP 4 (Optional)
-- Run this AFTER step3_rls_policies.sql to add sample data

-- Insert sample subscription plans
INSERT INTO subscription_plans (name, description, price, billing_period, features, is_active)
VALUES 
  ('Premium Monthly', 'Unlimited access to all courses with monthly billing', 200.00, 'monthly', 
   '["Unlimited access to all courses", "Lifetime access to purchased courses", "Community support", "Weekly live coaching sessions", "Priority customer support"]'::jsonb, 
   true),
  ('Premium Yearly', 'Unlimited access to all courses with yearly billing (save 2 months)', 2000.00, 'yearly',
   '["Unlimited access to all courses", "Lifetime access to purchased courses", "Community support", "Weekly live coaching sessions", "Priority customer support", "2 months free"]'::jsonb,
   true)
ON CONFLICT DO NOTHING;
