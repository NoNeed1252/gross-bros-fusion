import { NextResponse } from 'next/server';
import { getMarketBriefing, searchFirstLedgerToken } from '@/lib/firstledger';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { messages, model } = body;
    const selectedModel = model || 'meta-llama/llama-3.1-8b-instruct';

    // Extract ticker from the last user message
    // Improved regex to capture case-insensitive tickers with or without $
    const lastMessage = messages[messages.length - 1]?.content || '';
    const tickerMatch = lastMessage.match(/\$([A-Za-z0-9_-]{1,20})/i) || lastMessage.match(/\b([A-Za-z0-9]{3,10})\b/);
    const queryTicker = tickerMatch ? tickerMatch[1] : null;

    const timeout = (ms: number) => new Promise<null>((resolve) => setTimeout(() => resolve(null), ms));

    // Fetch general market briefing and specific token data in parallel
    const [marketBriefing, tokenData] = await Promise.all([
      Promise.race([
        getMarketBriefing().catch(() => null),
        timeout(5000)
      ]),
      queryTicker ? Promise.race([
        searchFirstLedgerToken(queryTicker).catch(() => null),
        timeout(5000)
      ]) : Promise.resolve(null)
    ]);

    let activeMarketData = marketBriefing || "Market data currently unavailable.";
    
    if (tokenData) {
      activeMarketData += `\n\nSpecific Asset Data for $${tokenData.ticker}: Price: $${tokenData.price.toFixed(8)}, 24h Change: ${tokenData.dayChangePercent.toFixed(2)}%, Volume (24h): ${tokenData.volume24h?.toLocaleString() || 'N/A'}. Issuer: ${tokenData.issuer || 'Native'}.`;
    }

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
