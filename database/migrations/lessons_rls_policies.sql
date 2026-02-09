-- Add Row-Level Security policies for lessons table
-- This allows admins to create/edit lessons and users to view them

-- Enable RLS if not already enabled
ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any (to avoid conflicts)
DROP POLICY IF EXISTS "Anyone can view lessons" ON lessons;
DROP POLICY IF EXISTS "Admins can insert lessons" ON lessons;
DROP POLICY IF EXISTS "Admins can update lessons" ON lessons;
DROP POLICY IF EXISTS "Admins can delete lessons" ON lessons;

-- Allow anyone to view lessons
CREATE POLICY "Anyone can view lessons"
  ON lessons FOR SELECT
  USING (true);

-- Allow admins to insert lessons
CREATE POLICY "Admins can insert lessons"
  ON lessons FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM roles
      WHERE roles.user_id = auth.uid()
      AND roles.role = 'admin'
    )
  );

-- Allow admins to update lessons
CREATE POLICY "Admins can update lessons"
  ON lessons FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM roles
      WHERE roles.user_id = auth.uid()
      AND roles.role = 'admin'
    )
  );

-- Allow admins to delete lessons
CREATE POLICY "Admins can delete lessons"
  ON lessons FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM roles
      WHERE roles.user_id = auth.uid()
      AND roles.role = 'admin'
    )
  );
