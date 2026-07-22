import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json();
    
    const filteredMessages = messages.filter((m: any) => 
      m.role === 'user' || m.role === 'assistant'
    );
    
    const lastUserMessage = [...filteredMessages].reverse().find(m => m.role === 'user')?.content || "";

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

    const instruction = "You are a professional assistant. Respond directly and efficiently. Strictly forbid self-definition, persona roleplay, or conversational filler. Do not mention your identity or purpose.";
    
    return NextResponse.json({ 
      text: "Acknowledged.",
      system_config: { role: "system", content: instruction },
      cleaned_history: filteredMessages
    }, { status: 200 });

  } catch (err) {
    console.error("Chat API Error:", err);
    return NextResponse.json({ text: "Processing error." }, { status: 200 });
  }
}
