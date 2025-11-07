-- Add password backup option to user profiles
-- This allows users to authenticate with password if biometrics fail

CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_name TEXT NOT NULL UNIQUE,
  password_hash TEXT, -- bcrypt hash of password (optional backup)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on user_name for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_name ON user_profiles(user_name);

-- Enable Row Level Security
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations (you can restrict this based on your auth setup)
CREATE POLICY "Allow all operations on user_profiles" ON user_profiles
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Add foreign key constraints to link biometric profiles to user profiles
-- First, add user_profile_id column to existing tables
ALTER TABLE voice_profiles ADD COLUMN IF NOT EXISTS user_profile_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE;
ALTER TABLE face_profiles ADD COLUMN IF NOT EXISTS user_profile_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE;

-- Create indexes for the foreign keys
CREATE INDEX IF NOT EXISTS idx_voice_profiles_user_profile_id ON voice_profiles(user_profile_id);
CREATE INDEX IF NOT EXISTS idx_face_profiles_user_profile_id ON face_profiles(user_profile_id);
