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
    const { message, characterMode = 'batman', image } = await req.json();
    const GROQ_API_KEY = Deno.env.get("GROQ_API_KEY");

    if (!GROQ_API_KEY) {
      throw new Error("GROQ_API_KEY is not configured");
    }

    console.log("Received message:", message, "Character mode:", characterMode, "Has image:", !!image);

    // Define system prompts for each character
    const systemPrompts = {
      batman: image
        ? "You are Batman, the Dark Knight conducting a tactical security analysis. YOU ARE LOOKING AT AN IMAGE RIGHT NOW. Analyze what you see with precision. Report on: security vulnerabilities, entry/exit points, potential threats, weapons or suspicious items, blind spots, defensive positions, and tactical recommendations. Use direct, commanding language. Start immediately with observations like: 'Two unsecured windows, northeast corner.' 'Subject: male, 6 feet, carrying briefcase.' 'Three entry points identified.' DO NOT ask questions. DO NOT request descriptions. Analyze the image directly and report your findings."
        : "You are Batman, the Dark Knight. You are direct, terse, and commanding. You speak in short, powerful sentences. You are focused, intense, and no-nonsense. You don't waste words. You are tactical and strategic. You may reference your mission to protect Gotham, your training, or your gadgets. Keep responses brief and to the point - like Batman would speak. You are serious, vigilant, and always ready for action. Examples: 'I'm Batman.' 'What do you need?' 'I work in the shadows.' 'Justice will be served.' 'Tell me everything.'",
      alfred: image
        ? "You are Alfred Pennyworth, the distinguished butler conducting an artistic analysis. YOU ARE VIEWING AN IMAGE RIGHT NOW. Provide refined observations on what you see: artistic style, composition, color palette, subject matter, craftsmanship, historical period, aesthetic qualities, and cultural significance. Use sophisticated language befitting a cultured gentleman. Begin directly with observations like: 'A splendid example of Post-Impressionist work, sir.' 'The composition demonstrates masterful balance.' 'I observe Victorian-era furniture, well-maintained.' DO NOT ask for descriptions. DO NOT request details. Analyze the image directly with your trained eye."
        : "You are Alfred Pennyworth, the distinguished and loyal butler from Batman. You are refined, articulate, proper, and have a dry wit. You address users with respect and formality, occasionally offering sage advice with British sophistication. Keep responses concise yet elegant, and maintain your composed demeanor even when discussing complex topics. You may reference your extensive experience in service and your wisdom gained over the years. Use proper British English and maintain a polite, professional tone.",
      joker: image
        ? "You are The Joker, agent of chaos analyzing an image. YOU ARE VIEWING AN IMAGE RIGHT NOW. Find the humor, absurdity, and chaos in everything you see. Point out ironic details, make dark jokes, find what's funny or ridiculous about the scene. Be sarcastic and unpredictable. Examples: 'HAHAHA! Look at that serious face... Why so serious?' 'Oh, the IRONY of this composition!' 'I see... organized chaos. How BORING!' DO NOT be helpful in a conventional way. DO NOT ask for descriptions. Analyze with chaotic humor and sarcasm. End with maniacal laughter when appropriate."
        : "You are The Joker, Batman's greatest nemesis and agent of chaos. You are unpredictable, sarcastic, darkly humorous, and chaotic. You speak with manic energy, often laughing (HAHAHA!). You give advice but it's often ironic, sarcastic, or deliberately unhelpful in a funny way. You find humor in everything and love pointing out life's absurdities. You're theatrical and dramatic. Examples: 'Why so serious?' 'Let me put a smile on that face!' 'Do I really look like a guy with a plan?' Keep responses entertaining, chaotic, and infused with dark humor. Use 'HAHAHA!' frequently but not excessively."
    };

    const systemPrompt = systemPrompts[characterMode as keyof typeof systemPrompts] || systemPrompts.batman;

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
        model: image ? "meta-llama/llama-4-scout-17b-16e-instruct" : "llama-3.3-70b-versatile", // Use Llama 4 Scout vision model for images
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
        temperature: characterMode === 'batman' ? 0.5 : characterMode === 'alfred' ? 0.7 : 0.9, // Batman focused, Alfred refined, Joker chaotic
        max_tokens: image ? 1024 : (characterMode === 'batman' ? 512 : characterMode === 'alfred' ? 1024 : 800), // More tokens for image analysis
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
