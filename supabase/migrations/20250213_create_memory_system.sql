-- Create conversation_memories table to store individual conversation snippets
CREATE TABLE IF NOT EXISTS conversation_memories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  character_mode TEXT NOT NULL CHECK (character_mode IN ('batman', 'alfred', 'joker')),
  user_message TEXT NOT NULL,
  ai_response TEXT NOT NULL,
  importance_score FLOAT DEFAULT 0.5,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT valid_importance CHECK (importance_score >= 0 AND importance_score <= 1)
);

-- Create character_profiles table to store each character's evolving summary about the user
CREATE TABLE IF NOT EXISTS character_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  character_mode TEXT NOT NULL CHECK (character_mode IN ('batman', 'alfred', 'joker')),
  profile_summary TEXT NOT NULL DEFAULT '',
  case_file JSONB DEFAULT '{}', -- For Batman: threats, missions, patterns
  personal_notes JSONB DEFAULT '{}', -- For Alfred: preferences, routines, style
  chaos_profile JSONB DEFAULT '{}', -- For Joker: jokes, triggers, humor style
  conversation_count INTEGER DEFAULT 0,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, character_mode)
);

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_memories_user_character ON conversation_memories(user_id, character_mode, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_memories_importance ON conversation_memories(importance_score DESC);
CREATE INDEX IF NOT EXISTS idx_character_profiles_user ON character_profiles(user_id, character_mode);

-- Enable Row Level Security (safely)
DO $$
BEGIN
  ALTER TABLE conversation_memories ENABLE ROW LEVEL SECURITY;
EXCEPTION
  WHEN others THEN null;
END $$;

DO $$
BEGIN
  ALTER TABLE character_profiles ENABLE ROW LEVEL SECURITY;
EXCEPTION
  WHEN others THEN null;
END $$;

-- Create policies (allow all for now - you can restrict later based on auth)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'conversation_memories' AND policyname = 'Allow all operations on memories'
  ) THEN
    CREATE POLICY "Allow all operations on memories" ON conversation_memories
      FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'character_profiles' AND policyname = 'Allow all operations on profiles'
  ) THEN
    CREATE POLICY "Allow all operations on profiles" ON character_profiles
      FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;
