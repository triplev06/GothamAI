-- Create face_profiles table for storing facial biometric data
CREATE TABLE IF NOT EXISTS face_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_name TEXT NOT NULL,
  face_features JSONB NOT NULL,
  enrollment_samples INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on user_name for faster lookups
CREATE INDEX IF NOT EXISTS idx_face_profiles_user_name ON face_profiles(user_name);

-- Create index on created_at for sorting
CREATE INDEX IF NOT EXISTS idx_face_profiles_created_at ON face_profiles(created_at DESC);

-- Add RLS policies
ALTER TABLE face_profiles ENABLE ROW LEVEL SECURITY;

-- Policy to allow all operations (since this is a demo/personal app)
CREATE POLICY "Allow all operations on face_profiles" ON face_profiles
  FOR ALL
  USING (true)
  WITH CHECK (true);
