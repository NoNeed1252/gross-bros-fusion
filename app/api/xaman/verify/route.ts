import { NextResponse } from 'next/server'

/**
 * API Route: Verify Xaman Payload Status
 * Checks sign-in verification status via Xaman Platform API and queries XRPL for balance and NFTs.
 * Supports both standard payload UUIDs and native xApp One-Time Tokens (xAppToken / OTT).
 */

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const uuid = searchParams.get('uuid')
  const xAppToken = searchParams.get('xAppToken')

  if (!uuid && !xAppToken) {
    return NextResponse.json({ error: 'Missing payload UUID or xAppToken' }, { status: 400 })
  }

  try {
    let address = ''

    if (xAppToken) {
      const response = await fetch(`https://xumm.app/api/v1/platform/xapp/ott/${xAppToken}`, {
        method: 'GET',
        headers: {
          'X-API-Key': process.env.XAMAN_API_KEY || process.env.XUMM_API_KEY || '',
          'X-API-Secret': process.env.XAMAN_API_SECRET || process.env.XUMM_API_SECRET || '',
        },
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error?.message || 'Failed to verify xApp Token')
      }

      address = data.account
    } else {
      const response = await fetch(`https://xumm.app/api/v1/platform/payload/${uuid}`, {
        method: 'GET',
        headers: {
          'X-API-Key': process.env.XAMAN_API_KEY || process.env.XUMM_API_KEY || '',
          'X-API-Secret': process.env.XAMAN_API_SECRET || process.env.XUMM_API_SECRET || '',
        },
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error?.message || 'Failed to verify Xaman payload')
      }

      if (!data.meta.signed) {
        return NextResponse.json({ signed: false })
      }

      address = data.response.account
    }

    if (!address) {
      return NextResponse.json({ signed: false })
    }

    // Query balance
    const balanceRes = await fetch('https://xrplcluster.com', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        method: 'account_info',
        params: [{ account: address, ledger_index: 'validated' }],
      }),
    })
    const balanceData = await balanceRes.json()
    const drops = balanceData.result?.account_data?.Balance || '0'
    const xrpBalance = (Number.parseInt(drops) / 1000000).toFixed(2)

    // Query NFTs
    const nftsRes = await fetch('https://xrplcluster.com', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        method: 'account_nfts',
        params: [{ account: address, limit: 400 }],
      }),
    })
    const nftsData = await nftsRes.json()
    const nfts = nftsData.result?.account_nfts || []

    const ownedNfts = nfts
      .filter(
        (nft: any) =>
          nft.Issuer === 'rP1wMvanhfmsm7Af4FcHvSvfhash43LWSY' && nft.NFTokenTaxon === 1
      )
      .map((nft: any) => Number.parseInt(nft.NFTokenID.slice(-8), 16).toString())

    return NextResponse.json({
      signed: true,
      user: address,
      balance: xrpBalance,
      ownedNfts,
    })
  } catch (error: any) {
    console.error('Xaman Verify Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
