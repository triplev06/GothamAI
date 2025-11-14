import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userId, characterMode } = await req.json();

    if (!userId || !characterMode) {
      throw new Error("userId and characterMode are required");
    }

    const GROQ_API_KEY = Deno.env.get("GROQ_API_KEY");
    if (!GROQ_API_KEY) {
      throw new Error("GROQ_API_KEY is not configured");
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log(`Updating profile for ${characterMode} - user: ${userId}`);

    // Get current profile
    const { data: currentProfile, error: profileError } = await supabase
      .from('character_profiles')
      .select('*')
      .eq('user_id', userId)
      .eq('character_mode', characterMode)
      .single();

    if (profileError) {
      console.error("Error fetching current profile:", profileError);
      throw profileError;
    }

    // Get recent memories (last 20 conversations)
    const { data: memories, error: memoriesError } = await supabase
      .from('conversation_memories')
      .select('*')
      .eq('user_id', userId)
      .eq('character_mode', characterMode)
      .order('created_at', { ascending: false })
      .limit(20);

    if (memoriesError) {
      console.error("Error fetching memories:", memoriesError);
      throw memoriesError;
    }

    if (!memories || memories.length === 0) {
      console.log("No memories to analyze yet");
      return new Response(
        JSON.stringify({ message: "No conversations to analyze yet" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Format memories for AI analysis
    const conversationHistory = memories
      .reverse()
      .map((m: any) => `User: ${m.user_message}\n${characterMode.toUpperCase()}: ${m.ai_response}`)
      .join('\n\n');

    // Create character-specific analysis prompts
    const analysisPrompt = getAnalysisPrompt(characterMode, currentProfile.profile_summary, conversationHistory);

    // Call AI to analyze and update profile
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          {
            role: "system",
            content: analysisPrompt
          },
          {
            role: "user",
            content: "Analyze these conversations and update the profile."
          }
        ],
        temperature: 0.7,
        max_tokens: 1500,
      }),
    });

    if (!response.ok) {
      throw new Error(`Groq API error: ${response.status}`);
    }

    const data = await response.json();
    const updatedSummary = data.choices[0].message.content;

    // Update the profile in database
    const { data: updatedProfile, error: updateError } = await supabase
      .from('character_profiles')
      .update({
        profile_summary: updatedSummary,
        conversation_count: currentProfile.conversation_count + memories.length,
        last_updated: new Date().toISOString(),
      })
      .eq('user_id', userId)
      .eq('character_mode', characterMode)
      .select()
      .single();

    if (updateError) {
      console.error("Error updating profile:", updateError);
      throw updateError;
    }

    console.log(`Profile updated successfully for ${characterMode}`);

    return new Response(
      JSON.stringify({ profile: updatedProfile }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in update-profile function:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

function getAnalysisPrompt(character: string, currentSummary: string, conversations: string): string {
  const baseInstructions = `You are analyzing conversations to update a user profile from ${character.toUpperCase()}'s perspective.

Current Profile:
${currentSummary}

Recent Conversations:
${conversations}

Based on these conversations, write an UPDATED profile summary. Keep the character's voice and perspective.`;

  switch (character) {
    case 'batman':
      return `${baseInstructions}

You are BATMAN building a CASE FILE. Format your response as:

SUBJECT: [Name if mentioned, otherwise "Civilian Contact"]
THREAT LEVEL: [Low/Medium/High - based on conversations]
STATUS: [Active/Monitored/Ally]

OBSERVED PATTERNS:
- [List behavioral patterns, interests, concerns]

NOTABLE INTERACTIONS:
- [Key topics discussed, questions asked]

TACTICAL ASSESSMENT:
- [Skills, knowledge areas, potential value to mission]

CONCERNS/FLAGS:
- [Any security concerns or things to monitor]

Be direct, tactical, and observant. You're building intelligence.`;

    case 'alfred':
      return `${baseInstructions}

You are ALFRED PENNYWORTH maintaining a personal diary about this individual. Format your response as:

Personal Observations - [Date]

Character Assessment:
[Refined observations about their personality, demeanor, intellect]

Preferences & Interests:
- [Topics they discuss, things they care about]

Conversational Style:
[How they communicate, their manner of speech]

Service Notes:
[How best to assist them, what they seem to value]

Personal Reflections:
[Your thoughtful observations about their development]

Be elegant, insightful, and observant in the British butler tradition.`;

    case 'joker':
      return `${baseInstructions}

You are THE JOKER building a CHAOS PROFILE! Format your response as:

🃏 CHAOS FILE: [Nickname for them]

FUN LEVEL: [Rating out of 10]
CHAOS COMPATIBILITY: [Low/Medium/HIGH!]

WHAT MAKES THEM TICK:
- [Their buttons to push, what they care about]

JOKES & HUMOR:
- [What makes them laugh, their humor style]

TRIGGERS & REACTIONS:
- [How they react to chaos, surprises, absurdity]

ENTERTAINMENT VALUE:
[How fun are they to mess with? HAHAHA!]

CHAOS POTENTIAL:
[Could they appreciate a good joke? Would they dance with the devil in the pale moonlight?]

Be chaotic, darkly humorous, and entertainingly insightful. HAHAHA!`;

    default:
      return baseInstructions;
  }
}
