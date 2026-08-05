import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const JSON_HEADERS = { 'Cache-Control': 'no-store' };
const FETCH_TIMEOUT_MS = 8_000;

type Price = {
  symbol: string;
  name: string;
  priceUsd: number;
  change24h?: number;
  liquidityUsd?: number;
  source: string;
  identifier?: string;
  updatedAt: string;
};

function json(data: unknown, init?: ResponseInit) {
  return NextResponse.json(data, {
    ...init,
    headers: { ...JSON_HEADERS, ...(init?.headers ?? {}) },
  });
}

async function fetchJson<T>(url: string): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: { Accept: 'application/json', 'User-Agent': 'gross-bros-fusion/1.0' },
      cache: 'no-store',
    });
    if (!response.ok) throw new Error(`Upstream returned HTTP ${response.status}`);
    return (await response.json()) as T;
  } finally {
    clearTimeout(timer);
  }
}

async function getXrpPrice(): Promise<Price> {
  const data = await fetchJson<Record<string, { usd?: number; usd_24h_change?: number }>>(
    'https://api.coingecko.com/api/v3/simple/price?ids=ripple&vs_currencies=usd&include_24hr_change=true',
  );
  const quote = data.ripple;
  if (!quote?.usd || !Number.isFinite(quote.usd)) throw new Error('XRP price was not present in upstream response');
  return {
    symbol: 'XRP',
    name: 'XRP',
    priceUsd: quote.usd,
    change24h: quote.usd_24h_change,
    source: 'CoinGecko',
    updatedAt: new Date().toISOString(),
  };
}

interface DexPair {
  baseToken?: { address?: string; name?: string; symbol?: string };
  priceUsd?: string;
  priceChange?: { h24?: number };
  liquidity?: { usd?: number };
  chainId?: string;
}

async function getTokenPrice(identifier: string): Promise<Price> {
  // DexScreener supports XRPL pairs and accepts the issuer address or token identifier.
  const encoded = encodeURIComponent(identifier.trim());
  const pairs = await fetchJson<DexPair[]>(`https://api.dexscreener.com/token-pairs/v1/xrpl/${encoded}`);
  const pair = pairs
    .filter((item) => item.chainId === 'xrpl' && Number.isFinite(Number(item.priceUsd)))
    .sort((a, b) => Number(b.liquidity?.usd ?? 0) - Number(a.liquidity?.usd ?? 0))[0];
  if (!pair?.priceUsd || !pair.baseToken) throw new Error('No priced XRPL token pair was found');
  return {
    symbol: pair.baseToken.symbol || identifier,
    name: pair.baseToken.name || identifier,
    priceUsd: Number(pair.priceUsd),
    change24h: pair.priceChange?.h24,
    liquidityUsd: pair.liquidity?.usd,
    source: 'DexScreener XRPL DEX pairs',
    identifier,
    updatedAt: new Date().toISOString(),
  };
}

function extractPriceIdentifier(message: string): string | null {
  const lower = message.toLowerCase();
  if (!/(price|quote|worth|value|cost|trading)/.test(lower)) return null;
  if (/\bxrp\b/.test(lower)) return 'XRP';
  // XRPL token queries should include an issuer/token identifier. Do not guess one.
  const address = message.match(/\br[1-9A-HJ-NP-Za-km-z]{24,34}\b/);
  return address?.[0] ?? null;
}

function basicReply(message: string): string {
  const text = message.trim();
  if (/\b(hello|hi|hey)\b/i.test(text)) return 'Hey! I am the Gross Bros chat bot. Ask me for the XRP price or an XRPL token price.';
  if (/\b(help|what can you do)\b/i.test(text)) return 'I can answer basic questions and retrieve live XRP prices. For an XRPL token, include its issuer address and ask for its price.';
  if (/\b(snipe|sniper|copy trade|autopilot|emergency stop)\b/i.test(text)) return 'Trading actions are disabled in chat. I can provide market data, but I will not execute trades or custody funds.';
  return `You said: “${text}”\n\nI am a basic chatbot, not a trading agent. Ask “What is the XRP price?” for live market data.`;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const requested = searchParams.get('token') || searchParams.get('symbol') || 'XRP';
  try {
    const price = requested.trim().toUpperCase() === 'XRP' ? await getXrpPrice() : await getTokenPrice(requested);
    return json({ ok: true, price });
  } catch (error) {
    console.error('price lookup failed', error);
    return json({ ok: false, error: 'Unable to retrieve that live price right now.' }, { status: 502 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    const message = typeof body?.message === 'string' ? body.message.trim() : '';
    if (!message) return json({ ok: false, error: 'A non-empty message is required.' }, { status: 400 });

    const identifier = extractPriceIdentifier(message);
    if (identifier) {
      try {
        const price = identifier === 'XRP' ? await getXrpPrice() : await getTokenPrice(identifier);
        return json({ ok: true, bot: false, reply: `${price.symbol} is $${price.priceUsd.toLocaleString(undefined, { maximumFractionDigits: 8 })} USD. Source: ${price.source}.`, price });
      } catch (error) {
        console.error('chat price lookup failed', error);
        return json({ ok: true, bot: false, reply: 'I could not retrieve that live price right now. Please try again shortly.' });
      }
    }

    return json({ ok: true, bot: true, reply: basicReply(message) });
  } catch (error) {
    console.error('chat route error', error);
    return json({ ok: false, error: 'Invalid request.' }, { status: 400 });
  }
}
