# Quick Migration Guide

## Step 1: Run the Migration in Supabase

Copy the SQL below and run it in your Supabase Dashboard:

```sql
-- Function to automatically create user profile when a new user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert a new profile for the user
  -- Extract metadata from raw_user_meta_data which is set during signup
  INSERT INTO public.user_profiles (
    user_id,
    username,
    first_name,
    last_name,
    email
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)), -- Default to email prefix if no username
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    NEW.email
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop the trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger to call the function when a new user is created
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON public.user_profiles TO postgres, anon, authenticated, service_role;
```

### How to Run:
1. Go to https://supabase.com/dashboard
2. Select your project
3. Click "SQL Editor" in the left sidebar
4. Click "New query"
5. Paste the SQL above
6. Click "Run" (or press Cmd+Enter)

## Step 2: Test the Fix

After running the migration:

1. Open your app in an **incognito/private browser window**
2. Navigate to `/signup`
3. Create a test account with these details:
   - First Name: Test
   - Last Name: User
   - Username: testuser123
   - Email: test@example.com
   - Password: (any password)

## Step 3: Verify in Supabase

1. Go to Supabase Dashboard → Table Editor → `user_profiles`
2. Look for the new user record
3. It should have all the fields populated (username, first_name, last_name, email)

✅ If you see the record, the fix is working!
