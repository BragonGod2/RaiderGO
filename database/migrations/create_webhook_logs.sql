-- Create a table for webhook logs
CREATE TABLE IF NOT EXISTS webhook_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type TEXT,
    payload JSONB,
    error TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for webhook_logs
ALTER TABLE webhook_logs ENABLE ROW LEVEL SECURITY;

-- Allow service role (webhook) to insert
CREATE POLICY "Service role can insert webhook logs" ON webhook_logs FOR INSERT TO service_role WITH CHECK (true);

-- Allow authenticated users (potentially admins) to read logs
CREATE POLICY "Admins can view webhook logs" ON webhook_logs FOR SELECT TO authenticated USING (true);
