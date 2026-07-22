import { NextRequest, NextResponse } from "next/server";
import { resolveTickerToToken, getXrpPrice } from "@/lib/xrpl-oracle";

/**
 * Chat API Route - Market Oracle Mode
 * Personality: Human, nonchalant, professional.
 * Strict Constraint: Provide direct price data, no self-identification or persona definitions.
 */
export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json();
    const lastMessage = messages[messages.length - 1]?.content || "";

    // 1. Ticker Parsing
    const tickerMatch = lastMessage.match(/\$[a-zA-Z0-9]+/);
    const ticker = tickerMatch ? tickerMatch[0] : null;

    // 2. Direct Price Data Retrieval
    // We fetch the data immediately to ensure accuracy and prevent LLM hallucination.
    const marketData = await (ticker ? resolveTickerToToken(ticker) : getXrpPrice());

    // 3. Response Construction
    // The system prompt mandates a direct, nonchalant, and human voice.
    // "You are the market oracle. Your only job is to provide direct price data. 
    // Return the result in 1-2 lines in a nonchalant, human voice. Do not define your identity."
    
    if (!marketData) {
      return NextResponse.json({ 
        text: "Couldn't find that one. Market telemetry might be congested." 
      }, { status: 200 });
    }

    // Direct, human, nonchalant response with raw data.
    const response = `${marketData.ticker} is sitting at $${marketData.price.toFixed(6)}, ${marketData.dayChangePercent >= 0 ? '+' : ''}${marketData.dayChangePercent.toFixed(2)}% in the last 24h.`;

    return NextResponse.json({ 
      text: response 
    }, { status: 200 });

  } catch (err) {
    console.error("Chat API Error:", err);
    return NextResponse.json({ 
      text: "Neural link's a bit fuzzy. Can't grab that price right now." 
    }, { status: 200 });
  }
}
