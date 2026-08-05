import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || 'openai/gpt-4o-mini';
const REQUEST_TIMEOUT_MS = 10_000;

type ChatMessage = {
  role?: string;
  text?: string;
  content?: string;
};

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
    headers: { 'Cache-Control': 'no-store', ...(init?.headers ?? {}) },
  });
}

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      ...init,
      signal: controller.signal,
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error(`Upstream request failed with HTTP ${response.status}`);
    }

    return (await response.json()) as T;
  } finally {
    clearTimeout(timer);
  }
}

async function getXrpPrice(): Promise<Price> {
  const data = await fetchJson<Record<string, { usd?: number; usd_24h_change?: number }>>(
    'https://api.coingecko.com/api/v3/simple/price?ids=ripple&vs_currencies=usd&include_24hr_change=true',
    { headers: { Accept: 'application/json' } },
  );

  const quote = data.ripple;
  if (!quote?.usd || !Number.isFinite(quote.usd)) {
    throw new Error('XRP price was missing from the provider response');
  }

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
  chainId?: string;
  baseToken?: { address?: string; name?: string; symbol?: string };
  priceUsd?: string;
  priceChange?: { h24?: number };
  liquidity?: { usd?: number };
}

interface DexSearchResponse {
  pairs?: DexPair[];
}

async function getXrplTokenPrice(identifier: string): Promise<Price> {
  const encoded = encodeURIComponent(identifier.trim());
  let pairs: DexPair[] = [];

  try {
    pairs = await fetchJson<DexPair[]>(
      `https://api.dexscreener.com/token-pairs/v1/xrpl/${encoded}`,
      { headers: { Accept: 'application/json' } },
    );
  } catch {
    const search = await fetchJson<DexSearchResponse>(
      `https://api.dexscreener.com/latest/dex/search?q=${encoded}`,
      { headers: { Accept: 'application/json' } },
    );
    pairs = search.pairs || [];
  }

  const normalized = identifier.toLowerCase();
  const pair = pairs
    .filter((item) => item.chainId === 'xrpl' && Number.isFinite(Number(item.priceUsd)))
    .filter((item) => {
      const symbol = item.baseToken?.symbol?.toLowerCase() || '';
      const name = item.baseToken?.name?.toLowerCase() || '';
      const address = item.baseToken?.address?.toLowerCase() || '';
      return symbol === normalized || name === normalized || address === normalized || pairs.length === 1;
    })
    .sort((a, b) => Number(b.liquidity?.usd || 0) - Number(a.liquidity?.usd || 0))[0];

  if (!pair?.priceUsd || !pair.baseToken) {
    throw new Error(`No live XRPL market was found for ${identifier}`);
  }

  return {
    symbol: pair.baseToken.symbol || identifier,
    name: pair.baseToken.name || identifier,
    priceUsd: Number(pair.priceUsd),
    change24h: pair.priceChange?.h24,
    liquidityUsd: pair.liquidity?.usd,
    source: 'DexScreener XRPL markets',
    identifier: pair.baseToken.address || identifier,
    updatedAt: new Date().toISOString(),
  };
}

function extractAsset(message: string): string | null {
  const lower = message.toLowerCase();
  if (!/(price|quote|worth|value|cost|trading|trade|market|how much)/.test(lower)) return null;
  if (/\bxrp\b/.test(lower)) return 'XRP';

  const issuer = message.match(/\br[1-9A-HJ-NP-Za-km-z]{24,34}\b/);
  if (issuer) return issuer[0];

  const match = message.match(/\b(RLUSD|SOLO|CSC|XMEME|ELS|ARMY|DROP|EQ|XAH|XCAD|USD|USDC)\b/i);
  return match?.[1]?.toUpperCase() || null;
}

function normalizeMessages(body: any, latestMessage: string): Array<{ role: 'user' | 'assistant'; content: string }> {
  const source = Array.isArray(body?.messages) ? body.messages : [];
  const history = source
    .map((message: ChatMessage) => {
      const content = String(message.content ?? message.text ?? '').trim();
      const role = message.role === 'assistant' || message.role === 'bro' ? 'assistant' : 'user';
      return content ? { role, content } : null;
    })
    .filter((message): message is { role: 'user' | 'assistant'; content: string } => Boolean(message))
    .slice(-12);

  if (latestMessage && history[history.length - 1]?.content !== latestMessage) {
    history.push({ role: 'user', content: latestMessage });
  }

  return history;
}

async function askOpenRouter(messages: Array<{ role: 'user' | 'assistant'; content: string }>, systemPrompt?: string): Promise<string> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error('OPENROUTER_API_KEY is not configured');

  const response = await fetchJson<{ choices?: Array<{ message?: { content?: string } }> }>(OPENROUTER_URL, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
      'HTTP-Referer': process.env.OPENROUTER_SITE_URL || 'https://grossbros.vercel.app',
      'X-Title': 'Gross Bros Fusion',
    },
    body: JSON.stringify({
      model: OPENROUTER_MODEL,
      temperature: 0.7,
      max_tokens: 500,
      messages: [
        {
          role: 'system',
          content: systemPrompt || 'You are Gross Bros Fusion, a witty and helpful XRPL assistant. Answer naturally, tell jokes when asked, and never claim to execute trades or guarantee investment returns.',
        },
        ...messages,
      ],
    }),
  });

  const content = response.choices?.[0]?.message?.content?.trim();
  if (!content) throw new Error('LLM returned an empty response');
  return content;
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    const latestMessage = typeof body?.message === 'string'
      ? body.message.trim()
      : String(body?.messages?.at?.(-1)?.content ?? body?.messages?.at?.(-1)?.text ?? '').trim();

    if (!latestMessage) return json({ ok: false, error: 'A non-empty message is required.' }, { status: 400 });

    const asset = extractAsset(latestMessage);
    if (asset) {
      try {
        const price = asset === 'XRP' ? await getXrpPrice() : await getXrplTokenPrice(asset);
        return json({
          ok: true,
          bot: false,
          reply: `${price.symbol} is $${price.priceUsd.toLocaleString(undefined, { maximumFractionDigits: 8 })} USD. Source: ${price.source}.`,
          price,
        });
      } catch (error) {
        console.error('XRPL price lookup failed:', error);
        return json({ ok: true, bot: false, reply: `I could not find a reliable live market for ${asset} right now. Try the token symbol, issuer address, or ask again shortly.` });
      }
    }

    const reply = await askOpenRouter(normalizeMessages(body, latestMessage), body?.systemPrompt);
    return json({ ok: true, bot: false, reply, text: reply });
  } catch (error) {
    console.error('chat route error:', error);
    const message = error instanceof Error ? error.message : 'Chat service unavailable';
    return json({ ok: false, error: message }, { status: 502 });
  }
}
