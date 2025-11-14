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
    const { message, characterMode = 'batman', image, stream = true, disableTools = false, userId = 'anonymous' } = await req.json();
    const GROQ_API_KEY = Deno.env.get("GROQ_API_KEY");

    if (!GROQ_API_KEY) {
      throw new Error("GROQ_API_KEY is not configured");
    }

    // Initialize Supabase client for memory storage
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

    console.log("Received message:", message, "Character mode:", characterMode, "Has image:", !!image, "Stream:", stream, "Disable tools:", disableTools, "User:", userId);

    // Define available tools/functions
    const tools = [
      {
        type: "function",
        function: {
          name: "get_current_time",
          description: "Get the current time and date",
          parameters: {
            type: "object",
            properties: {},
            required: []
          }
        }
      },
      {
        type: "function",
        function: {
          name: "calculate",
          description: "Perform a mathematical calculation",
          parameters: {
            type: "object",
            properties: {
              expression: {
                type: "string",
                description: "The mathematical expression to evaluate (e.g., '15% of 47', '2 + 2', '15 * 3.5')"
              }
            },
            required: ["expression"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "get_weather",
          description: "Get the current weather for a location (simulated)",
          parameters: {
            type: "object",
            properties: {
              location: {
                type: "string",
                description: "The city name (e.g., 'Gotham', 'New York', 'London')"
              }
            },
            required: ["location"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "web_search",
          description: "Search the web for current information, news, facts, or real-time data. Use this when the user asks about recent events, current information, or things you don't know.",
          parameters: {
            type: "object",
            properties: {
              query: {
                type: "string",
                description: "The search query (e.g., 'latest Batman movie', 'current events in Gotham', 'who is the Joker')"
              }
            },
            required: ["query"]
          }
        }
      }
    ];

    // Tool execution functions
    const executeTool = async (toolName: string, args: any) => {
      switch (toolName) {
        case "get_current_time":
          const now = new Date();
          return `Current time: ${now.toLocaleTimeString()}, Date: ${now.toLocaleDateString()}`;

        case "calculate":
          try {
            // Safe eval for basic math
            const expression = args.expression.toLowerCase()
              .replace(/(\d+)%\s*of\s*(\d+)/g, '($1/100)*$2')
              .replace(/[^0-9+\-*/().\s]/g, '');
            const result = Function(`'use strict'; return (${expression})`)();
            return `Result: ${result}`;
          } catch (e) {
            return `Error: Invalid mathematical expression`;
          }

        case "get_weather":
          // Simulated weather data
          const weathers = ["Cloudy", "Rainy", "Sunny", "Stormy", "Foggy"];
          const temps = [15, 18, 22, 25, 28];
          const location = args.location;
          const weather = weathers[Math.floor(Math.random() * weathers.length)];
          const temp = temps[Math.floor(Math.random() * temps.length)];
          return `Weather in ${location}: ${weather}, ${temp}°C`;

        case "web_search":
          try {
            // Use DuckDuckGo Instant Answer API (free, no API key needed)
            const searchQuery = encodeURIComponent(args.query);
            const ddgResponse = await fetch(`https://api.duckduckgo.com/?q=${searchQuery}&format=json&no_html=1&skip_disambig=1`);
            const ddgData = await ddgResponse.json();

            // Extract useful information
            let searchResult = "";
            if (ddgData.Abstract) {
              searchResult += `Summary: ${ddgData.Abstract}\n`;
            }
            if (ddgData.AbstractText) {
              searchResult += `${ddgData.AbstractText}\n`;
            }
            if (ddgData.RelatedTopics && ddgData.RelatedTopics.length > 0) {
              searchResult += `\nRelated topics:\n`;
              ddgData.RelatedTopics.slice(0, 3).forEach((topic: any) => {
                if (topic.Text) {
                  searchResult += `- ${topic.Text}\n`;
                }
              });
            }

            if (searchResult) {
              return `Web search results for "${args.query}":\n${searchResult}`;
            } else {
              return `Web search completed for "${args.query}". No instant answers found, but the information may be available through more specific queries.`;
            }
          } catch (e) {
            return `Web search error: Unable to fetch results for "${args.query}". Please try a different query.`;
          }

        default:
          return "Unknown tool";
      }
    };

    // Define system prompts for each character
    const systemPrompts = {
      batman: image
        ? "You are Batman, the Dark Knight conducting advanced tactical analysis. YOU ARE LOOKING AT AN IMAGE RIGHT NOW with computer vision capabilities. Perform comprehensive analysis:\n\n1. OBJECT DETECTION: Count and identify ALL objects, people, vehicles, weapons\n2. FACE DETECTION: Count faces, describe individuals (age, gender, clothing, position)\n3. TEXT RECOGNITION (OCR): Read ALL visible text - signs, labels, documents, screens\n4. THREAT ASSESSMENT: Security vulnerabilities, entry/exit points, blind spots\n5. TACTICAL INTEL: Defensive positions, escape routes, strategic advantages\n\nReport format:\n- Object count: 'X people detected, Y objects identified'\n- Text found: 'Sign reads: [text]' or 'Document contains: [text]'\n- Faces: 'Individual 1: male, approx 30 years, blue shirt, left side'\n- Threats: 'Unsecured window, northeast corner'\n\nBe precise. Use numbers. Read ALL text. Count EVERYTHING. DO NOT ask questions."
        : "You are Batman, the Dark Knight. You are direct, terse, and commanding. You speak in short, powerful sentences. You are focused, intense, and no-nonsense. You don't waste words. You are tactical and strategic. You may reference your mission to protect Gotham, your training, or your gadgets. Keep responses brief and to the point - like Batman would speak. You are serious, vigilant, and always ready for action. Examples: 'I'm Batman.' 'What do you need?' 'I work in the shadows.' 'Justice will be served.' 'Tell me everything.'",
      alfred: image
        ? "You are Alfred Pennyworth with refined artistic vision. YOU ARE VIEWING AN IMAGE RIGHT NOW with sophisticated analysis capabilities. Provide comprehensive observations:\n\n1. ARTISTIC ANALYSIS: Style, composition, color theory, technique\n2. OBJECT IDENTIFICATION: Count and describe all items with cultured detail\n3. TEXT READING (OCR): Read any visible writing, inscriptions, or labels with proper diction\n4. FACIAL OBSERVATION: Count individuals, note their attire and demeanor\n5. CULTURAL CONTEXT: Historical period, artistic movement, significance\n\nPresent findings elegantly:\n- 'I count three individuals, sir, each in Victorian attire'\n- 'The inscription reads: [exact text]'\n- 'Seven objects of note: a mahogany desk, oil lamp...'\n- 'Post-Impressionist technique, circa 1890s'\n\nBe thorough yet refined. Count precisely. Read all text. DO NOT request clarification."
        : "You are Alfred Pennyworth, the distinguished and loyal butler from Batman. You are refined, articulate, proper, and have a dry wit. You address users with respect and formality, occasionally offering sage advice with British sophistication. Keep responses concise yet elegant, and maintain your composed demeanor even when discussing complex topics. You may reference your extensive experience in service and your wisdom gained over the years. Use proper British English and maintain a polite, professional tone.",
      joker: image
        ? "You are The Joker with chaotic vision capabilities. YOU ARE VIEWING AN IMAGE RIGHT NOW. Apply your twisted analysis:\n\n1. CHAOS COUNTING: Count people/objects but make it ABSURD - 'I see 5 fools and 3 boring chairs!'\n2. FACE DETECTION: Describe people with dark humor - 'Guy #1: So serious, needs a smile!'\n3. TEXT READING (OCR): Read signs/text but mock them - 'Sign says STOP... BORING!'\n4. IRONY DETECTION: Find what's funny, contradictory, or ridiculous\n5. ENTROPY ANALYSIS: Point out order (disgusting) vs chaos (beautiful)\n\nFormat with CHAOS:\n- 'HAHAHA! I count 4 serious faces - WHY SO SERIOUS?'\n- 'The sign reads: [text] - How PREDICTABLE!'\n- 'Object inventory: 6 boring things and ZERO fun!'\n- 'Person 1: Frowning, needs makeup. Person 2: Also sad!'\n\nBe specific but CHAOTIC. Count things. Read text. Make it FUNNY. HAHAHA!"
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

    // Streaming and tools are mutually exclusive - when streaming is requested, prioritize it
    const enableStreaming = stream;
    const enableTools = !stream && !image && !disableTools;

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
        stream: enableStreaming, // Enable streaming when requested (disables tools)
        tools: enableTools ? tools : undefined, // Enable tools only when not streaming, not images, and not explicitly disabled
        tool_choice: enableTools ? "auto" : undefined, // Let AI decide when to use tools
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

    // Handle streaming responses
    if (enableStreaming && response.body) {
      console.log("Streaming response enabled");

      const encoder = new TextEncoder();
      const decoder = new TextDecoder();
      let fullResponse = ''; // Collect full response for memory storage

      const stream = new ReadableStream({
        async start(controller) {
          const reader = response.body!.getReader();

          try {
            while (true) {
              const { done, value } = await reader.read();

              if (done) {
                // Send completion signal
                controller.enqueue(encoder.encode("data: [DONE]\n\n"));
                controller.close();

                // Store memory after stream completes (for non-council mode)
                if (characterMode !== 'council' && supabase && fullResponse) {
                  storeMemory(supabase, userId, characterMode, message, fullResponse)
                    .catch(err => console.error('Error storing streamed memory:', err));
                }

                break;
              }

              // Decode the chunk
              const chunk = decoder.decode(value, { stream: true });
              const lines = chunk.split('\n');

              for (const line of lines) {
                if (line.startsWith('data: ')) {
                  const data = line.slice(6); // Remove 'data: ' prefix

                  if (data === '[DONE]') {
                    controller.enqueue(encoder.encode("data: [DONE]\n\n"));
                    continue;
                  }

                  try {
                    const parsed = JSON.parse(data);
                    const content = parsed.choices?.[0]?.delta?.content;

                    if (content) {
                      fullResponse += content; // Collect for memory storage

                      // Transform to frontend format: data: {"content":"text"}\n\n
                      const message = `data: ${JSON.stringify({ content })}\n\n`;
                      controller.enqueue(encoder.encode(message));
                    }
                  } catch (e) {
                    // Skip invalid JSON
                    console.error("Failed to parse SSE chunk:", e);
                  }
                }
              }
            }
          } catch (error) {
            console.error("Stream error:", error);
            controller.error(error);
          }
        }
      });

      return new Response(stream, {
        headers: {
          ...corsHeaders,
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          "Connection": "keep-alive",
        },
      });
    }

    // All non-streaming responses to support function calling
    const data = await response.json();
    console.log("AI response received");

    const choice = data.choices[0];
    const aiMessage = choice.message;

    // Check if AI wants to call a function
    if (aiMessage.tool_calls && aiMessage.tool_calls.length > 0) {
      console.log("Function call detected:", aiMessage.tool_calls);

      // Execute all tool calls
      const toolResults = await Promise.all(
        aiMessage.tool_calls.map(async (toolCall: any) => {
          const toolName = toolCall.function.name;
          const toolArgs = JSON.parse(toolCall.function.arguments);
          const toolResult = await executeTool(toolName, toolArgs);

          return {
            tool_call_id: toolCall.id,
            role: "tool",
            name: toolName,
            content: toolResult
          };
        })
      );

      // Make a second API call with tool results
      const followUpResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
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
              content: systemPrompt
            },
            {
              role: "user",
              content: message
            },
            aiMessage,
            ...toolResults
          ],
          temperature: characterMode === 'batman' ? 0.5 : characterMode === 'alfred' ? 0.7 : 0.9,
          max_tokens: characterMode === 'batman' ? 512 : characterMode === 'alfred' ? 1024 : 800,
        }),
      });

      if (!followUpResponse.ok) {
        throw new Error(`Groq API follow-up error: ${followUpResponse.status}`);
      }

      const followUpData = await followUpResponse.json();
      const finalResponse = followUpData.choices[0].message.content;

      // Store memory for non-council mode
      if (characterMode !== 'council' && supabase) {
        await storeMemory(supabase, userId, characterMode, message, finalResponse);
      }

      return new Response(
        JSON.stringify({
          response: finalResponse
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Regular response (no function calls)
    const finalResponse = aiMessage.content;

    // Store memory for non-council mode
    if (characterMode !== 'council' && supabase) {
      await storeMemory(supabase, userId, characterMode, message, finalResponse);
    }

    return new Response(
      JSON.stringify({
        response: finalResponse
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

// Helper function to store conversation memories
async function storeMemory(supabase: any, userId: string, characterMode: string, userMessage: string, aiResponse: string) {
  try {
    // Calculate importance score (simple heuristic: longer messages = more important)
    const messageLength = userMessage.length + aiResponse.length;
    const importanceScore = Math.min(1.0, messageLength / 500); // Cap at 1.0

    const { error } = await supabase
      .from('conversation_memories')
      .insert({
        user_id: userId,
        character_mode: characterMode,
        user_message: userMessage,
        ai_response: aiResponse,
        importance_score: importanceScore,
      });

    if (error) {
      console.error('Error storing memory:', error);
    } else {
      console.log(`Memory stored for ${characterMode} - user: ${userId}`);
    }

    // Every 5 conversations, trigger profile update (async, don't wait)
    const { count } = await supabase
      .from('conversation_memories')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('character_mode', characterMode);

    if (count && count % 5 === 0) {
      console.log(`Triggering profile update for ${characterMode} after ${count} conversations`);
      // Trigger update-profile function (fire and forget)
      const supabaseUrl = Deno.env.get('SUPABASE_URL');
      const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');

      if (supabaseUrl && supabaseAnonKey) {
        fetch(`${supabaseUrl}/functions/v1/update-profile`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseAnonKey}`,
          },
          body: JSON.stringify({ userId, characterMode }),
        }).catch(err => console.error('Error triggering profile update:', err));
      }
    }
  } catch (error) {
    console.error('Error in storeMemory:', error);
  }
}
