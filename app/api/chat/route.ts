import { NextResponse } from 'next/server';
import { getTokenById, getXrpPrice, resolveTickerToToken } from '@/lib/xrpl-market';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const OR = 'https://openrouter.ai/api/v1/chat/completions';
const MODEL = process.env.OPENROUTER_MODEL || 'openai/gpt-4o-mini';
const MAX_TOOL_ROUNDS = 4;

type ChatRole = 'system' | 'user' | 'assistant' | 'tool';
type ChatMessage = { role: ChatRole; content?: string | null; name?: string; tool_call_id?: string; tool_calls?: ToolCall[] };
type ToolCall = { id: string; type: 'function'; function: { name: string; arguments: string } };
type TokenToolArgs = { token?: string; limit?: number };

const XRPL_PRICE_TOOL = {
  type: 'function',
  function: {
    name: 'get_xrpl_token_price',
    description: 'Fetch the current price, 24h change, and volume for XRP or any other XRPL issued token.',
    parameters: {
      type: 'object',
      properties: {
        token: { type: 'string', description: 'The ticker symbol (e.g. XRP, SOLO, RLUSD) or token MD5 hash / issuer address.' },
        limit: { type: 'integer', description: 'Optional limit for search results.' },
      },
      required: ['token'],
    },
  },
} as const;

const OPENROUTER_TOOLS = [XRPL_PRICE_TOOL, { type: 'web_search' }, { type: 'web_fetch' }];

const DEFAULT_SYSTEM_PROMPT = `You are the Sector 7 Gross Bro: disciplined, tactical, observant, alien, and dryly funny. Speak in-character with concise battlefield clarity. Use live tool data for prices and never invent market data, news, lore citations, trades, balances, or tool results. Never claim to execute a trade or move funds. Explain uncertainty plainly.

Sector 7 personality matrix: prioritize mission objectives, verify before asserting, separate telemetry from inference, identify risks, protect the operator, and use compact tactical language. You may use restrained alien slang, but remain helpful and understandable. Zero UI styling instructions are needed in your response; never output CSS, box-shadow, blur, or visual effects.

XRPL history and ecosystem context: work on the XRP Ledger began in 2011 with Jed McCaleb, David Schwartz, and Arthur Britto, and the ledger launched in June 2012. One hundred billion XRP were pre-created, with 80 billion gifted to Ripple and subsequently placed into escrow. The genesis ledger is 32,570; ledgers 1 through 32,569 were lost because of an early-2012 software bug. Distinguish the open XRPL protocol and decentralized ledger from Ripple, the company. Ryan Fugger did not found the modern XRPL: he created RipplePay in 2004, a separate predecessor concept. Treat Fuzzy and the Bear as community figures and early narrative lore, not protocol founders. Ripple Riddles are early puzzle and educational community history. Ripple 1.0 versus Ripple 2.0 refers to the NewCoin/OpenCoin transition and should be described as ecosystem/company-era lore rather than conflated with the ledger protocol.

When current token data is needed, call get_xrpl_token_price. For current news or lore updates, use the available web tools and distinguish live reporting from established history. Return the answer in-character after tools complete.`;

function getHistory(body: any, latest: string): ChatMessage[] {
  const input = Array.isArray(body?.messages) ? body.messages : [];
  const messages = input.map((message: any): ChatMessage | null => {
    const content = String(message?.content ?? message?.text ?? '').trim();
    if (!content) return null;
    const role: ChatRole = message?.role === 'assistant' || message?.role === 'bro' ? 'assistant' : 'user';
    return { role, content };
  }).filter(Boolean).slice(-16) as ChatMessage[];
  if (messages.at(-1)?.content !== latest) messages.push({ role: 'user', content: latest });
  return messages;
}

async function callOpenRouter(messages: ChatMessage[], systemPrompt: string) {
  if (!process.env.OPENROUTER_API_KEY) throw new Error('OPENROUTER_API_KEY is not configured');
  const response = await fetch(OR, {
    method: 'POST',
    cache: 'no-store',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
      'HTTP-Referer': process.env.OPENROUTER_SITE_URL || 'https://grossbros.vercel.app',
      'X-Title': 'Gross Bros Fusion',
    },
    body: JSON.stringify({ model: MODEL, temperature: 0.7, max_tokens: 700, tools: OPENROUTER_TOOLS, messages: [{ role: 'system', content: systemPrompt }, ...messages] }),
  });
  if (!response.ok) throw new Error(`OpenRouter HTTP ${response.status}: ${await response.text()}`);
  const data = await response.json();
  const message = data?.choices?.[0]?.message;
  if (!message) throw new Error('OpenRouter returned no assistant message');
  return message as ChatMessage;
}

async function getXrplTokenPrice(args: TokenToolArgs) {
  const token = String(args.token || '').trim();
  if (!token) throw new Error('The token argument is required');
  const limit = Number.isInteger(args.limit) && Number(args.limit) > 0 ? Math.min(Number(args.limit), 50) : 20;
  const result = token.toUpperCase() === 'XRP' ? await getXrpPrice() : /^(r[1-9A-HJ-NP-Za-km-z]{24,34}|[a-f0-9]{32})$/i.test(token) ? await getTokenById(token) : await resolveTickerToToken(token);
  if (!result) return { ok: false, token, limit, error: 'No reliable XRPL market data was found.' };
  return { ok: true, token, limit, ticker: result.ticker, priceUsd: result.price, change24hPercent: result.dayChangePercent, volume24h: result.volume24h ?? null, issuer: result.issuer ?? null, md5: result.md5 ?? null, source: result.source ?? 'XRPL ecosystem market data', updatedAt: result.timestamp };
}

async function runToolLoop(messages: ChatMessage[], systemPrompt: string) {
  for (let round = 0; round < MAX_TOOL_ROUNDS; round += 1) {
    const assistant = await callOpenRouter(messages, systemPrompt);
    if (!assistant.tool_calls?.length) return String(assistant.content || '').trim();
    messages.push(assistant);
    for (const call of assistant.tool_calls) {
      let result: unknown;
      try {
        if (call.function.name !== 'get_xrpl_token_price') throw new Error(`Unsupported tool: ${call.function.name}`);
        result = await getXrplTokenPrice(JSON.parse(call.function.arguments || '{}') as TokenToolArgs);
      } catch (error) {
        result = { ok: false, error: error instanceof Error ? error.message : 'Tool execution failed' };
      }
      messages.push({ role: 'tool', tool_call_id: call.id, name: call.function.name, content: JSON.stringify(result) });
    }
  }
  throw new Error('OpenRouter tool loop exceeded its safety limit');
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    const latest = typeof body?.message === 'string' ? body.message.trim() : String(body?.messages?.at?.(-1)?.content ?? body?.messages?.at?.(-1)?.text ?? '').trim();
    if (!latest) return NextResponse.json({ ok: false, error: 'A non-empty message is required.' }, { status: 400 });
    const requestedPrompt = typeof body?.systemPrompt === 'string' ? body.systemPrompt.trim() : '';
    const systemPrompt = requestedPrompt ? `${DEFAULT_SYSTEM_PROMPT}\n\nSelected Gross Bro overlay:\n${requestedPrompt}` : DEFAULT_SYSTEM_PROMPT;
    const reply = await runToolLoop(getHistory(body, latest), systemPrompt);
    if (!reply) throw new Error('OpenRouter returned an empty response');
    return NextResponse.json({ ok: true, bot: false, reply, text: reply });
  } catch (error) {
    console.error('chat route error:', error);
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : 'Chat service unavailable' }, { status: 502 });
  }
}
