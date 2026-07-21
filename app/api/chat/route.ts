import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { PERSONALITY_TRAITS } from '@/lib/gross-bros';
import { getMarketBriefing } from '@/lib/firstledger';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { messages, model, systemPrompt, species } = body;
    const selectedModel = model || 'meta-llama/llama-3.1-8b-instruct';

    console.log("Attempting OpenRouter fetch for model:", selectedModel);

    // Run external lookups in parallel with individual catch blocks to prevent Promise.all rejection
    const timeout = (ms: number) => new Promise<null>((resolve) => setTimeout(() => resolve(null), ms));

    const [personalityResult, marketData] = await Promise.all([
      species 
        ? Promise.race([
            supabase
              .from('bro_personalities')
              .select('system_prompt')
              .eq('species', species)
              .single()
              .catch(e => {
                console.error("Supabase Query/Init Error:", e);
                return null;
              }),
            timeout(2000)
          ])
        : Promise.resolve(null),
      Promise.race([
        getMarketBriefing().catch(e => {
          console.error("Market Data Fetch Error:", e);
          return null;
        }),
        timeout(2000)
      ])
    ]);

    // Dynamic Personality Resolution logic
    let activeSystemPrompt = systemPrompt;
    
    // personalityResult might be null if timed out or errored
    if (personalityResult && 'data' in personalityResult && personalityResult.data) {
      activeSystemPrompt = personalityResult.data.system_prompt;
      console.log(`Resolved personality for ${species} from Supabase`);
    } else if (species) {
      // Fallback to hardcoded traits if Supabase timed out, errored, or missing key
      const fallback = (PERSONALITY_TRAITS as any)[species];
      if (fallback) {
        activeSystemPrompt = fallback.prompt;
        console.log(`Using hardcoded fallback for species ${species}`);
      }
    }

    // Inject market data (use fallback string if timed out or errored)
    const activeMarketData = marketData || "Market data currently unavailable (neural link lag).";

    const finalSystemPrompt = activeSystemPrompt 
      ? `${activeSystemPrompt}\n\n${activeMarketData}`
      : activeMarketData;

    const finalMessages = [
      { role: 'system', content: finalSystemPrompt },
      ...messages
    ];

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