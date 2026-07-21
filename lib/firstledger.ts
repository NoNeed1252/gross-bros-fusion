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
    
    if (!response.ok) throw new Error(\`XRPL.to API status: \${response.status}\`);
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
 * Direct fallback lookup for niche tokens by currency_issuer.
 */
export async function getTokenById(id: string): Promise<TokenPrice | null> {
  try {
    const response = await fetch(\`https://api.xrpl.to/v1/token/\${id}\`, {
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
      ticker: data.token.currency,
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
 * Searches for a specific token by ticker (e.g. "ATM") or currency code.
 */
export async function searchFirstLedgerToken(query: string): Promise<TokenPrice | null> {
  try {
    const cleanQuery = query.replace('$', '').trim();
    if (!cleanQuery) return null;

    // First try a direct search if it looks like currency_issuer
    if (cleanQuery.includes('_')) {
        const direct = await getTokenById(cleanQuery);
        if (direct) return direct;
    }

    // Attempt fuzzy search via POST /v1/search
    const searchResponse = await fetch('https://api.xrpl.to/v1/search', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'Mozilla/5.0'
        },
        body: JSON.stringify({ search: cleanQuery, limit: 1 })
    });

    if (searchResponse.ok) {
        const searchData = await searchResponse.json();
        if (searchData.success && searchData.tokens && searchData.tokens.length > 0) {
            const match = searchData.tokens[0];
            return {
                ticker: match.currency,
                price: parseFloat(match.usd),
                dayChangePercent: match.pro24h || 0,
                timestamp: new Date().toISOString(),
                issuer: match.issuer,
                volume24h: match.vol24h,
                md5: match.md5
            };
        }
    }

    // Fallback to volume sort scan
    const searchUrl = \`https://api.xrpl.to/v1/tokens?sort=vol24h&limit=100\`;
    const response = await fetch(searchUrl, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0'
      },
      next: { revalidate: 300 }
    });

    if (!response.ok) throw new Error(\`Search failed: \${response.status}\`);

    const data = await response.json();
    if (!data.success || !data.tokens || data.tokens.length === 0) return null;

    const normalizedQuery = cleanQuery.toUpperCase();
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
      volume24h: match.vol24h,
      md5: match.md5
    };
  } catch (error) {
    console.error(\`Failed to search token \${query}:\`, error);
    return null;
  }
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

  return \`XRP Market Status: Price is \$\${xrp.price.toFixed(4)} (\${xrp.dayChangePercent.toFixed(2)}% 24h). Sentiment is \${trend} \${emoji}.\`;
}
