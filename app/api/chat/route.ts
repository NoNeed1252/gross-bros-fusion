import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || 'openai/gpt-4o-mini';
const ONTHEDEX_URL = 'https://api.onthedex.live/public/v1';
const TIMEOUT_MS = 10000;

type ChatMessage = { role?: string; text?: string; content?: string };
type Price = { symbol: string; name: string; priceUsd: number; change24h?: number; liquidityUsd?: number; source: string; identifier?: string; updatedAt: string };
type TokenRow = { currency?: string; issuer?: string; token_name?: string; name?: string; price_mid_usd?: number; market_cap?: number; volume_usd?: number; num_trades?: number };
type TokenResponse = { tokens?: TokenRow[]; error?: string; message?: string };

function json(data: unknown, init?: ResponseInit) {
  return NextResponse.json(data, { ...init, headers: { 'Cache-Control': 'no-store', ...(init?.headers ?? {}) } });
}

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const response = await fetch(url, { ...init, signal: controller.signal, cache: 'no-store', headers: { Accept: 'application/json', ...(init?.headers ?? {}) } });
    if (!response.ok) throw new Error(`Upstream HTTP ${response.status}`);
    const value = await response.json() as T;
    if (value && typeof value === 'object' && 'error' in value && (value as { error?: string }).error) throw new Error((value as { message?: string }).message || (value as { error: string }).error);
    return value;
  } finally { clearTimeout(timer); }
}

async function getXrpPrice(): Promise<Price> {
  const data = await fetchJson<Record<string, { usd?: number; usd_24h_change?: number }>>('https://api.coingecko.com/api/v3/simple/price?ids=ripple&vs_currencies=usd&include_24hr_change=true');
  const quote = data.ripple;
  if (!quote?.usd || !Number.isFinite(quote.usd)) throw new Error('XRP USD price unavailable');
  return { symbol: 'XRP', name: 'XRP', priceUsd: quote.usd, change24h: quote.usd_24h_change, source: 'CoinGecko', updatedAt: new Date().toISOString() };
}

async function resolveToken(query: string): Promise<TokenRow> {
  const requested = query.trim().toLowerCase();
  const pages = await Promise.all([1, 2, 3].map((page) => fetchJson<TokenResponse>(`${ONTHEDEX_URL}/daily/tokens?by=volume&min_trades=1&page=${page}&per_page=100`)));
  const rows = pages.flatMap((page) => page.tokens || []).filter((row) => row.currency && row.issuer);
  const exact = rows.filter((row) => row.currency!.toLowerCase() === requested || row.token_name?.toLowerCase() === requested || row.name?.toLowerCase() === requested);
  const matches = exact.length ? exact : rows.filter((row) => row.currency!.toLowerCase().includes(requested) || row.token_name?.toLowerCase().includes(requested) || row.name?.toLowerCase().includes(requested));
  const token = matches.sort((a, b) => Number(b.volume_usd || 0) - Number(a.volume_usd || 0))[0];
  if (!token?.currency || !token.issuer) throw new Error(`XRPL token not found: ${query}`);
  return token;
}

async function getXrplTokenPrice(query: string): Promise<Price> {
  let token: TokenRow;
  const issuerMatch = query.match(/^(.*)\.?(r[1-9A-HJ-NP-Za-km-z]{24,34})$/i);
  if (issuerMatch) token = { currency: issuerMatch[1].replace(/[.]/g, ''), issuer: issuerMatch[2] };
  else token = await resolveToken(query);

  const canonical = `${token.currency}.${token.issuer}`;
  const data = await fetchJson<TokenResponse>(`${ONTHEDEX_URL}/aggregator?token=${encodeURIComponent(canonical)}`);
  const result = data.tokens?.find((row) => row.currency?.toLowerCase() === token.currency!.toLowerCase() && row.issuer === token.issuer) || data.tokens?.[0];
  const priceUsd = Number(result?.price_mid_usd ?? token.price_mid_usd);
  if (!Number.isFinite(priceUsd) || priceUsd <= 0) throw new Error(`No USD price available for ${canonical}`);

  return { symbol: token.currency, name: result?.name || result?.token_name || token.token_name || token.currency, priceUsd, source: 'OnTheDEX XRPL Ledger API', identifier: canonical, updatedAt: new Date().toISOString() };
}

function extractAsset(message: string): string | null {
  const lower = message.toLowerCase();
  if (!/(price|quote|worth|value|cost|trading|trade|market|how much)/.test(lower)) return null;
  if (/\bxrp\b/.test(lower)) return 'XRP';
  const issuer = message.match(/\br[1-9A-HJ-NP-Za-km-z]{24,34}\b/);
  if (issuer) {
    const before = message.slice(0, issuer.index).match(/\b[A-Za-z0-9_-]{2,20}\s*$/);
    return before ? `${before[0].trim()}.${issuer[0]}` : issuer[0];
  }
  const symbol = message.match(/\b(RLUSD|SOLO|CSC|XMEME|ELS|ARMY|DROP|EQ|XAH|XCAD|USD|USDC)\b/i);
  return symbol?.[1]?.toUpperCase() || null;
}

function normalizeMessages(body: any, latest: string): Array<{ role: 'user' | 'assistant'; content: string }> {
  const source = Array.isArray(body?.messages) ? body.messages : [];
  const history = source.map((message: ChatMessage) => {
    const content = String(message.content ?? message.text ?? '').trim();
    if (!content) return null;
    return { role: message.role === 'assistant' || message.role === 'bro' ? 'assistant' as const : 'user' as const, content };
  }).filter((item): item is { role: 'user' | 'assistant'; content: string } => Boolean(item)).slice(-12);
  if (history[history.length - 1]?.content !== latest) history.push({ role: 'user', content: latest });
  return history;
}

async function askOpenRouter(messages: Array<{ role: 'user' | 'assistant'; content: string }>, systemPrompt?: string): Promise<string> {
  const key = process.env.OPENROUTER_API_KEY;
  if (!key) throw new Error('OPENROUTER_API_KEY is not configured');
  const data = await fetchJson<{ choices?: Array<{ message?: { content?: string } }> }>(OPENROUTER_URL, {
    method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}`, 'HTTP-Referer': process.env.OPENROUTER_SITE_URL || 'https://grossbros.vercel.app', 'X-Title': 'Gross Bros Fusion' },
    body: JSON.stringify({ model: OPENROUTER_MODEL, temperature: 0.7, max_tokens: 500, messages: [{ role: 'system', content: systemPrompt || 'You are Gross Bros Fusion, a witty and helpful XRPL assistant. Answer naturally, tell jokes when asked, never claim to execute trades, and never invent live prices.' }, ...messages] }),
  });
  const content = data.choices?.[0]?.message?.content?.trim();
  if (!content) throw new Error('LLM returned an empty response');
  return content;
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    const latest = typeof body?.message === 'string' ? body.message.trim() : String(body?.messages?.at?.(-1)?.content ?? body?.messages?.at?.(-1)?.text ?? '').trim();
    if (!latest) return json({ ok: false, error: 'A non-empty message is required.' }, { status: 400 });
    const asset = extractAsset(latest);
    if (asset) {
      try {
        const price = asset === 'XRP' ? await getXrpPrice() : await getXrplTokenPrice(asset);
        return json({ ok: true, bot: false, reply: `${price.symbol} is $${price.priceUsd.toLocaleString(undefined, { maximumFractionDigits: 8 })} USD. Source: ${price.source}.`, price });
      } catch (error) {
        console.error('XRPL price lookup failed:', error);
        return json({ ok: true, bot: false, reply: `I could not find a reliable live market for ${asset} right now. Try the token symbol, currency plus issuer address, or ask again shortly.` });
      }
    }
    const reply = await askOpenRouter(normalizeMessages(body, latest), body?.systemPrompt);
    return json({ ok: true, bot: false, reply, text: reply });
  } catch (error) {
    console.error('chat route error:', error);
    return json({ ok: false, error: error instanceof Error ? error.message : 'Chat service unavailable' }, { status: 502 });
  }
}
