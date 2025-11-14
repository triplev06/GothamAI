-- Add a guest user profile for users who don't want to enroll
-- This allows temporary usage without biometric authentication

-- Create guest user with a known UUID
INSERT INTO auth_user_profiles (id, user_name, password_hash, created_at, updated_at)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'guest',
  NULL,
  NOW(),
  NOW()
)
ON CONFLICT (user_name) DO NOTHING;

-- Create a comment for documentation
COMMENT ON TABLE auth_user_profiles IS 'User profiles for authentication. Includes a special guest user with UUID 00000000-0000-0000-0000-000000000001 for unauthenticated sessions.';
