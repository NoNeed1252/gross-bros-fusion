/**
 * Market Price Oracle
 * 
 * Fetches real-time pricing data for XRP.
 * Falls back to CoinGecko if FirstLedger telemetry is unavailable.
 */

export interface TokenPrice {
  ticker: string;
  price: number;
  dayChangePercent: number;
  timestamp: string;
}

/**
 * Fetches the current price of XRP in USD.
 */
export async function getXrpPrice(): Promise<TokenPrice | null> {
  try {
    // Primary source: CoinGecko (proven to return valid data in this environment)
    const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=ripple&vs_currencies=usd&include_24hr_change=true', {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Gross-Bros-Fusion-Portal/1.0'
      },
      next: { revalidate: 60 }
    });
    
    if (!response.ok) {
      throw new Error(`Price API responded with status: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.ripple || typeof data.ripple.usd !== 'number') {
      throw new Error('Invalid response structure from Price API');
    }

    return {
      ticker: 'XRP',
      price: data.ripple.usd,
      dayChangePercent: data.ripple.usd_24h_change || 0,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('Failed to fetch XRP price:', error);
    return null;
  }
}

/**
 * Generates a market briefing string for the AI system prompt.
 */
export async function getMarketBriefing(): Promise<string> {
  const xrp = await getXrpPrice();
  if (!xrp) return "Market data currently unavailable (neural link lag).";

  const trend = xrp.dayChangePercent >= 0 ? "BULLISH" : "BEARISH";
  const emoji = xrp.dayChangePercent >= 0 ? "🚀" : "📉";

  return `Current Market Status: XRP is trading at $${xrp.price.toFixed(4)} (${xrp.dayChangePercent.toFixed(2)}% 24h). Market sentiment is ${trend} ${emoji}.`;
}
