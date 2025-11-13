# Migration to Your Own Infrastructure 🚀

This guide will help you complete the migration from Lovable's infrastructure to your own Supabase project with Groq AI.

## ✅ Already Completed

- ✅ Updated `.env` with new Supabase credentials
- ✅ Updated `.env` with Groq API key
- ✅ Modified chat function to use Groq instead of Lovable AI Gateway

## 🎯 Remaining Steps

### Step 1: Apply Database Migration

You need to create the `voice_profiles` table in your new Supabase project.

1. Go to **https://supabase.com/dashboard/project/mfvacdccybqhorngfcxv/editor**
2. Click **SQL Editor** in the left sidebar
3. Click **New Query**
4. Copy and paste this SQL:

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

5. Click **Run** (or press Ctrl+Enter)
6. Verify you see "Success. No rows returned"

### Step 2: Deploy Chat Function to Supabase

You need to deploy the chat function to your Supabase Edge Functions.

#### Option A: Using Supabase CLI (Recommended)

1. **Install Supabase CLI** (if not already installed):
   ```bash
   npm install -g supabase
   ```

2. **Login to Supabase**:
   ```bash
   supabase login
   ```

3. **Link to your project**:
   ```bash
   supabase link --project-ref mfvacdccybqhorngfcxv
   ```

4. **Set the Groq API key as a secret**:
   ```bash
   supabase secrets set GROQ_API_KEY=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
   ```

5. **Deploy the chat function**:
   ```bash
   supabase functions deploy chat
   ```

#### Option B: Manual Deployment via Dashboard

1. Go to **https://supabase.com/dashboard/project/mfvacdccybqhorngfcxv/functions**
2. Click **Create a new function**
3. Name it: `chat`
4. Copy the contents of `supabase/functions/chat/index.ts` into the editor
5. Click **Deploy function**

6. **Set the environment variable**:
   - Go to **https://supabase.com/dashboard/project/mfvacdccybqhorngfcxv/settings/functions**
   - Add a new secret:
     - Name: `GROQ_API_KEY`
     - Value: `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`
   - Click **Add secret**

### Step 3: Test Your Setup

1. **Start your development server**:
   ```bash
   npm run dev
   ```

2. **Test the application**:
   - Open your browser to the local URL
   - You should see the voice enrollment wizard (if no profiles exist)
   - Try sending a text message to Alfred or The Dark Knight
   - Try using voice input

3. **Verify it works**:
   - Alfred/Batman should respond using Groq's Llama model
   - Voice profiles should be saved to your new Supabase database
   - Check browser console for any errors

## 🔧 Troubleshooting

### "GROQ_API_KEY is not configured" error

**Solution**: Make sure you've set the Groq API key as a secret in Supabase:
```bash
supabase secrets set GROQ_API_KEY=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
```

### "relation 'voice_profiles' does not exist" error

**Solution**: Run the database migration SQL (Step 1 above)

### Chat function not responding

**Solutions**:
1. Check that the function is deployed: https://supabase.com/dashboard/project/mfvacdccybqhorngfcxv/functions
2. Check function logs for errors
3. Verify GROQ_API_KEY is set in secrets

### Voice enrollment not working

**Solutions**:
1. Make sure the database migration was applied
2. Check browser console for errors
3. Verify you've allowed microphone permissions

## 📊 What Changed?

### Environment Variables (`.env`)
- ✅ Supabase URL: Updated to your project
- ✅ Supabase anon key: Updated to your project
- ✅ Added Groq API key

### Chat Function (`supabase/functions/chat/index.ts`)
- ✅ Changed from Lovable AI Gateway → Groq API
- ✅ Changed model from `gemini-2.5-flash` → `llama-3.3-70b-versatile`
- ✅ Using your Groq API key

### Database
- ✅ Migration ready for `voice_profiles` table
- 🔄 Needs to be applied to new Supabase project

## 🎉 Benefits of This Setup

1. **No Lovable dependency** - You own all the infrastructure
2. **Groq is fast** - Lightning-fast inference (often sub-second responses)
3. **Free tier** - Generous free tier with Groq
4. **Your own database** - Full control over data
5. **Open source model** - Using Llama 3.3 70B

## 📝 Available Groq Models

You can change the model in `supabase/functions/chat/index.ts` (line 30):

- `llama-3.3-70b-versatile` ⭐ (Current - Best quality & speed)
- `llama-3.1-70b-versatile` (Alternative high-quality)
- `mixtral-8x7b-32768` (Large context window)
- `gemma2-9b-it` (Smaller, faster)

## 🔒 Security Notes

- Your Groq API key is stored as a Supabase secret (encrypted)
- Voice biometric data stays in your Supabase database
- All API keys are kept secure in environment variables
- Remember to keep your `.env` file out of version control (already in `.gitignore`)

## ✨ Next Steps

After completing the migration:

1. Test voice enrollment and identification
2. Test chat functionality with Groq
3. Consider adding rate limiting if needed
4. Monitor your Groq usage at https://console.groq.com

---

**Need help?** Check the function logs in your Supabase dashboard or review the browser console for errors.
