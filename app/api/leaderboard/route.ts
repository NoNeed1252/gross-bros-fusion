import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

const GROSS_BROS_ISSUER = 'rP1wMvanhfmsm7Af4FcHvSvfhash43LWSY'
const GROSS_BROS_TAXON = 1
const XRPL_NODES = [
  'https://xrplcluster.com',
  'https://s1.ripple.com:51234',
  'https://xrpl.link',
]

function getAdminSupabase() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceRoleKey) {
    throw new Error('Supabase server credentials are not configured')
  }

  return createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

function isValidXrplAddress(address: unknown): address is string {
  return (
    typeof address === 'string' &&
    /^r[1-9A-HJ-NP-Za-km-z]{24,34}$/.test(address)
  )
}

async function ownsGrossBro(address: string): Promise<boolean> {
  console.log('Verifying address for Gross Bros ownership:', address)
  let successfulResponse = false

  for (const node of XRPL_NODES) {
    try {
      console.log('Querying XRPL node:', node)
      const response = await fetch(node, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          method: 'account_nfts',
          params: [{ account: address, ledger_index: 'validated', limit: 400 }],
        }),
        signal: AbortSignal.timeout(6000),
      })

      if (!response.ok) {
        console.error('Node returned non-OK status:', node, response.status)
        continue
      }

      const payload = await response.json()
      console.log('Parsing XRPL response:', node)

      if (payload.error) {
        console.error('Node returned RPC error:', node, payload.error)
        continue
      }

      if (payload.result?.error) {
        console.error('Node returned result-level error:', node, payload.result.error)
        continue
      }

      successfulResponse = true
      const nfts = payload.result?.account_nfts || []
      console.log('XRPL NFT count:', node, nfts.length)

      if (
        nfts.some(
          (nft: { Issuer?: string; NFTokenTaxon?: number }) =>
            nft.Issuer === GROSS_BROS_ISSUER &&
            nft.NFTokenTaxon === GROSS_BROS_TAXON
        )
      ) {
        return true
      }
    } catch (error) {
      console.error('XRPL node request failed:', node, error)
      continue
    }
  }

  if (!successfulResponse) {
    throw new Error('XRPL ownership verification failed')
  }

  return false
}

export async function GET() {
  try {
    const supabase = getAdminSupabase()
    const { data, error } = await supabase
      .from('leaderboard')
      .select('wallet_address, score, wave, created_at')
      .order('score', { ascending: false })
      .limit(50)

    if (error) throw error

    return NextResponse.json({
      scores: (data || []).map((entry) => ({
        address: entry.wallet_address,
        score: entry.score,
        wave: entry.wave,
        created_at: entry.created_at,
      })),
    })
  } catch (error) {
    console.error('Leaderboard GET Error:', error)
    return NextResponse.json({ error: 'Failed to load leaderboard' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { address, score, wave } = body ?? {}
    console.log('Leaderboard POST received', { address, score, wave })

    if (!isValidXrplAddress(address)) {
      console.error('Invalid classic XRPL address', { address })
      return NextResponse.json({ error: 'Invalid XRPL wallet address' }, { status: 400 })
    }

    if (!Number.isInteger(score) || score < 0) {
      console.error('Invalid score', { score })
      return NextResponse.json({ error: 'Invalid score data' }, { status: 400 })
    }

    if (!Number.isInteger(wave) || wave < 1) {
      console.error('Invalid wave', { wave })
      return NextResponse.json({ error: 'Invalid score data' }, { status: 400 })
    }

    if (!(await ownsGrossBro(address))) {
      console.error('Gross Bros ownership not verified', { address })
      return NextResponse.json(
        { error: 'Gross Bros ownership could not be verified' },
        { status: 403 }
      )
    }

    console.log('Supabase leaderboard insert starting', { address, score, wave })
    const { data, error } = await getAdminSupabase()
      .from('leaderboard')
      .insert({ wallet_address: address, score, wave })
      .select('wallet_address, score, wave, created_at')
      .single()

    if (error) {
      console.error('Supabase leaderboard insert error:', error)
      throw error
    }

    console.log('Supabase leaderboard insert succeeded:', data)
    return NextResponse.json({ success: true, data }, { status: 201 })
  } catch (error: any) {
    console.error('Leaderboard POST Error:', error)

    if (error?.message === 'Supabase server credentials are not configured') {
      return NextResponse.json(
        { error: 'Server database credentials are not configured' },
        { status: 503 }
      )
    }

    if (error?.message === 'XRPL ownership verification failed') {
      return NextResponse.json(
        { error: 'Ownership verification temporarily unavailable' },
        { status: 503 }
      )
    }

    return NextResponse.json({ error: 'Failed to submit score' }, { status: 500 })
  }
}
