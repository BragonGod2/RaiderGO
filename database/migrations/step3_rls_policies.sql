-- Admin Center Database Schema - STEP 3 (Simplified)
-- Run this AFTER step2_indexes_triggers.sql

-- Enable RLS
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;

-- Subscription Plans: Everyone can view active plans
DROP POLICY IF EXISTS "Anyone can view active subscription plans" ON subscription_plans;
CREATE POLICY "Anyone can view active subscription plans"
  ON subscription_plans FOR SELECT
  USING (is_active = true);

-- For now, allow all authenticated users to manage subscription plans
-- You can tighten this later to check admin role
DROP POLICY IF EXISTS "Authenticated users can manage subscription plans" ON subscription_plans;
CREATE POLICY "Authenticated users can manage subscription plans"
  ON subscription_plans FOR ALL
  USING (auth.uid() IS NOT NULL);

-- User Subscriptions: Users can view their own
DROP POLICY IF EXISTS "Users can view their own subscriptions" ON user_subscriptions;
CREATE POLICY "Users can view their own subscriptions"
  ON user_subscriptions FOR SELECT
  USING (user_id = auth.uid());

-- Allow authenticated users to view all subscriptions (for admin)
DROP POLICY IF EXISTS "Authenticated users can view all subscriptions" ON user_subscriptions;
CREATE POLICY "Authenticated users can view all subscriptions"
  ON user_subscriptions FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Allow authenticated users to manage subscriptions (for admin)
DROP POLICY IF EXISTS "Authenticated users can manage all subscriptions" ON user_subscriptions;
CREATE POLICY "Authenticated users can manage all subscriptions"
  ON user_subscriptions FOR ALL
  USING (auth.uid() IS NOT NULL);

-- Purchases: Users can view their own
DROP POLICY IF EXISTS "Users can view their own purchases" ON purchases;
CREATE POLICY "Users can view their own purchases"
  ON purchases FOR SELECT
  USING (user_id = auth.uid());

-- Allow authenticated users to view all purchases (for admin)
DROP POLICY IF EXISTS "Authenticated users can view all purchases" ON purchases;
CREATE POLICY "Authenticated users can view all purchases"
  ON purchases FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Allow authenticated users to manage purchases (for admin)
DROP POLICY IF EXISTS "Authenticated users can manage all purchases" ON purchases;
CREATE POLICY "Authenticated users can manage all purchases"
  ON purchases FOR ALL
  USING (auth.uid() IS NOT NULL);

-- Analytics Events: Allow authenticated users to access
DROP POLICY IF EXISTS "Authenticated users can view analytics events" ON analytics_events;
CREATE POLICY "Authenticated users can view analytics events"
  ON analytics_events FOR SELECT
  USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Authenticated users can create analytics events" ON analytics_events;
CREATE POLICY "Authenticated users can create analytics events"
  ON analytics_events FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);
