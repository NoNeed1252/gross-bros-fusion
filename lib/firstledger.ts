/**
 * FirstLedger-style Price Oracle
 * 
 * Fetches real-time pricing data for XRP and major ecosystem tokens.
 * Currently uses a hybrid approach with a primary focus on XRPL data.
 */

export interface TokenPrice {
  ticker: string;
  price: number;
  dayChangePercent: number;
  timestamp: string;
}

/**
 * Fetches the current price of XRP in USD.
 * In a production FirstLedger environment, this would call the FirstLedger API.
 * For now, we provide a robust fetcher that can be integrated into the AI prompt.
 */
export async function getXrpPrice(): Promise<TokenPrice | null> {
  try {
    // Note: In the actual deployed environment, we would use a fetch to a price API
    // or a dedicated service. This stub represents the logic for the AI to include.
    const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=ripple&vs_currencies=usd&include_24hr_change=true');
    const data = await response.json();
    
    return {
      ticker: 'XRP',
      price: data.ripple.usd,
      dayChangePercent: data.ripple.usd_24h_change,
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
  if (!xrp) return "Market data currently unavailable in this sector of the galaxy.";

  const trend = xrp.dayChangePercent >= 0 ? "BULLISH" : "BEARISH";
  const emoji = xrp.dayChangePercent >= 0 ? "🚀" : "📉";

  return `Current Market Status: XRP is trading at $${xrp.price.toFixed(4)} (${xrp.dayChangePercent.toFixed(2)}% 24h). Market sentiment is ${trend} ${emoji}. Use this data to inform your degenerate trading advice.`;
}
