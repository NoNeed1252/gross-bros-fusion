import { NextRequest, NextResponse } from "next/server";
import { resolveTickerToToken, getXrpPrice } from "@/lib/xrpl-oracle";
import { createClient } from "@supabase/supabase-js";

// Initialize Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(req: NextRequest) {
  try {
    const { messages, model } = await req.json();
    const lastMessage = messages[messages.length - 1]?.content || "";

    // 1. Ticker Parsing
    const tickerMatch = lastMessage.match(/\$[a-zA-Z0-9]+/);
    const ticker = tickerMatch ? tickerMatch[0] : null;

    let marketData = null;
    let characterContext = null;

    // 2. Data Fetching (Parallel)
    // FIX: Using safe destructuring for Supabase to avoid .single().catch() TypeError
    const [priceResult, characterResult] = await Promise.all([
      ticker ? resolveTickerToToken(ticker) : getXrpPrice(),
      supabase
        .from("personalities")
        .select("*")
        .eq("is_active", true)
        .single()
    ]);

    marketData = priceResult;
    
    // Handle Supabase result safely
    if (characterResult && !characterResult.error && characterResult.data) {
      characterContext = characterResult.data;
    }

    // 3. System Prompt Construction
    const marketBrief = marketData 
      ? `Market Data: ${marketData.ticker} is currently $${marketData.price.toFixed(6)} (${marketData.dayChangePercent.toFixed(2)}% 24h).`
      : "Market telemetry currently congested.";

    const systemPrompt = `You are a Gross Bro market oracle. ${characterContext?.personality_logic || "Be professional and concise."}
Current Context: ${marketBrief}
Brevity: Response must be under 50 words.`;

    // 4. Response Logic (Generic character response for telemetry fix)
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
