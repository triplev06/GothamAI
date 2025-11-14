-- Add password backup option to auth user profiles
-- This allows users to authenticate with password if biometrics fail

CREATE TABLE IF NOT EXISTS auth_user_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_name TEXT NOT NULL UNIQUE,
  password_hash TEXT, -- bcrypt hash of password (optional backup)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on user_name for faster lookups
CREATE INDEX IF NOT EXISTS idx_auth_user_profiles_user_name ON auth_user_profiles(user_name);

-- Enable Row Level Security (safely)
DO $$
BEGIN
  ALTER TABLE auth_user_profiles ENABLE ROW LEVEL SECURITY;
EXCEPTION
  WHEN others THEN null;
END $$;

-- Create policy to allow all operations (you can restrict this based on your auth setup)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'auth_user_profiles' AND policyname = 'Allow all operations on auth_user_profiles'
  ) THEN
    CREATE POLICY "Allow all operations on auth_user_profiles" ON auth_user_profiles
      FOR ALL
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;

-- Add foreign key constraints to link biometric profiles to auth user profiles
-- First, add user_profile_id column to existing tables
ALTER TABLE voice_profiles ADD COLUMN IF NOT EXISTS user_profile_id UUID REFERENCES auth_user_profiles(id) ON DELETE CASCADE;
ALTER TABLE face_profiles ADD COLUMN IF NOT EXISTS user_profile_id UUID REFERENCES auth_user_profiles(id) ON DELETE CASCADE;

-- Create indexes for the foreign keys
CREATE INDEX IF NOT EXISTS idx_voice_profiles_user_profile_id ON voice_profiles(user_profile_id);
CREATE INDEX IF NOT EXISTS idx_face_profiles_user_profile_id ON face_profiles(user_profile_id);
