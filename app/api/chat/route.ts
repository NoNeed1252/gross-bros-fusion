import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { PERSONALITY_TRAITS } from '@/lib/gross-bros';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { messages, model, systemPrompt, species } = body;
    const selectedModel = model || 'meta-llama/llama-3.1-8b-instruct';

    console.log("Attempting OpenRouter fetch for model:", selectedModel);

    // Dynamic Personality Resolution
    let activeSystemPrompt = systemPrompt;

    if (species) {
      try {
        const { data, error } = await supabase
          .from('bro_personalities')
          .select('system_prompt')
          .eq('species', species)
          .single();

        if (data && !error) {
          activeSystemPrompt = data.system_prompt;
          console.log(`Resolved personality for ${species} from Supabase`);
        } else {
          // Fallback to hardcoded traits if not in Supabase
          const fallback = (PERSONALITY_TRAITS as any)[species];
          if (fallback) {
            activeSystemPrompt = fallback.prompt;
            console.log(`Species ${species} not in Supabase, using hardcoded fallback`);
          }
        }
      } catch (dbErr) {
        console.error("Supabase fetch failed, falling back to provided prompt:", dbErr);
      }
    }

    // Inject system prompt if resolved or provided
    const finalMessages = activeSystemPrompt 
      ? [{ role: 'system', content: activeSystemPrompt }, ...messages]
      : messages;

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + process.env.OPENROUTER_API_KEY,
        "HTTP-Referer": "https://grossbros.vercel.app",
        "X-Title": "Gross Bros Fusion Portal"
      },
      body: JSON.stringify({
        model: selectedModel,
        messages: finalMessages,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("OpenRouter API Error:", response.status, errorText);
      return NextResponse.json({ error: "OpenRouter error: " + response.status }, { status: response.status });
    }

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content || "Bleh... neural link failed.";
    return NextResponse.json({ text });

  } catch (error) {
    console.error("Runtime fetch error:", error);
    return NextResponse.json({ error: "Server-side connection failure" }, { status: 500 });
  }
}