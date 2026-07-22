import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const { messages, systemPrompt } = await req.json();
  
  // Extract latest message text from the 'text' property (frontend sends .text)
  const latestMessage = messages?.[messages.length - 1];
  const latestText = latestMessage?.text || "";
  const latestLower = latestText.toLowerCase();

  // 1. Data-first pipe for XRPL/Tokens/NFTs
  if (latestLower.includes('xrp') || latestLower.includes('token') || latestLower.includes('nft') || latestLower.includes('price')) {
    const res = await fetch('https://api.xrpl' + '.to/v1/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: latestLower })
    });
    const data = await res.json();
    return NextResponse.json({ text: JSON.stringify(data) });
  }

  // 2. LLM pipe for general chat - Format history correctly for OpenRouter
  // Map frontend's { role, text } to OpenRouter's { role, content }
  const formattedMessages = [
    { role: 'system', content: systemPrompt || 'You are a professional assistant.' },
    ...messages.map((m: any) => ({ role: m.role === 'bro' ? 'assistant' : 'user', content: m.text }))
  ];

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
      messages: formattedMessages
    })
  });

  const chatData = await response.json();
  const content = chatData?.choices?.[0]?.message?.content || "No response.";
  return NextResponse.json({ text: content });
}
