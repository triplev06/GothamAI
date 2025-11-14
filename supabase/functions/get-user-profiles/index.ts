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
    const { userId } = await req.json();

    if (!userId) {
      throw new Error("userId is required");
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log("Fetching user profiles for:", userId);

    // Fetch all profiles for this user
    const { data: profiles, error } = await supabase
      .from('character_profiles')
      .select('*')
      .eq('user_id', userId);

    if (error) {
      console.error("Error fetching profiles:", error);
      throw error;
    }

    // Create a map of existing profiles
    const profileMap = new Map();
    if (profiles) {
      profiles.forEach((profile: any) => {
        profileMap.set(profile.character_mode, profile);
      });
    }

    // Ensure all characters have a profile
    const characters = ['batman', 'alfred', 'joker'];
    const allProfiles = [];

    for (const character of characters) {
      if (profileMap.has(character)) {
        allProfiles.push(profileMap.get(character));
      } else {
        // Create initial profile
        const initialProfile = {
          user_id: userId,
          character_mode: character,
          profile_summary: getInitialSummary(character),
          case_file: character === 'batman' ? { threats: [], missions: [], patterns: [] } : {},
          personal_notes: character === 'alfred' ? { preferences: [], routines: [], observations: [] } : {},
          chaos_profile: character === 'joker' ? { jokes_shared: [], triggers: [], humor_style: [] } : {},
          conversation_count: 0,
          last_updated: new Date().toISOString(),
        };

        // Insert the initial profile
        const { data: newProfile, error: insertError } = await supabase
          .from('character_profiles')
          .insert(initialProfile)
          .select()
          .single();

        if (insertError) {
          console.error(`Error creating ${character} profile:`, insertError);
        } else {
          allProfiles.push(newProfile);
        }
      }
    }

    return new Response(
      JSON.stringify({ profiles: allProfiles }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in get-user-profiles function:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

function getInitialSummary(character: string): string {
  switch (character) {
    case 'batman':
      return "NEW CONTACT - CASE FILE INITIATED\n\nSubject: Unknown civilian\nThreat Level: Undetermined\nStatus: Under observation\n\nInitial assessment pending. Gathering intelligence...";
    case 'alfred':
      return "New Acquaintance - Personal File\n\nI have just been introduced to this individual. As with all new acquaintances of Master Wayne, I shall maintain detailed observations to ensure proper service and understanding of their preferences.\n\nInitial impressions to follow...";
    case 'joker':
      return "HAHAHA! A New Playmate!\n\nOooh, someone new to have FUN with! Let's see what makes them tick... or BOOM! HAHAHA!\n\nChaos Level: To be determined\nFun Factor: Unknown (but I'm OPTIMISTIC!)\n\nLet the games begin! 🃏";
    default:
      return "Profile initialized.";
  }
}
