# Voice Biometrics Setup Guide

This guide will help you set up the voice biometric authentication system for your AI assistant.

## What Was Implemented

Your voice input component now includes:

1. **Speech-to-Text**: Converts your spoken words to text using the Web Speech API
2. **Voice Biometric Identification**: Analyzes your voice characteristics (pitch, frequency, etc.) to identify who is speaking
3. **Voice Enrollment Wizard**: A guided setup process for users to register their voice
4. **Speaker Display**: Shows the identified speaker's name in chat messages

## Setup Instructions

### Step 1: Apply Database Migration

You need to create the `voice_profiles` table in your Supabase database.

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project (hczaapfgrxkfipwlsjow)
3. Navigate to **SQL Editor** in the left sidebar
4. Click **New Query**
5. Copy and paste the following SQL:

```sql
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
```

6. Click **Run** to execute the migration

### Step 2: Test the Application

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Open your browser to the app URL

3. **First-Time Setup**:
   - You'll automatically see the Voice Enrollment wizard
   - Enter your name
   - Record 3 voice samples by reading the prompts on screen
   - Your voice profile will be saved

4. **Using Voice Input**:
   - Click the microphone button in the chat interface
   - Speak your message
   - The system will:
     - Transcribe your speech to text
     - Identify you by your voice
     - Display your name above the message
     - Send the message to Alfred

## How It Works

### Voice Feature Extraction

The system analyzes these voice characteristics:

- **Average Pitch**: Your typical speaking pitch
- **Pitch Variance**: How much your pitch varies
- **Spectral Centroid**: Where most of the sound energy is concentrated
- **Spectral Rolloff**: High-frequency characteristics
- **Energy Mean & Variance**: Speaking volume patterns
- **Zero Crossing Rate**: Voice vs. silence detection

### Speaker Identification

1. When you speak, the system records your audio
2. It extracts your voice features from the recording
3. Compares your features with all stored voice profiles
4. Finds the best match (requires 60% similarity threshold)
5. Displays your name if identified, or "Unknown speaker" if not

### Adding Multiple Users

- Click the **"Add Voice Profile"** button (bottom-right corner)
- Each person goes through the enrollment process
- The system can then identify different speakers automatically

## Browser Compatibility

### Fully Supported:
- ✅ Chrome
- ✅ Microsoft Edge
- ✅ Safari

### Not Supported:
- ❌ Firefox (Web Speech API not available)

## Technical Details

### Files Created/Modified:

1. **Database**:
   - `supabase/migrations/20250126_create_voice_profiles.sql` - Database schema

2. **Voice Biometrics**:
   - `src/utils/voiceBiometrics.ts` - Voice feature extraction and matching

3. **Components**:
   - `src/components/VoiceEnrollment.tsx` - Enrollment wizard
   - `src/components/VoiceInput.tsx` - Updated with biometric identification
   - `src/components/ChatMessage.tsx` - Updated to display speaker names
   - `src/components/ChatInterface.tsx` - Updated to handle speaker info

4. **Pages**:
   - `src/pages/Index.tsx` - Main page with enrollment flow

### Privacy & Security Notes:

- Voice features (not audio recordings) are stored in the database
- Only mathematical representations of voice characteristics are saved
- The actual audio is not stored permanently
- All processing happens in the browser
- Voice data stays in your Supabase database

## Troubleshooting

### "No voice profiles found" message:
- Make sure you've run the database migration (Step 1)
- Check that the `voice_profiles` table exists in Supabase

### Speaker not being identified:
- The similarity threshold is 60% - may need adjustment
- Record in a quiet environment during enrollment
- Speak clearly and at normal volume
- Try re-enrolling your voice profile

### Microphone permission denied:
- Check browser permissions for microphone access
- Make sure no other application is using the microphone

### Speech recognition errors:
- Use a supported browser (Chrome, Edge, Safari)
- Check your internet connection (speech recognition uses cloud services)
- Ensure microphone is working properly

## Future Enhancements

Possible improvements to consider:

1. **Multiple enrollment samples per user** for better accuracy
2. **Voice profile management UI** to view/delete profiles
3. **Adaptive learning** to improve recognition over time
4. **Confidence scores** displayed to users
5. **Audio quality detection** to warn about poor recording conditions

## Support

If you encounter issues:
1. Check the browser console for error messages
2. Verify the database migration was successful
3. Test microphone access in browser settings
4. Ensure you're using a supported browser
