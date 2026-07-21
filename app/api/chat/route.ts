import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { PERSONALITY_TRAITS } from '@/lib/gross-bros';
import { getMarketBriefing, searchFirstLedgerToken } from '@/lib/firstledger';

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

    // 1. Detect if market data or specific token price is requested
    const marketKeywords = ['price', 'market', 'xrp', 'ticker', 'chart', 'floor', 'buy', 'sell', 'volume'];
    const tickerRegex = /\$([A-Za-z0-9_]{2,10})/;
    const foundTicker = lastUserMessage.match(tickerRegex)?.[1];
    const isMarketRequest = marketKeywords.some(keyword => lastUserMessage.toLowerCase().includes(keyword)) || !!foundTicker;

    // 2. Run external lookups in parallel
    const [personalityResult, genericMarketData, specificTokenData] = await Promise.all([
      species ? Promise.race([getSafePersonality(species), timeout(2000)]) : Promise.resolve(null),
      isMarketRequest 
        ? Promise.race([getMarketBriefing().catch(() => null), timeout(2000)])
        : Promise.resolve(null),
      foundTicker
        ? Promise.race([searchFirstLedgerToken(foundTicker).catch(() => null), timeout(2000)])
        : Promise.resolve(null)
    ]);

    // Dynamic Personality Resolution logic
    let activeSystemPrompt = systemPrompt;
    
    if (personalityResult && 'data' in personalityResult && personalityResult.data) {
      activeSystemPrompt = personalityResult.data.system_prompt;
    } else if (species) {
      const fallback = (PERSONALITY_TRAITS as any)[species];
      if (fallback) {
        activeSystemPrompt = fallback.prompt;
      }
    }

    // 3. Conditional injection and personality suppression
    let finalSystemPrompt = activeSystemPrompt || "";
    
    if (foundTicker) {
        if (specificTokenData) {
            // RESOLVED: Token found via dynamic lookup
            finalSystemPrompt = `You are a high-speed Market Data Oracle. 
A user is asking for the price of $${foundTicker.toUpperCase()}. 
DATA: $${specificTokenData.ticker} is currently $${specificTokenData.price.toFixed(8)} USD (${specificTokenData.dayChangePercent.toFixed(2)}% 24h).
INSTRUCTIONS: Return only the numerical data and a brief status (e.g. "Currently $0.0045 (+5%)"). 
NO PERSONALITY. NO CONVERSATIONAL FILLER. NO MENTION OF MISSION SPECIALISTS.`;
        } else {
            // FAILED: Ticker could not be resolved
            finalSystemPrompt = `You are a high-speed Market Data Oracle.
The user asked for the price of $${foundTicker.toUpperCase()}, but this ticker could not be resolved on the XRP Ledger.
INSTRUCTIONS: Inform the user clearly that the token ticker "$${foundTicker.toUpperCase()}" is invalid or could not be found. 
NO PERSONALITY. NO CONVERSATIONAL FILLER.`;
        }
    } else if (isMarketRequest) {
        const brevityConstraint = "CRITICAL: Keep your response extremely short (1-2 sentences max). Do not ramble.";
        const marketInfo = genericMarketData || "Market data currently unavailable.";
        finalSystemPrompt = `${activeSystemPrompt}\n\n${brevityConstraint}\n\n[MARKET DATA CONTEXT]\n${marketInfo}`;
    } else {
        const brevityConstraint = "CRITICAL: Keep your response extremely short (1-2 sentences max). Do not ramble.";
        finalSystemPrompt = `${activeSystemPrompt}\n\n${brevityConstraint}`;
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
