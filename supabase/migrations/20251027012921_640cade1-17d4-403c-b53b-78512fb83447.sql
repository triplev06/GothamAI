-- Create voice_profiles table for storing voice biometric data
CREATE TABLE IF NOT EXISTS voice_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_name TEXT NOT NULL,
  voice_features JSONB NOT NULL,
  enrollment_samples INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_voice_profiles_user_name ON voice_profiles(user_name);
CREATE INDEX IF NOT EXISTS idx_voice_profiles_created_at ON voice_profiles(created_at);

ALTER TABLE voice_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations on voice_profiles" ON voice_profiles
  FOR ALL
  USING (true)
  WITH CHECK (true);