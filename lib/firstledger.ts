/**
 * FirstLedger Market Oracle
 * 
 * Logic for fetching prices and looking up specific FirstLedger assets (XRP, $ATM, etc.)
 * directly from the XRPL ecosystem telemetry.
 */

export interface TokenPrice {
  ticker: string;
  price: number;
  dayChangePercent: number;
  timestamp: string;
  issuer?: string;
  volume24h?: number;
}

/**
 * Fetches the current price of XRP in USD.
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
    
    if (!response.ok) throw new Error(`XRPL.to API status: ${response.status}`);
    const data = await response.json();
    
    if (!data.success || !data.token) throw new Error('Invalid XRPL.to response');

    return {
      ticker: 'XRP',
      price: parseFloat(data.token.usd),
      dayChangePercent: data.token.pro24h || 0,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('Failed to fetch XRP price:', error);
    return null;
  }
}

/**
 * Searches for a specific token by ticker (e.g. "ATM") or currency code.
 * Uses a prioritized volume search to bypass rate-limited search parameters.
 */
export async function searchFirstLedgerToken(query: string): Promise<TokenPrice | null> {
  try {
    const cleanQuery = query.replace('$', '').trim();
    if (!cleanQuery) return null;

    // Use a high-volume sort instead of the unreliable ?search param which is heavily rate-limited
    const searchUrl = `https://api.xrpl.to/v1/tokens?sort=vol24h&limit=100`;
    const response = await fetch(searchUrl, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      },
      next: { revalidate: 300 }
    });

    if (!response.ok) {
        if (response.status === 429) {
            console.warn("XRPL.to Rate Limited. Throttling...");
        }
        throw new Error(`Search failed: ${response.status}`);
    }

    const data = await response.json();
    if (!data.success || !data.tokens || data.tokens.length === 0) return null;

    const normalizedQuery = cleanQuery.toUpperCase();
    
    // Find matching ticker in the high-volume list
    const match = data.tokens.find((t: any) => 
        t.currency?.toUpperCase() === normalizedQuery || 
        t.name?.toUpperCase().includes(normalizedQuery)
    );

    if (!match) return null;

    return {
      ticker: match.currency,
      price: parseFloat(match.usd),
      dayChangePercent: match.pro24h || 0,
      timestamp: new Date().toISOString(),
      issuer: match.issuer,
      volume24h: match.vol24h
    };
  } catch (error) {
    console.error(`Failed to search token ${query}:`, error);
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

  return `XRP Market Status: Price is $${xrp.price.toFixed(4)} (${xrp.dayChangePercent.toFixed(2)}% 24h). Sentiment is ${trend} ${emoji}.`;
}
