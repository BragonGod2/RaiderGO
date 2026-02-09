-- Add stripe_payment_intent_id to purchases table if it doesn't exist
ALTER TABLE purchases ADD COLUMN IF NOT EXISTS stripe_payment_intent_id TEXT;
