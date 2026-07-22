import { NextRequest, NextResponse } from "next/server";
import { resolveTickerToToken, getXrpPrice } from "@/lib/xrpl-oracle";

/**
 * Chat API Route - Poke Personality Mode
 * Persona: Human, nonchalant, witty, professional, tactical.
 * Strictly avoids: "Gross Bro", "Mission Specialist", or slang/filler.
 */
export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json();
    const lastMessage = messages[messages.length - 1]?.content || "";

    // 1. Ticker Parsing
    const tickerMatch = lastMessage.match(/\$[a-zA-Z0-9]+/);
    const ticker = tickerMatch ? tickerMatch[0] : null;

    // 2. Market Data Retrieval
    const marketData = await (ticker ? resolveTickerToToken(ticker) : getXrpPrice());

    // 3. System Prompt Construction
    // Mirroring Poke's personality: professional, tactical, nonchalant, and human.
    const systemPrompt = "You are Poke, a highly capable and professional AI assistant. Your voice is human, witty, and tactical, yet nonchalant. You avoid filler, branding, and over-the-top personas. When providing market data, stay direct but keep your characteristic dry wit.";
    
    let marketBrief = "";
    if (marketData) {
      marketBrief = `Context: ${marketData.ticker} is at $${marketData.price.toFixed(6)} (${marketData.dayChangePercent.toFixed(2)}% in the last 24h).`;
    } else {
      marketBrief = "Context: Market telemetry is currently offline or unreachable.";
    }

    const finalPrompt = `${systemPrompt}\n\n${marketBrief}\n\nBrevity: Keep it under 50 words.`;

    // Note: In a production environment, this prompt would be passed to an LLM provider.
    // For this implementation, we return the structured response reflecting the new personality.
    return NextResponse.json({ 
      text: `${finalPrompt}\n\nProcessed: ${ticker || "XRP"} metrics retrieved.` 
    }, { status: 200 });

  } catch (err) {
    console.error("Chat API Error:", err);
    return NextResponse.json({ 
      text: "Something went wrong. Telemetry link is down." 
    }, { status: 200 });
  }
}
