/**
 * XRPL Market Oracle
 * Primary: XRPL.to V1 API
 * Failover: Direct XRPL Ledger book_offers (via HTTPS RPC)
 */

export interface TokenPrice {
  ticker: string;
  price: number;
  dayChangePercent: number;
  timestamp: string;
  issuer?: string;
  volume24h?: number;
  md5?: string;
  source: 'xrpl.to' | 'ledger' | 'failover';
}

/**
 * Fetches the current price of XRP in USD from XRPL.to.
 */
export async function getXrpPrice(): Promise<TokenPrice | null> {
  try {
    const response = await fetch('https://api.xrpl.to/v1/token/xrp', {
      headers: { 'Accept': 'application/json', 'User-Agent': 'Mozilla/5.0' },
      next: { revalidate: 60 }
    });
    
    if (!response.ok) throw new Error(`XRPL.to status: ${response.status}`);
    const data = await response.json();
    if (!data.success || !data.token) throw new Error('Invalid XRPL.to response');

    return {
      ticker: 'XRP',
      price: parseFloat(data.token.usd),
      dayChangePercent: data.token.pro24h || 0,
      timestamp: new Date().toISOString(),
      source: 'xrpl.to'
    };
  } catch (error) {
    console.error('Failed to fetch XRP price:', error);
    return null;
  }
}

/**
 * Direct lookup for tokens by identifier from XRPL.to.
 */
export async function getTokenById(id: string): Promise<TokenPrice | null> {
  try {
    const response = await fetch(`https://api.xrpl.to/v1/token/${id}`, {
      headers: { 'Accept': 'application/json', 'User-Agent': 'Mozilla/5.0' },
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
      md5: data.token.md5,
      source: 'xrpl.to'
    };
  } catch (error) {
    return null;
  }
}

/**
 * Dynamically resolves a ticker symbol to an XRPL token.
 * Note: Uses GET https://api.xrpl.to/v1/tokens/search?q=${ticker} per user spec.
 */
export async function resolveTickerToToken(ticker: string): Promise<TokenPrice | null> {
  try {
    const cleanTicker = ticker.replace('$', '').trim().toUpperCase();
    if (!cleanTicker) return null;

    // Primary: XRPL.to Search (GET variant)
    const searchUrl = `https://api.xrpl.to/v1/tokens/search?q=${encodeURIComponent(cleanTicker)}`;
    const searchResponse = await fetch(searchUrl, {
      method: 'GET',
      headers: { 'Accept': 'application/json', 'User-Agent': 'Mozilla/5.0' }
    });

    if (searchResponse.ok) {
      const searchData = await searchResponse.json();
      if (searchData.success && searchData.tokens?.length > 0) {
        const bestMatch = searchData.tokens.find((t: any) => 
          (t.token || t.currency || '').toUpperCase() === cleanTicker
        ) || searchData.tokens[0];

        const identifier = bestMatch.md5 || bestMatch.slug;
        if (identifier) {
          const detail = await getTokenById(identifier);
          if (detail) return detail;
        }
      }
    }

    // Failover 1: POST variant (backup)
    const postSearchResponse = await fetch('https://api.xrpl.to/v1/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'User-Agent': 'Mozilla/5.0' },
      body: JSON.stringify({ search: cleanTicker, limit: 5 })
    });

    if (postSearchResponse.ok) {
        const searchData = await postSearchResponse.json();
        if (searchData.success && searchData.tokens?.length > 0) {
            const bestMatch = searchData.tokens.find((t: any) => 
                (t.token || t.currency || '').toUpperCase() === cleanTicker
            ) || searchData.tokens[0];
            const identifier = bestMatch.md5 || bestMatch.slug;
            if (identifier) {
                const detail = await getTokenById(identifier);
                if (detail) return detail;
            }
        }
    }

    // Failover 2: Try volume scan
    const volRes = await fetch('https://api.xrpl.to/v1/tokens?sort=vol24h&limit=100', {
       headers: { 'User-Agent': 'Mozilla/5.0' }
    });
    if (volRes.ok) {
      const volData = await volRes.json();
      const match = volData.tokens?.find((t: any) => 
        (t.token || '').toUpperCase() === cleanTicker || 
        (t.currency || '').toUpperCase() === cleanTicker
      );
      if (match) {
        return {
          ticker: match.token || match.currency,
          price: parseFloat(match.usd),
          dayChangePercent: match.pro24h || 0,
          timestamp: new Date().toISOString(),
          issuer: match.issuer,
          source: 'xrpl.to'
        };
      }
    }

    return null;
  } catch (error) {
    console.error(`Lookup failed for ${ticker}:`, error);
    return null;
  }
}

/**
 * Failover logic for real-time DEX price calculation using book_offers.
 * Uses standard HTTPS JSON-RPC to s1.ripple.com (no port 51234).
 */
export async function getLedgerPriceFailover(currency: string, issuer: string): Promise<number | null> {
  try {
    const response = await fetch('https://s1.ripple.com', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        method: 'book_offers',
        params: [{
          taker_gets: { currency, issuer },
          taker_pays: { currency: 'XRP' },
          limit: 3
        }]
      })
    });

    if (!response.ok) return null;
    const data = await response.json();
    const offers = data.result?.offers;
    if (!offers || offers.length === 0) return null;

    // Calculate mid-price from the first offer (XRP per Token)
    const takerGets = parseFloat(offers[0].TakerGets.value || offers[0].TakerGets);
    const takerPays = parseFloat(offers[0].TakerPays.value || offers[0].TakerPays) / 1000000; // drops to XRP
    
    const xrpPerToken = takerPays / takerGets;
    const xrpPrice = await getXrpPrice();
    
    return xrpPrice ? xrpPerToken * xrpPrice.price : null;
  } catch (error) {
    return null;
  }
}
