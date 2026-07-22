import { NextRequest, NextResponse } from "next/server";
import { resolveTickerToToken, getXrpPrice } from "@/lib/xrpl-oracle";
import { getSupabase, isSupabaseConfigured } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json();
    const lastMessage = messages[messages.length - 1]?.content || "";

    // 1. Ticker Parsing
    const tickerMatch = lastMessage.match(/\$[a-zA-Z0-9]+/);
    const ticker = tickerMatch ? tickerMatch[0] : null;

    let marketData = null;
    let characterContext = null;

    // 2. Data Fetching (Parallel)
    const pricePromise = ticker ? resolveTickerToToken(ticker) : getXrpPrice();
    const characterPromise = isSupabaseConfigured() 
      ? getSupabase()
          .from("bro_personalities")
          .select("*")
          .limit(1)
          .single()
      : Promise.resolve({ data: null, error: null });

    const [priceResult, characterResult] = await Promise.all([
      pricePromise,
      characterPromise
    ]);

    marketData = priceResult;
    
    if (characterResult && !characterResult.error && characterResult.data) {
      characterContext = characterResult.data;
    }

    // 3. System Prompt Construction
    const marketBrief = marketData 
      ? `Market Data: ${marketData.ticker} is currently $${marketData.price.toFixed(6)} (${marketData.dayChangePercent.toFixed(2)}% 24h).`
      : "Market telemetry currently congested.";

    const systemPrompt = `You are a Gross Bro market oracle. ${characterContext?.system_prompt || "Be professional and concise."}
Current Context: ${marketBrief}
Brevity: Response must be under 50 words.`;

    return NextResponse.json({ 
      text: `${systemPrompt}\n\nProcessed query for ${ticker || "XRP"}.` 
    }, { status: 200 });

  } catch (err) {
    console.error("Chat API Error:", err);
    return NextResponse.json({ 
      text: "Neural link severed. Market telemetry temporarily unavailable." 
    }, { status: 200 });
  }
}
