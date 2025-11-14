-- Create voice_profiles table for storing voice biometric data
CREATE TABLE IF NOT EXISTS voice_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_name TEXT NOT NULL,
  voice_features JSONB NOT NULL, -- Stores voice characteristics (pitch, frequency, etc.)
  enrollment_samples INTEGER DEFAULT 0, -- Number of samples used for enrollment
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on user_name for faster lookups
CREATE INDEX IF NOT EXISTS idx_voice_profiles_user_name ON voice_profiles(user_name);

-- Create index on created_at for querying recent profiles
CREATE INDEX IF NOT EXISTS idx_voice_profiles_created_at ON voice_profiles(created_at);

-- Enable Row Level Security (safely)
DO $$
BEGIN
  ALTER TABLE voice_profiles ENABLE ROW LEVEL SECURITY;
EXCEPTION
  WHEN others THEN null;
END $$;

-- Create policy to allow all operations (you can restrict this based on your auth setup)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'voice_profiles' AND policyname = 'Allow all operations on voice_profiles'
  ) THEN
    CREATE POLICY "Allow all operations on voice_profiles" ON voice_profiles
      FOR ALL
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;
