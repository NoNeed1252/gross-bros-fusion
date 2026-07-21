/**
 * Market Price Oracle
 * 
 * Fetches real-time pricing data for XRP directly from the XRPL API.
 */

export interface TokenPrice {
  ticker: string;
  price: number;
  dayChangePercent: number;
  timestamp: string;
}

/**
 * Fetches the current price of XRP in USD from the XRPL.to API.
 */
export async function getXrpPrice(): Promise<TokenPrice | null> {
  try {
    const response = await fetch('https://api.xrpl.to/v1/token/xrp', {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      },
      next: { revalidate: 60 }
    });
    
    if (!response.ok) {
      throw new Error(`XRPL.to API responded with status: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.success || !data.token || typeof data.token.usd !== 'string') {
      throw new Error('Invalid response structure from XRPL.to API');
    }

    return {
      ticker: 'XRP',
      price: parseFloat(data.token.usd),
      dayChangePercent: data.token.pro24h || 0,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('Failed to fetch XRP price from XRPL.to:', error);
    return null;
  }
}

/**
 * Generates a market briefing string for the AI system prompt.
 */
export async function getMarketBriefing(): Promise<string> {
  const xrp = await getXrpPrice();
  if (!xrp) return "Market data currently unavailable (telemetry link severed).";

  const trend = xrp.dayChangePercent >= 0 ? "BULLISH" : "BEARISH";
  const emoji = xrp.dayChangePercent >= 0 ? "🚀" : "📉";

  return `Current Market Status: XRP is trading at $${xrp.price.toFixed(4)} (${xrp.dayChangePercent.toFixed(2)}% 24h). Market sentiment is ${trend} ${emoji}. Source: XRPL Telemetry.`;
}
