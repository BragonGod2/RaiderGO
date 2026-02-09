-- Add email column to user_profiles table
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS email TEXT;

-- Create unique index on email
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_profiles_email ON user_profiles(email);

-- Update existing profiles with emails from auth.users
-- Note: This requires running a script or doing it manually since we can't directly query auth.users in SQL
-- You'll need to update this via the application or a server function
