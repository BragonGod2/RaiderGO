-- STEP 0: Drop existing tables (run this FIRST)
-- WARNING: This will delete all data in these tables!

DROP TABLE IF EXISTS analytics_events CASCADE;
DROP TABLE IF EXISTS purchases CASCADE;
DROP TABLE IF EXISTS user_subscriptions CASCADE;
DROP TABLE IF EXISTS subscription_plans CASCADE;
