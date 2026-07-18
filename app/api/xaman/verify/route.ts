import { NextResponse } from 'next/server'

/**
 * API Route: Verify Xaman Payload Status
 * 
 * After a user signs a payload in Xaman, this endpoint fetches the 
 * final result to confirm the transaction or sign-in was successful.
 */

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const uuid = searchParams.get('uuid')

  if (!uuid) {
    return NextResponse.json({ error: 'Missing payload UUID' }, { status: 400 })
  }

  try {
    const response = await fetch(`https://xumm.app/api/v1/platform/payload/${uuid}`, {
      method: 'GET',
      headers: {
        'X-API-Key': process.env.XUMM_API_KEY || '',
        'X-API-Secret': process.env.XUMM_API_SECRET || '',
      },
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error?.message || 'Failed to verify Xaman payload')
    }

    return NextResponse.json({
      signed: data.meta.signed,
      user: data.response.account, // The XRPL address of the signer
      txid: data.response.txid,
      hex: data.response.hex,
    })
  } catch (error: any) {
    console.error('Xaman Verify Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
