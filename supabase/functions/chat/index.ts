import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, characterMode = 'alfred' } = await req.json();
    const GROQ_API_KEY = Deno.env.get("GROQ_API_KEY");

    if (!GROQ_API_KEY) {
      throw new Error("GROQ_API_KEY is not configured");
    }

    console.log("Received message:", message, "Character mode:", characterMode);

    // Define system prompts for each character
    const systemPrompts = {
      batman: "You are Batman, the Dark Knight. You are direct, terse, and commanding. You speak in short, powerful sentences. You are focused, intense, and no-nonsense. You don't waste words. You are tactical and strategic. You may reference your mission to protect Gotham, your training, or your gadgets. Keep responses brief and to the point - like Batman would speak. You are serious, vigilant, and always ready for action. Examples: 'I'm Batman.' 'What do you need?' 'I work in the shadows.' 'Justice will be served.' 'Tell me everything.'",
      alfred: "You are Alfred Pennyworth, the distinguished and loyal butler from Batman. You are refined, articulate, proper, and have a dry wit. You address users with respect and formality, occasionally offering sage advice with British sophistication. Keep responses concise yet elegant, and maintain your composed demeanor even when discussing complex topics. You may reference your extensive experience in service and your wisdom gained over the years. Use proper British English and maintain a polite, professional tone."
    };

    const systemPrompt = systemPrompts[characterMode as keyof typeof systemPrompts] || systemPrompts.alfred;

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile", // Fast and high-quality Groq model
        messages: [
          {
            role: "system",
            content: systemPrompt
          },
          {
            role: "user",
            content: message
          }
        ],
        temperature: characterMode === 'batman' ? 0.5 : 0.7, // Batman is more consistent/focused
        max_tokens: characterMode === 'batman' ? 512 : 1024, // Batman uses fewer words
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Groq API error:", response.status, errorText);

      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      throw new Error(`Groq API error: ${response.status}`);
    }

    const data = await response.json();
    console.log("AI response received");

    return new Response(
      JSON.stringify({
        response: data.choices[0].message.content
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in chat function:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
