import { NextResponse } from 'next/server'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function GET() {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ scores: [] })
  }

  try {
    // UPDATED: Querying 'operatives' table which exists in 'Gross Bros Stats' DB
    // mapping wallet_address to address, and total_score to score
    const { data, error } = await supabase
      .from('operatives')
      .select('wallet_address, total_score, handle')
      .order('total_score', { ascending: false })
      .limit(20)

    if (error) throw error

    // Map the internal column names to the frontend's expected leaderboard format
    const formattedScores = (data || []).map((op: any) => ({
      address: op.wallet_address,
      score: op.total_score,
      bro_name: op.handle || 'Operative',
      wave: 1
    }))

    return NextResponse.json({ scores: formattedScores })
  } catch (err) {
    console.error('Leaderboard GET Error:', err)
    return NextResponse.json({ scores: [] })
  }
}

export async function POST(req: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 503 })
  }

  try {
    const { address, score } = await req.json()

    if (!address || typeof score !== 'number') {
      return NextResponse.json({ error: 'Invalid score data' }, { status: 400 })
    }

    // UPDATED: Upsert into 'operatives' table using wallet_address as key
    const { data, error } = await supabase
      .from('operatives')
      .upsert({ 
        wallet_address: address, 
        total_score: score,
        updated_at: new Date().toISOString() 
      }, { onConflict: 'wallet_address' })
      .select()

    if (error) throw error
    return NextResponse.json({ success: true, data })
  } catch (err) {
    console.error('Leaderboard POST Error:', err)
    return NextResponse.json({ error: 'Failed to submit score' }, { status: 500 })
  }
}
