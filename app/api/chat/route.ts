import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { PERSONALITY_TRAITS } from '@/lib/gross-bros';
import { getMarketBriefing } from '@/lib/firstledger';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { messages, model, systemPrompt, species } = body;
    const selectedModel = model || 'meta-llama/llama-3.1-8b-instruct';
    const lastUserMessage = messages[messages.length - 1]?.content || "";

    console.log("Attempting OpenRouter fetch for model:", selectedModel);

    // Timeout helper
    const timeout = (ms: number) => new Promise<null>((resolve) => setTimeout(() => resolve(null), ms));

    /**
     * Safely fetch personality from Supabase.
     */
    const getSafePersonality = async (speciesKey: string) => {
      try {
        const query = supabase.from('bro_personalities');
        return await query
          .select('system_prompt')
          .eq('species', speciesKey)
          .single();
      } catch (e) {
        console.error("Supabase Initialization/Query Failure (Graceful Fallback):", e);
        return null;
      }
    };

    // 1. Detect if market data is actually requested (keywords or tickers)
    const marketKeywords = ['price', 'market', 'xrp', 'ticker', 'chart', 'floor', 'buy', 'sell', 'volume'];
    const isMarketRequest = marketKeywords.some(keyword => lastUserMessage.toLowerCase().includes(keyword));

    // 2. Run external lookups in parallel
    const [personalityResult, marketData] = await Promise.all([
      species ? Promise.race([getSafePersonality(species), timeout(2000)]) : Promise.resolve(null),
      isMarketRequest 
        ? Promise.race([
            getMarketBriefing().catch(e => {
              console.error("Market Data Fetch Error:", e);
              return null;
            }),
            timeout(2000)
          ])
        : Promise.resolve(null)
    ]);

    // Dynamic Personality Resolution logic
    let activeSystemPrompt = systemPrompt;
    
    if (personalityResult && 'data' in personalityResult && personalityResult.data) {
      activeSystemPrompt = personalityResult.data.system_prompt;
      console.log(`Resolved personality for ${species} from Supabase`);
    } else if (species) {
      const fallback = (PERSONALITY_TRAITS as any)[species];
      if (fallback) {
        activeSystemPrompt = fallback.prompt;
        console.log(`Using hardcoded fallback for species ${species}`);
      }
    }

    // Add brevity constraint to all system prompts
    const brevityConstraint = "CRITICAL: Keep your response extremely short (1-2 sentences max). Do not ramble.";
    activeSystemPrompt = activeSystemPrompt 
      ? `${activeSystemPrompt}\n\n${brevityConstraint}`
      : brevityConstraint;

    // 3. Conditional injection: Only include market data if it was requested
    let finalSystemPrompt = activeSystemPrompt;
    if (isMarketRequest) {
      const marketInfo = marketData || "Market data currently unavailable (neural link lag).";
      finalSystemPrompt = `${activeSystemPrompt}\n\n[MARKET DATA CONTEXT]\n${marketInfo}`;
    }

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
