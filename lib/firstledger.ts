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
  md5?: string;
}

export interface NFTCollection {
  name: string;
  slug: string;
  floorPrice?: number;
  volume24h?: number;
  items?: number;
  owners?: number;
}

/**
 * Fetches the current price of XRP in USD.
 */
export async function getXrpPrice(): Promise<TokenPrice | null> {
  try {
    const response = await fetch('https://api.xrpl.to/v1/token/xrp', {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0'
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
 * Direct lookup for tokens by identifier (md5 or currency_issuer).
 */
export async function getTokenById(id: string): Promise<TokenPrice | null> {
  try {
    const response = await fetch(`https://api.xrpl.to/v1/token/${id}`, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0'
      },
      next: { revalidate: 300 }
    });

    if (!response.ok) return null;
    const data = await response.json();
    if (!data.success || !data.token) return null;

    return {
      ticker: data.token.token || data.token.currency,
      price: parseFloat(data.token.usd),
      dayChangePercent: data.token.pro24h || 0,
      timestamp: new Date().toISOString(),
      issuer: data.token.issuer,
      volume24h: data.token.vol24h,
      md5: data.token.md5
    };
  } catch (error) {
    return null;
  }
}

/**
 * Dynamically resolves a ticker symbol to an XRPL token using the search endpoint.
 */
export async function resolveTickerToToken(ticker: string): Promise<TokenPrice | null> {
    try {
        const cleanTicker = ticker.replace('$', '').trim().toUpperCase();
        if (!cleanTicker) return null;

        // 1. Use the search endpoint to find the identifier
        const searchResponse = await fetch('https://api.xrpl.to/v1/search', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'Mozilla/5.0'
            },
            body: JSON.stringify({ search: cleanTicker, limit: 5 })
        });

        if (!searchResponse.ok) return null;
        const searchData = await searchResponse.json();
        
        if (!searchData.success || !searchData.tokens || searchData.tokens.length === 0) {
            return null;
        }

        // 2. Find the best match (exact symbol match)
        const bestMatch = searchData.tokens.find((t: any) => 
            (t.token || t.currency || '').toUpperCase() === cleanTicker
        ) || searchData.tokens[0];

        const identifier = bestMatch.md5 || bestMatch.slug;
        if (!identifier) return null;

        // 3. Fetch full token details using the identifier
        return await getTokenById(identifier);
    } catch (error) {
        console.error(`Dynamic lookup failed for ${ticker}:`, error);
        return null;
    }
}

/**
 * Searches for a specific token (legacy wrapper for resolveTickerToToken).
 */
export async function searchFirstLedgerToken(query: string): Promise<TokenPrice | null> {
  return resolveTickerToToken(query);
}

/**
 * Look up NFT collection by slug or search.
 */
export async function getNFTCollection(query: string): Promise<NFTCollection | null> {
    try {
        const searchResponse = await fetch('https://api.xrpl.to/v1/search', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'Mozilla/5.0'
            },
            body: JSON.stringify({ search: query, limit: 1 })
        });

        if (!searchResponse.ok) return null;
        const searchData = await searchResponse.json();
        
        if (searchData.success && searchData.collections && searchData.collections.length > 0) {
            const col = searchData.collections[0];
            return {
                name: col.name,
                slug: col.slug,
                floorPrice: col.floor,
                volume24h: col.vol24h,
                items: col.items,
                owners: col.owners
            };
        }
        return null;
    } catch (error) {
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
