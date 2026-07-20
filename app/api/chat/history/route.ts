import { NextResponse } from 'next/server'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const address = searchParams.get('address')

  if (!address || !isSupabaseConfigured()) {
    return NextResponse.json({ messages: [] })
  }

  try {
    const { data, error } = await supabase
      .from('chat_history')
      .select('*')
      .eq('wallet_address', address)
      .order('created_at', { ascending: true })
      .limit(100)

    if (error) throw error
    return NextResponse.json({ messages: data || [] })
  } catch (err) {
    console.error('Chat History GET Error:', err)
    return NextResponse.json({ messages: [] })
  }
}

export async function POST(req: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 503 })
  }

  try {
    const { address, role, text } = await req.json()

    if (!address || !role || !text) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('chat_history')
      .insert([{ 
        wallet_address: address, 
        role, 
        text,
        created_at: new Date().toISOString() 
      }])
      .select()

    if (error) throw error
    return NextResponse.json({ success: true, data })
  } catch (err) {
    console.error('Chat History POST Error:', err)
    return NextResponse.json({ error: 'Failed to persist message' }, { status: 500 })
  }
}
