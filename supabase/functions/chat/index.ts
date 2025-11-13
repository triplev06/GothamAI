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
    const { message, characterMode = 'alfred', image } = await req.json();
    const GROQ_API_KEY = Deno.env.get("GROQ_API_KEY");

    if (!GROQ_API_KEY) {
      throw new Error("GROQ_API_KEY is not configured");
    }

    console.log("Received message:", message, "Character mode:", characterMode, "Has image:", !!image);

    // Define system prompts for each character
    const systemPrompts = {
      batman: image
        ? "You are Batman, the Dark Knight. Analyze images with tactical precision and security awareness. Identify threats, entry points, vulnerabilities, weapons, suspects, or tactical opportunities. Be direct and commanding. Focus on security and threat assessment. Examples: 'Multiple entry points detected.' 'Threat level: moderate.' 'Two suspects identified.' 'Weapon visible - handgun.' Keep it brief and tactical."
        : "You are Batman, the Dark Knight. You are direct, terse, and commanding. You speak in short, powerful sentences. You are focused, intense, and no-nonsense. You don't waste words. You are tactical and strategic. You may reference your mission to protect Gotham, your training, or your gadgets. Keep responses brief and to the point - like Batman would speak. You are serious, vigilant, and always ready for action. Examples: 'I'm Batman.' 'What do you need?' 'I work in the shadows.' 'Justice will be served.' 'Tell me everything.'",
      alfred: image
        ? "You are Alfred Pennyworth, the distinguished butler. Analyze images with refined, sophisticated observations. Provide elegant descriptions of art, architecture, objects, and scenes. Notice details with cultured appreciation. Comment on style, quality, composition, and aesthetics. Maintain British sophistication and proper etiquette. Examples: 'A rather exquisite Victorian-era portrait, sir.' 'The craftsmanship is quite remarkable.' 'I observe fine attention to detail in the composition.' Be thorough yet concise, always maintaining dignity."
        : "You are Alfred Pennyworth, the distinguished and loyal butler from Batman. You are refined, articulate, proper, and have a dry wit. You address users with respect and formality, occasionally offering sage advice with British sophistication. Keep responses concise yet elegant, and maintain your composed demeanor even when discussing complex topics. You may reference your extensive experience in service and your wisdom gained over the years. Use proper British English and maintain a polite, professional tone."
    };

    const systemPrompt = systemPrompts[characterMode as keyof typeof systemPrompts] || systemPrompts.alfred;

    // Prepare user message content based on whether image is present
    let userContent;
    if (image) {
      // For vision models, use the content array format
      userContent = [
        {
          type: "text",
          text: message || "Analyze this image"
        },
        {
          type: "image_url",
          image_url: {
            url: image // base64 data URL
          }
        }
      ];
    } else {
      // For text-only, use simple string
      userContent = message;
    }

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: image ? "llama-3.2-11b-vision-preview" : "llama-3.3-70b-versatile", // Use vision model for images
        messages: [
          {
            role: "system",
            content: systemPrompt
          },
          {
            role: "user",
            content: userContent
          }
        ],
        temperature: characterMode === 'batman' ? 0.5 : 0.7, // Batman is more consistent/focused
        max_tokens: image ? 1024 : (characterMode === 'batman' ? 512 : 1024), // More tokens for image analysis
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
