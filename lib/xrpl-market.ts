/** XRPL.to market data with OnTheDEX redundancy. */

const XRPL = 'https://api.xrpl.to/v1';
const OTD = 'https://api.onthedex.live/public/v1';
const HEADERS = {
  Accept: 'application/json',
  'User-Agent': 'Gross-Bros-Fusion/1.0',
  Referer: 'https://xrpl.to/',
};

type ApiToken = {
  token?: string;
  currency?: string;
  issuer?: string;
  md5?: string;
  slug?: string;
  usd?: number | string;
  price?: number | string;
  priceUsd?: number | string;
  price_mid_usd?: number | string;
  exch?: number | string;
  pro24h?: number | string;
  priceChange24h?: number | string;
  vol24h?: number | string;
  volume_usd?: number | string;
};

export interface TokenPrice {
  ticker: string;
  price: number;
  dayChangePercent: number;
  timestamp: string;
  issuer?: string;
  volume24h?: number;
  md5?: string;
  source?: 'XRPL.to' | 'OnTheDEX';
}

export interface NFTCollection {
  name: string;
  slug: string;
  floorPrice?: number;
  volume24h?: number;
  items?: number;
  owners?: number;
}

function numeric(...values: unknown[]): number | undefined {
  for (const value of values) {
    const result = Number(value);
    if (Number.isFinite(result) && result > 0) return result;
  }
  return undefined;
}

function change(...values: unknown[]): number {
  for (const value of values) {
    const result = Number(value);
    if (Number.isFinite(result)) return result;
  }
  return 0;
}

async function getJson<T>(url: string, init: RequestInit = {}): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);
  try {
    const response = await fetch(url, {
      ...init,
      signal: controller.signal,
      cache: 'no-store',
      headers: { ...HEADERS, ...(init.headers || {}) },
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json() as T;
    if ((data as any)?.error) throw new Error((data as any).message || String((data as any).error));
    return data;
  } finally {
    clearTimeout(timeout);
  }
}

function tokenPrice(token: ApiToken, source: TokenPrice['source']): TokenPrice | null {
  const price = numeric(token.usd, token.priceUsd, token.price_mid_usd, token.price, token.exch);
  if (!price) return null;
  return {
    ticker: token.token || token.currency || 'XRP',
    price,
    dayChangePercent: change(token.pro24h, token.priceChange24h),
    timestamp: new Date().toISOString(),
    issuer: token.issuer,
    volume24h: numeric(token.vol24h, token.volume_usd),
    md5: token.md5,
    source,
  };
}

async function getOnTheDexToken(query: string): Promise<TokenPrice | null> {
  const data = await getJson<any>(`${OTD}/daily/tokens?by=volume&min_trades=1&page=1&per_page=100`);
  const normalized = query.toLowerCase();
  const token = (data.tokens || [])
    .filter((item: ApiToken) => [item.currency, item.token, item.issuer].some(value => String(value || '').toLowerCase() === normalized))
    .sort((a: ApiToken, b: ApiToken) => Number(b.volume_usd || 0) - Number(a.volume_usd || 0))[0];
  if (!token) return null;
  const identifier = `${token.currency}.${token.issuer}`;
  const aggregate = await getJson<any>(`${OTD}/aggregator?token=${encodeURIComponent(identifier)}`).catch(() => null);
  return tokenPrice({ ...token, ...(aggregate?.tokens?.[0] || {}) }, 'OnTheDEX');
}

export async function getXrpPrice(): Promise<TokenPrice | null> {
  try {
    const data = await getJson<any>(`${XRPL}/token/xrp`);
    const token = data?.token || data?.data || data;
    const result = tokenPrice({ ...token, token: 'XRP', currency: 'XRP' }, 'XRPL.to');
    if (result) return result;
  } catch (error) {
    console.error('XRPL.to XRP lookup failed:', error);
  }
  try {
    return await getOnTheDexToken('XRP');
  } catch (error) {
    console.error('OnTheDEX XRP lookup failed:', error);
    return null;
  }
}

export async function getTokenById(id: string): Promise<TokenPrice | null> {
  try {
    const data = await getJson<any>(`${XRPL}/token/${encodeURIComponent(id)}`);
    const result = tokenPrice(data?.token || data?.data || data, 'XRPL.to');
    if (result) return result;
  } catch (error) {
    console.error(`XRPL.to token lookup failed for ${id}:`, error);
  }
  try {
    return await getOnTheDexToken(id);
  } catch (error) {
    console.error(`OnTheDEX token lookup failed for ${id}:`, error);
    return null;
  }
}

export async function resolveTickerToToken(ticker: string): Promise<TokenPrice | null> {
  const cleanTicker = ticker.replace('$', '').trim().toUpperCase();
  if (!cleanTicker) return null;
  try {
    const data = await getJson<any>(`${XRPL}/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ search: cleanTicker, limit: 5 }),
    });
    const tokens: ApiToken[] = data.tokens || [];
    const best = tokens.find(token => String(token.token || token.currency || '').toUpperCase() === cleanTicker) || tokens[0];
    const identifier = best?.md5 || best?.slug || (best?.currency && best?.issuer ? `${best.currency}.${best.issuer}` : undefined);
    if (identifier) {
      const result = await getTokenById(identifier);
      if (result) return result;
    }
  } catch (error) {
    console.error(`XRPL.to ticker lookup failed for ${cleanTicker}:`, error);
  }
  try {
    return await getOnTheDexToken(cleanTicker);
  } catch (error) {
    console.error(`OnTheDEX ticker lookup failed for ${cleanTicker}:`, error);
    return null;
  }
}

export async function searchFirstLedgerToken(query: string): Promise<TokenPrice | null> {
  return resolveTickerToToken(query);
}

export async function getNFTCollection(query: string): Promise<NFTCollection | null> {
  try {
    const data = await getJson<any>(`${XRPL}/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ search: query, limit: 1 }),
    });
    const collection = data.collections?.[0];
    if (!collection) return null;
    return { name: collection.name, slug: collection.slug, floorPrice: collection.floor, volume24h: collection.vol24h, items: collection.items, owners: collection.owners };
  } catch (error) {
    console.error(`NFT collection lookup failed for ${query}:`, error);
    return null;
  }
}

export async function getMarketBriefing(): Promise<string> {
  const xrp = await getXrpPrice();
  if (!xrp) return 'Market data currently unavailable (telemetry link severed).';
  const trend = xrp.dayChangePercent >= 0 ? 'BULLISH' : 'BEARISH';
  const emoji = xrp.dayChangePercent >= 0 ? '🚀' : '📉';
  return `XRP Market Status: Price is $${xrp.price.toFixed(4)} (${xrp.dayChangePercent.toFixed(2)}% 24h). Sentiment is ${trend} ${emoji}. Source: ${xrp.source}.`;
}
