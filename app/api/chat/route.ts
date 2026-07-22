import { NextRequest, NextResponse } from "next/server";

/**
 * Chat API Route - RAW DATA PROXY MODE
 * Strictly locked to XRPL.to search. 
 * Completely bypasses LLM and personality logic for price queries.
 */
export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json();
    const lastMessage = messages[messages.length - 1]?.content || "";

    // 1. Ticker Parsing
    const tickerMatch = lastMessage.match(/\$[a-zA-Z0-9]+/);
    const ticker = tickerMatch ? tickerMatch[0].replace('$', '').toUpperCase() : "XRP";

    // 2. Direct XRPL.to Search (Strictly enforced, FirstLedger removed)
    const response = await fetch('https://api.xrpl.to/v1/search', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0'
      },
      body: JSON.stringify({ search: ticker, limit: 1 })
    });

    if (!response.ok) {
      return NextResponse.json({ text: "Market data link failure." }, { status: 200 });
    }

    const data = await response.json();

    // 3. Raw Pipe Logic
    // Isolates the LLM by returning raw JSON data directly in the text field.
    if (data.success && data.tokens?.length > 0) {
      const token = data.tokens[0];
      const rawOutput = `${token.token || token.currency}: $${parseFloat(token.usd).toFixed(6)} (${token.pro24h >= 0 ? '+' : ''}${token.pro24h}% 24h)`;
      return NextResponse.json({ text: rawOutput }, { status: 200 });
    }

    return NextResponse.json({ text: "Token not found in XRPL registry." }, { status: 200 });

  } catch (err) {
    console.error("Chat API Error:", err);
    return NextResponse.json({ text: "System error." }, { status: 200 });
  }
}
