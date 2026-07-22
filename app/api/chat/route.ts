import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { PERSONALITY_TRAITS } from '@/lib/gross-bros';
import { getXrpPrice, resolveTickerToToken, getLedgerPriceFailover } from '@/lib/xrpl-oracle';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { messages, model, systemPrompt, species } = body;
    const selectedModel = model || 'meta-llama/llama-3.1-8b-instruct';
    const lastUserMessage = messages[messages.length - 1]?.content || "";

    // 1. Detect Ticker Patterns ($TICKER)
    const tickerRegex = /\$([A-Za-z0-9_]{2,10})/;
    const foundTicker = lastUserMessage.match(tickerRegex)?.[1];
    
    // 2. Detect Market/Price Keywords
    const marketKeywords = ['price', 'market', 'xrp', 'ticker', 'chart', 'floor', 'buy', 'sell', 'volume'];
    const isMarketRequest = marketKeywords.some(keyword => lastUserMessage.toLowerCase().includes(keyword)) || !!foundTicker;

    // 3. Parallel Lookups
    const [personalityResult, xrpData, specificTokenData] = await Promise.all([
      species ? supabase.from('bro_personalities').select('system_prompt').eq('species', species).single().catch(() => null) : Promise.resolve(null),
      (isMarketRequest || foundTicker?.toUpperCase() === 'XRP') ? getXrpPrice() : Promise.resolve(null),
      (foundTicker && foundTicker.toUpperCase() !== 'XRP') ? resolveTickerToToken(foundTicker) : Promise.resolve(null)
    ]);

    // 4. Failover Logic (Book Offers)
    let finalTokenPrice = specificTokenData;
    if (foundTicker && !finalTokenPrice && foundTicker.toUpperCase() !== 'XRP') {
      // If search failed but we have a ticker, we don't have the issuer address easily 
      // here without a successful search, so we rely on the specificTokenData check.
    }

    // 5. System Prompt Construction
    let activeSystemPrompt = systemPrompt;
    if (personalityResult?.data?.system_prompt) {
      activeSystemPrompt = personalityResult.data.system_prompt;
    } else if (species && (PERSONALITY_TRAITS as any)[species]) {
      activeSystemPrompt = (PERSONALITY_TRAITS as any)[species].prompt;
    }

    let finalSystemPrompt = activeSystemPrompt || "";

    // MARKET DATA ORACLE PATH (NO PERSONALITY)
    if (foundTicker) {
      const tickerUpper = foundTicker.toUpperCase();
      const data = tickerUpper === 'XRP' ? xrpData : finalTokenPrice;

      if (data) {
        finalSystemPrompt = `You are a high-speed Market Data Oracle.
USER REQUEST: Price for $${tickerUpper}
DATA: $${data.ticker} | Price: $${data.price.toFixed(8)} USD | 24h: ${data.dayChangePercent.toFixed(2)}% | Source: ${data.source}
INSTRUCTIONS: Return ONLY the raw structured data. No conversational filler. No personality. No Mission Specialist branding.
FORMAT: $${data.ticker}: $${data.price.toFixed(8)} (${data.dayChangePercent >= 0 ? '+' : ''}${data.dayChangePercent.toFixed(2)}%)`;
      } else {
        finalSystemPrompt = `You are a high-speed Market Data Oracle.
USER REQUEST: Price for $${tickerUpper}
STATUS: Ticker not resolved on XRPL.
INSTRUCTIONS: Inform the user clearly that $${tickerUpper} was not found. No personality.`;
      }
    } else if (isMarketRequest && xrpData) {
      finalSystemPrompt = `You are a high-speed Market Data Oracle.
XRP MARKET BRIEF: $${xrpData.price.toFixed(4)} (${xrpData.dayChangePercent >= 0 ? '+' : ''}${xrpData.dayChangePercent.toFixed(2)}%)
INSTRUCTIONS: Provide a data-focused market summary. No personality.`;
    } else {
      // Standard Chat Path
      const brevity = "CRITICAL: Response must be 1-2 sentences. No rambling.";
      finalSystemPrompt = `${activeSystemPrompt}\n\n${brevity}`;
    }

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "HTTP-Referer": "https://grossbros.vercel.app",
        "X-Title": "Gross Bros Fusion Portal"
      },
      body: JSON.stringify({
        model: selectedModel,
        messages: [{ role: 'system', content: finalSystemPrompt }, ...messages],
      }),
    });

    if (!response.ok) return NextResponse.json({ error: "Upstream Error" }, { status: 502 });

    const data = await response.json();
    return NextResponse.json({ text: data.choices?.[0]?.message?.content || "Neural link severed." });

  } catch (error) {
    console.error("Oracle Runtime Error:", error);
    return NextResponse.json({ error: "Internal Oracle Failure" }, { status: 500 });
  }
}
