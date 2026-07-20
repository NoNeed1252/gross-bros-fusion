import { NextResponse } from 'next/server'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function GET() {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ scores: [] })
  }

  try {
    const { data, error } = await supabase
      .from('leaderboard')
      .select('*')
      .order('score', { ascending: false })
      .limit(20)

    if (error) throw error
    return NextResponse.json({ scores: data || [] })
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
    const { address, score, wave, bro_name, bro_image } = await req.json()

    if (!address || typeof score !== 'number') {
      return NextResponse.json({ error: 'Invalid score data' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('leaderboard')
      .insert([{ 
        address, 
        score, 
        wave, 
        bro_name, 
        bro_image,
        created_at: new Date().toISOString() 
      }])
      .select()

    if (error) throw error
    return NextResponse.json({ success: true, data })
  } catch (err) {
    console.error('Leaderboard POST Error:', err)
    return NextResponse.json({ error: 'Failed to submit score' }, { status: 500 })
  }
}
