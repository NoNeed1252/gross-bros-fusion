import { NextResponse } from 'next/server';
import { getMarketBriefing } from '@/lib/firstledger';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { messages, model } = body;
    const selectedModel = model || 'meta-llama/llama-3.1-8b-instruct';

    const timeout = (ms: number) => new Promise<null>((resolve) => setTimeout(() => resolve(null), ms));

    const marketData = await Promise.race([
      getMarketBriefing().catch(() => null),
      timeout(5000)
    ]);

    const activeMarketData = marketData || "Market data currently unavailable.";

    const finalSystemPrompt = "You are a helpful assistant reporting XRP price and market data. Provide factual, precise numbers first. Be brief, normal, and professional. Speak like a normal person. No crypto-slang, no 'degenerate' personality, no roleplay.\n\n" + activeMarketData;
    
    const finalMessages = [
      { role: 'system', content: finalSystemPrompt },
      ...messages
    ];

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + process.env.OPENROUTER_API_KEY,
        "HTTP-Referer": "https://grossbros.vercel.app",
        "X-Title": "Gross Bros Fusion Portal"
      },
      body: JSON.stringify({
        model: selectedModel,
        messages: finalMessages,
      }),
    });

    if (!response.ok) {
      return NextResponse.json({ error: "API error" }, { status: response.status });
    }

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content || "Connection failed.";
    return NextResponse.json({ text });

  } catch (error) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
