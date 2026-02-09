-- Fix RLS policies to allow course updates during development
-- Option 1: Make yourself an admin (replace 'your-email@example.com' with your actual email)

-- First, find your user ID
-- SELECT id, email FROM auth.users WHERE email = 'your-email@example.com';

-- Then insert admin role (replace the UUID with your actual user ID from above)
-- INSERT INTO roles (user_id, role) 
-- VALUES ('YOUR-USER-ID-HERE', 'admin')
-- ON CONFLICT (user_id, role) DO NOTHING;

-- Option 2: Temporarily disable RLS for development (NOT recommended for production!)
-- ALTER TABLE courses DISABLE ROW LEVEL SECURITY;

-- Option 3: Add a more permissive update policy for authenticated users
DROP POLICY IF EXISTS "Authenticated users can update their courses" ON courses;

CREATE POLICY "Authenticated users can update their courses"
  ON courses FOR UPDATE
  USING (auth.uid() IS NOT NULL);

-- This allows any authenticated user to update any course
-- Remove this in production and use proper role-based access
