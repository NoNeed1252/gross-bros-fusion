import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const { messages, input } = await req.json();
  // Safe access for content and fallback
  const latest = (messages?.[messages.length - 1]?.content || input || "").toLowerCase();

  // 1. Data-first pipe for XRPL / Tokens / NFTs
  if (latest.includes('xrp') || latest.includes('token') || latest.includes('nft') || latest.includes('price')) {
    const res = await fetch('https://api.xrpl' + '.to/v1/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: latest })
    });
    const data = await res.json();
    return NextResponse.json({ response: JSON.stringify(data) });
  }

  // 2. LLM pipe for general chat
  const response = await fetch('https://openrouter' + '.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
      'HTTP-Referer': 'https://grossbros.vercel.app',
      'X-Title': 'Gross Bros Fusion'
    },
    body: JSON.stringify({
      model: 'meta-llama/llama-3.1-8b-instruct',
      messages: [
        { role: 'system', content: 'You are a professional assistant. You are tactical, precise, and human.' },
        { role: 'user', content: input }
      ]
    })
  });

  const chatData = await response.json();
  // Safe chaining
  const content = chatData?.choices?.[0]?.message?.content || "No response.";
  return NextResponse.json({ response: content });
}
