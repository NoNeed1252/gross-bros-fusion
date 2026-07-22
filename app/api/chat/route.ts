import { NextRequest, NextResponse } from "next/server";

/**
 * Chat API Route - Hybrid Mode (Shielded)
 * 1. Market Data: Direct tool fetch, raw data return.
 * 2. Conversational: Standard processing with strict system role separation.
 * 
 * FIX: Enforced strict message filtering and moved instructions to the system role.
 */
export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json();
    
    // 1. Strict History Sanitization
    // Filter out any previous system messages or leaked instructions in history.
    // We only pass the actual dialogue to the model.
    const filteredMessages = messages.filter((m: any) => 
      m.role === 'user' || m.role === 'assistant'
    );
    
    const lastUserMessage = [...filteredMessages].reverse().find(m => m.role === 'user')?.content || "";

    // 2. Intent Detection: Market Data ($TICKER)
    // Direct bypass for price queries to ensure zero hallucination.
    const tickerMatch = lastUserMessage.match(/\$[a-zA-Z0-9]+/);
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

    // 3. Conversational Intent
    // Move system instructions to a dedicated system object/role.
    const systemInstruction = "You are a professional assistant. Respond directly and efficiently. Strictly forbid self-definition, persona roleplay, or conversational filler. Do not mention your identity or purpose.";
    
    // This payload mirrors the expected structure for OpenRouter/OpenAI-style endpoints,
    // ensuring the system instruction is never part of the 'user' message history.
    const apiPayload = {
      model: process.env.CHAT_MODEL || "openai/gpt-3.5-turbo",
      messages: [
        { role: "system", content: systemInstruction },
        ...filteredMessages
      ]
    };

    // Return the response. In a full implementation, we'd fetch from the LLM here.
    // For now, we return the confirmation of the shielded processing.
    return NextResponse.json({ 
      text: "Acknowledged. Requesting data.",
      _debug_payload: apiPayload // Internal visibility for verification
    }, { status: 200 });

  } catch (err) {
    console.error("Chat API Error:", err);
    return NextResponse.json({ text: "Processing error." }, { status: 200 });
  }
}
