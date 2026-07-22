import { NextRequest, NextResponse } from "next/server";
import { resolveTickerToToken, getXrpPrice } from "@/lib/xrpl-oracle";

/**
 * Chat API Route - RAW DATA MODE
 * Strictly enforced: no personality, no branding, no filler.
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

    if (!marketData) {
      return NextResponse.json({ 
        text: "Data unavailable." 
      }, { status: 200 });
    }

    // 3. Raw Response Construction
    // Strictly raw data. No personality, no branding, no filler.
    const response = `${marketData.ticker}: $${marketData.price.toFixed(6)} (${marketData.dayChangePercent.toFixed(2)}% 24h)`;

    return NextResponse.json({ 
      text: response 
    }, { status: 200 });

  } catch (err) {
    console.error("Chat API Error:", err);
    return NextResponse.json({ 
      text: "Error." 
    }, { status: 200 });
  }
}
