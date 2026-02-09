-- Add PayPal columns to tables
ALTER TABLE user_subscriptions 
ADD COLUMN IF NOT EXISTS paypal_subscription_id TEXT;

ALTER TABLE purchases 
ADD COLUMN IF NOT EXISTS paypal_order_id TEXT,
ADD COLUMN IF NOT EXISTS paypal_capture_id TEXT;

-- Update payment_status check constraint if needed (though 'completed' covers it)
-- The existing check is: CHECK (payment_status IN ('pending', 'completed', 'failed', 'refunded'))
-- This is fine for PayPal too.
