-- Create Fake User Profiles for Testing
-- Note: These won't be real auth users, but they'll show up in the admin center

-- First, let's create some fake user IDs (simulating auth users)
-- In production, these would come from auth.users

DO $$
DECLARE
  fake_user1_id UUID := gen_random_uuid();
  fake_user2_id UUID := gen_random_uuid();
  fake_user3_id UUID := gen_random_uuid();
  fake_user4_id UUID := gen_random_uuid();
  fake_user5_id UUID := gen_random_uuid();
BEGIN
  -- Insert fake user profiles
  -- Note: This will only work for display purposes since these users don't exist in auth.users
  -- For real testing, you should sign up actual users through the UI
  
  -- Option 1: Just add profiles (won't work with foreign key constraints)
  -- This is commented out because it will fail due to foreign key constraint
  
  /*
  INSERT INTO user_profiles (user_id, username, first_name, last_name, created_at)
  VALUES 
    (fake_user1_id, 'john_doe', 'John', 'Doe', NOW() - INTERVAL '30 days'),
    (fake_user2_id, 'jane_smith', 'Jane', 'Smith', NOW() - INTERVAL '45 days'),
    (fake_user3_id, 'bob_wilson', 'Bob', 'Wilson', NOW() - INTERVAL '60 days'),
    (fake_user4_id, 'alice_brown', 'Alice', 'Brown', NOW() - INTERVAL '15 days'),
    (fake_user5_id, 'charlie_davis', 'Charlie', 'Davis', NOW() - INTERVAL '90 days')
  ON CONFLICT DO NOTHING;
  */

  RAISE NOTICE 'Cannot create fake users directly due to foreign key constraints.';
  RAISE NOTICE 'Please create users through the signup page instead.';
  RAISE NOTICE 'Here are some test accounts you can create:';
  RAISE NOTICE '1. Email: john@test.com, Username: john_doe, Name: John Doe';
  RAISE NOTICE '2. Email: jane@test.com, Username: jane_smith, Name: Jane Smith';
  RAISE NOTICE '3. Email: bob@test.com, Username: bob_wilson, Name: Bob Wilson';
  RAISE NOTICE '4. Email: alice@test.com, Username: alice_brown, Name: Alice Brown';
  RAISE NOTICE '5. Email: charlie@test.com, Username: charlie_davis, Name: Charlie Davis';
END $$;
