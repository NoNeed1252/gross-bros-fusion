import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY
// Explicitly using OpenRouter's 100% free tier model
const MODEL = 'meta-llama/llama-3.1-8b-instruct:free'

export async function POST(req: Request) {
  if (!OPENROUTER_API_KEY) {
    return NextResponse.json({ error: 'OpenRouter API key not configured' }, { status: 500 })
  }

  try {
    const { messages, systemPrompt } = await req.json()

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'Invalid messages' }, { status: 400 })
    }

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'HTTP-Referer': 'https://grossbros.vercel.app',
        'X-Title': 'Gross Bros Fusion Portal',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: 'system', content: systemPrompt || 'You are a gross alien rebel survivor.' },
          ...messages.map((m: any) => ({
            role: m.role === 'user' ? 'user' : 'assistant',
            content: m.text,
          })),
        ],
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('OpenRouter Error:', errorText)
      return NextResponse.json({ error: 'OpenRouter API error' }, { status: response.status })
    }

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content || 'Bleh... something went wrong in my neural link.'

    return NextResponse.json({ text: content })
  } catch (error: any) {
    console.error('Chat API Error:', error)
    return NextResponse.json({ error: 'Failed to process chat' }, { status: 500 })
  }
}
