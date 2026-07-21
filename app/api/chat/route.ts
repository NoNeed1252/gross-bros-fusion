import { NextResponse } from 'next/server';
import { getMarketBriefing } from '@/lib/firstledger';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { messages, model } = body;
    const selectedModel = model || 'meta-llama/llama-3.1-8b-instruct';

    console.log("Attempting OpenRouter fetch for model:", selectedModel);

    // Timeout helper
    const timeout = (ms: number) => new Promise<null>((resolve) => setTimeout(() => resolve(null), ms));

    // Fetch market data
    const marketData = await Promise.race([
      getMarketBriefing().catch(e => {
        console.error("Market Data Fetch Error:", e);
        return null;
      }),
      2000
    ]);

    const activeMarketData = marketData || "Market data currently unavailable.";

    /**
     * SYSTEM PROMPT OVERRIDE: 
     * Removed all personality, species traits, and crypto-slang.
     */
    const finalSystemPrompt = `You are a helpful assistant reporting XRP price and market data. Provide factual, precise numbers first. Be brief, normal, and professional. Speak like a normal person. No crypto-slang, no 'degenerate' personality, no roleplay.\n\n${activeMarketData}`;
    
    console.log("FINAL_SYSTEM_PROMPT_START");
    console.log(finalSystemPrompt);
    console.log("FINAL_SYSTEM_PROMPT_END");

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
      const errorText = await response.text();
      console.error("OpenRouter API Error:", response.status, errorText);
      return NextResponse.json({ error: "OpenRouter error: " + response.status }, { status: response.status });
    }

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content || "Connection failed.";
    return NextResponse.json({ text });

  } catch (error) {
    console.error("Runtime fetch error:", error);
    return NextResponse.json({ error: "Server-side connection failure" }, { status: 500 });
  }
}
