-- Admin Center Database Schema
-- Run this in your Supabase SQL Editor

-- ============================================
-- 1. SUBSCRIPTION PLANS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  billing_period TEXT NOT NULL CHECK (billing_period IN ('monthly', 'yearly')),
  features JSONB DEFAULT '[]'::jsonb,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 2. USER SUBSCRIPTIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS user_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES subscription_plans(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('active', 'cancelled', 'expired', 'trial')),
  current_period_start TIMESTAMP WITH TIME ZONE NOT NULL,
  current_period_end TIMESTAMP WITH TIME ZONE NOT NULL,
  cancel_at_period_end BOOLEAN DEFAULT false,
  stripe_subscription_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, plan_id)
);

-- ============================================
-- 3. PURCHASES TABLE (for individual courses)
-- ============================================
CREATE TABLE IF NOT EXISTS purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id UUID NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  payment_status TEXT NOT NULL CHECK (payment_status IN ('pending', 'completed', 'failed', 'refunded')),
  stripe_payment_id TEXT,
  stripe_session_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 4. ANALYTICS EVENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL CHECK (event_type IN ('course_purchase', 'subscription_purchase', 'subscription_cancel', 'user_signup')),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  revenue DECIMAL(10, 2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 5. INDEXES FOR PERFORMANCE
-- ============================================
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_id ON user_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_plan_id ON user_subscriptions(plan_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_status ON user_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_purchases_user_id ON purchases(user_id);
CREATE INDEX IF NOT EXISTS idx_purchases_course_id ON purchases(course_id);
CREATE INDEX IF NOT EXISTS idx_purchases_created_at ON purchases(created_at);
CREATE INDEX IF NOT EXISTS idx_analytics_events_type ON analytics_events(event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_events_created_at ON analytics_events(created_at);

-- Optional: Add foreign key to courses table if it exists
-- Uncomment the following line if you have a 'courses' table
-- ALTER TABLE purchases ADD CONSTRAINT fk_purchases_course_id FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE;

-- ============================================
-- 6. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

-- Enable RLS
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;

-- Subscription Plans: Everyone can read, only admins can modify
CREATE POLICY "Anyone can view active subscription plans"
  ON subscription_plans FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage subscription plans"
  ON subscription_plans FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM roles 
      WHERE roles.user_id = auth.uid() 
      AND roles.role = 'admin'
    )
  );

-- User Subscriptions: Users can view their own, admins can view all
CREATE POLICY "Users can view their own subscriptions"
  ON user_subscriptions FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Admins can view all subscriptions"
  ON user_subscriptions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM roles 
      WHERE roles.user_id = auth.uid() 
      AND roles.role = 'admin'
    )
  );

CREATE POLICY "Admins can manage all subscriptions"
  ON user_subscriptions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM roles 
      WHERE roles.user_id = auth.uid() 
      AND roles.role = 'admin'
    )
  );

-- Purchases: Users can view their own, admins can view all
CREATE POLICY "Users can view their own purchases"
  ON purchases FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Admins can view all purchases"
  ON purchases FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM roles 
      WHERE roles.user_id = auth.uid() 
      AND roles.role = 'admin'
    )
  );

CREATE POLICY "Admins can manage all purchases"
  ON purchases FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM roles 
      WHERE roles.user_id = auth.uid() 
      AND roles.role = 'admin'
    )
  );

-- Analytics Events: Only admins can read
CREATE POLICY "Admins can view analytics events"
  ON analytics_events FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM roles 
      WHERE roles.user_id = auth.uid() 
      AND roles.role = 'admin'
    )
  );

CREATE POLICY "Admins can create analytics events"
  ON analytics_events FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM roles 
      WHERE roles.user_id = auth.uid() 
      AND roles.role = 'admin'
    )
  );

-- ============================================
-- 7. TRIGGERS FOR AUTOMATIC TIMESTAMPS
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers
CREATE TRIGGER update_subscription_plans_updated_at BEFORE UPDATE ON subscription_plans
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_subscriptions_updated_at BEFORE UPDATE ON user_subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_purchases_updated_at BEFORE UPDATE ON purchases
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 8. SEED DATA (Optional - for testing)
-- ============================================

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

-- Note: You can remove the seed data section if you prefer to add plans manually through the admin interface
