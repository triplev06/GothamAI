# Deploying AI Character Switching to Supabase

## Option 1: Using Supabase CLI (Recommended)

### Prerequisites
1. Make sure you have Supabase CLI installed
2. Make sure you're logged in to Supabase CLI

### Steps:

1. **Open your terminal in the project directory**
   ```bash
   cd C:\Users\Veges\OneDrive\Documents\GitHub\digital-whisperer-ai
   ```

2. **Login to Supabase (if not already logged in)**
   ```bash
   supabase login
   ```
   - This will open a browser window to authenticate

3. **Link your project (if not already linked)**
   ```bash
   supabase link --project-ref YOUR_PROJECT_REF
   ```
   - Replace `YOUR_PROJECT_REF` with your actual Supabase project reference
   - You can find this in your Supabase dashboard URL: `https://supabase.com/dashboard/project/YOUR_PROJECT_REF`

4. **Deploy the chat function**
   ```bash
   supabase functions deploy chat
   ```
   - This will upload the updated Edge Function to Supabase
   - Wait for it to complete (should take 10-30 seconds)

5. **Verify deployment**
   ```bash
   supabase functions list
   ```
   - You should see the `chat` function listed with a recent deployment time

---

## Option 2: Using Supabase Dashboard (Manual)

### Steps:

1. **Go to Supabase Dashboard**
   - Navigate to: https://supabase.com/dashboard
   - Select your project

2. **Open Edge Functions**
   - In the left sidebar, click on "Edge Functions"

3. **Find the `chat` function**
   - You should see a function named `chat` in the list

4. **Update the function code**
   - Click on the `chat` function
   - Click "Edit Function" or similar button
   - Copy the entire contents from: `supabase/functions/chat/index.ts`
   - Paste it into the editor
   - Click "Save" or "Deploy"

5. **Verify it's working**
   - Check the deployment status shows as "Active"
   - The version number should increment

---

## Option 3: Push via Git (if using Supabase Git Integration)

### Steps:

1. **Commit your changes**
   ```bash
   git add supabase/functions/chat/index.ts
   git commit -m "Update chat function to support Batman and Alfred AI modes"
   git push origin main
   ```

2. **Check Supabase Dashboard**
   - If you have Git integration enabled, it should auto-deploy
   - Go to Edge Functions and verify the deployment

---

## Verification Steps

After deploying, test both modes:

### Test Batman Mode:
1. Switch to Batman theme in your app
2. Send a message like: "Hello, who are you?"
3. Expected response: Short, direct, commanding (e.g., "I'm Batman.")

### Test Alfred Mode:
1. Switch to Alfred theme in your app
2. Send a message like: "Hello, who are you?"
3. Expected response: Polite, sophisticated (e.g., "Good day, sir. I am Alfred Pennyworth, at your service.")

---

## Troubleshooting

### If deployment fails:

1. **Check if you're logged in**
   ```bash
   supabase projects list
   ```
   - This should show your projects

2. **Check if project is linked**
   ```bash
   supabase status
   ```
   - Should show your project info

3. **Check function logs**
   ```bash
   supabase functions logs chat
   ```
   - This shows any errors from the function

4. **Verify GROQ_API_KEY is set**
   - In Supabase Dashboard → Edge Functions → chat → Settings
   - Make sure `GROQ_API_KEY` secret is configured

### Common Issues:

**"Not logged in" error:**
```bash
supabase login
```

**"Project not linked" error:**
```bash
supabase link --project-ref YOUR_PROJECT_REF
```

**"Function not found" error:**
- Make sure you're in the correct directory
- Check that `supabase/functions/chat/index.ts` exists

---

## Quick Deploy Command (All-in-One)

If everything is already set up, just run:
```bash
supabase functions deploy chat
```

That's it! The AI should now switch personalities based on the theme.
