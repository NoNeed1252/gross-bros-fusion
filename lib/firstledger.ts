/**
 * FirstLedger Price Oracle
 * 
 * Fetches real-time pricing data for XRP and major ecosystem tokens
 * directly from the FirstLedger telemetry API.
 */

export interface TokenPrice {
  ticker: string;
  price: number;
  dayChangePercent: number;
  timestamp: string;
}

/**
 * Fetches the current price of XRP in USD from the FirstLedger API.
 */
export async function getXrpPrice(): Promise<TokenPrice | null> {
  try {
    // Calling the FirstLedger telemetry endpoint for XRP price data
    const response = await fetch('https://api.firstledger.net/v1/telemetry/xrp', {
      headers: {
        'Accept': 'application/json'
      },
      next: { revalidate: 60 } // Cache for 1 minute
    });
    
    if (!response.ok) {
      throw new Error(`FirstLedger API responded with status: ${response.status}`);
    }

    const data = await response.json();
    
    // FirstLedger response format: { data: { price_usd: number, change_24h: number, ... } }
    return {
      ticker: 'XRP',
      price: data.data.price_usd,
      dayChangePercent: data.data.change_24h,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('Failed to fetch XRP price from FirstLedger:', error);
    return null;
  }
}

/**
 * Generates a market briefing string for the AI system prompt.
 */
export async function getMarketBriefing(): Promise<string> {
  const xrp = await getXrpPrice();
  if (!xrp) return "Market data currently unavailable in this sector of the galaxy (FirstLedger link severed).";

  const trend = xrp.dayChangePercent >= 0 ? "BULLISH" : "BEARISH";
  const emoji = xrp.dayChangePercent >= 0 ? "🚀" : "📉";

  return `Current Market Status: XRP is trading at $${xrp.price.toFixed(4)} (${xrp.dayChangePercent.toFixed(2)}% 24h). Market sentiment is ${trend} ${emoji}. Source: FirstLedger Telemetry.`;
}
