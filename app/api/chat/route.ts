import { NextRequest, NextResponse } from "next/server";

/**
 * Chat API Route - Hybrid Mode
 * Intent-based logic:
 * 1. Market Data: Strictly enforced data fetch, no conversational fluff.
 * 2. General Query: Professional, direct conversational processing.
 * Strictly forbids: self-definition, persona roleplay, or conversational filler.
 */
export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json();
    const lastMessage = messages[messages.length - 1]?.content || "";

    // 1. Intent Detection: Market Data
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
    const systemPrompt = "You are a professional assistant. Respond directly and efficiently. Strictly forbid self-definition, persona roleplay, or conversational filler. Do not mention your identity or purpose.";
    
    // In a real environment, this prompt would be sent to the LLM. 
    // Here we simulate the compliant conversational response.
    return NextResponse.json({ 
      text: `${systemPrompt}\n\nProcessed: conversational intent recorded.` 
    }, { status: 200 });

  } catch (err) {
    console.error("Chat API Error:", err);
    return NextResponse.json({ text: "Processing error." }, { status: 200 });
  }
}
