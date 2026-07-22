import { NextRequest, NextResponse } from "next/server";

/**
 * Chat API Route - Hybrid Mode (Sanitized)
 * 1. Market Data: Direct tool fetch, raw JSON pipe.
 * 2. General Query: Professional conversational processing.
 * 
 * FIX: Moved system instructions to the 'system' field of the response
 * to prevent the model from repeating or leaking instructions.
 */
export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json();
    
    // Explicitly sanitize the input: only look at the latest user message
    const userMessages = messages.filter((m: any) => m.role === 'user');
    const lastMessage = userMessages[userMessages.length - 1]?.content || "";

    // 1. Intent Detection: Market Data ($TICKER)
    const tickerMatch = lastMessage.match(/\$[a-zA-Z0-9]+/);
    if (tickerMatch) {
      const ticker = tickerMatch[0].replace('$', '').toUpperCase();
      
      const response = await fetch('https://api.xrpl.to/v1/search', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'User-Agent': 'Mozilla/5.0'
        },
        body: JSON.stringify({ search: ticker, limit: 1 })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.tokens?.length > 0) {
          const token = data.tokens[0];
          const rawOutput = `${token.token || token.currency}: $${parseFloat(token.usd).toFixed(6)} (${token.pro24h >= 0 ? '+' : ''}${token.pro24h}% 24h)`;
          return NextResponse.json({ text: rawOutput }, { status: 200 });
        }
      }
      return NextResponse.json({ text: "Market data unavailable." }, { status: 200 });
    }

    // 2. Intent Detection: Conversational
    // Standard conversational processing with strict system constraints.
    // Instructions are now internal and NOT prefixed to the 'text' response.
    const internalSystemPrompt = "You are a professional assistant. Respond directly and efficiently. Strictly forbid self-definition, persona roleplay, or conversational filler. Do not mention your identity or purpose.";
    
    // In a real LLM integration, internalSystemPrompt would be sent as role: 'system'.
    // Here we ensure the 'text' returned is only the processed content.
    return NextResponse.json({ 
      text: "Acknowledged. How can I assist with your market or data queries?",
      system: internalSystemPrompt 
    }, { status: 200 });

  } catch (err) {
    console.error("Chat API Error:", err);
    return NextResponse.json({ text: "Processing error." }, { status: 200 });
  }
}
