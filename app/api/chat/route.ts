import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json();
    
    // Sanitize history: remove any system-level leaks
    const cleanHistory = messages.filter((m: any) => 
      m.role === 'user' || m.role === 'assistant'
    );
    
    const lastMsg = [...cleanHistory].reverse().find(m => m.role === 'user')?.content || "";

    // Market data bypass
    const match = lastMsg.match(/\$[a-zA-Z0-9]+/);
    if (match) {
      const sym = match[0].replace('$', '').toUpperCase();
      
      const res = await fetch('https://api.xrpl.to/v1/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'User-Agent': 'Mozilla/5.0' },
        body: JSON.stringify({ search: sym, limit: 1 })
      });

      if (res.ok) {
        const d = await res.json();
        if (d.success && d.tokens?.length > 0) {
          const t = d.tokens[0];
          return NextResponse.json({ 
            text: `${t.token || t.currency}: $${parseFloat(t.usd).toFixed(6)} (${t.pro24h >= 0 ? '+' : ''}${t.pro24h}% 24h)` 
          }, { status: 200 });
        }
      }
      return NextResponse.json({ text: "Data unavailable." }, { status: 200 });
    }

    // Config for conversational model
    const config = {
      role: "system",
      content: "Assistant role: professional, direct, no persona, no filler."
    };
    
    return NextResponse.json({ 
      text: "Acknowledged.",
      model_config: config,
      history: cleanHistory
    }, { status: 200 });

  } catch (err) {
    return NextResponse.json({ text: "Error." }, { status: 200 });
  }
}
