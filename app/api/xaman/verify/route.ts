import { NextResponse } from 'next/server'

/**
 * API Route: Verify Xaman Payload Status
 * Checks sign-in verification status and queries XRPL for balance and NFTs.
 * Includes full NFT objects for dynamic client-side resolution.
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

    const headers = {
      'X-API-Key': process.env.XAMAN_API_KEY || process.env.XUMM_API_KEY || '',
      'X-API-Secret': process.env.XAMAN_API_SECRET || process.env.XUMM_API_SECRET || '',
    }

    if (xAppToken) {
      const response = await fetch(`https://xumm.app/api/v1/platform/xapp/ott/${xAppToken}`, {
        method: 'GET',
        headers,
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error?.message || 'Failed to verify xApp Token')
      address = data.account
    } else {
      const response = await fetch(`https://xumm.app/api/v1/platform/payload/${uuid}`, {
        method: 'GET',
        headers,
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error?.message || 'Failed to verify Xaman payload')
      if (!data.meta.signed) return NextResponse.json({ signed: false })
      address = data.response.account
    }

    if (!address) return NextResponse.json({ signed: false })

    // Query balance and NFTs from XRPL
    const xrplRes = await fetch('https://xrplcluster.com', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify([
        { method: 'account_info', params: [{ account: address, ledger_index: 'validated' }] },
        { method: 'account_nfts', params: [{ account: address, limit: 400 }] }
      ]),
    })
    
    const xrplData = await xrplRes.json()
    const accountInfo = xrplData[0]?.result?.account_data
    const nfts = xrplData[1]?.result?.account_nfts || []

    const xrpBalance = accountInfo ? (Number(accountInfo.Balance) / 1000000).toFixed(2) : '0.00'

    // Filter for Galactic Gross Bros collection
    const collectionNfts = nfts.filter(
      (nft: any) =>
        nft.Issuer === 'rP1wMvanhfmsm7Af4FcHvSvfhash43LWSY' && nft.NFTokenTaxon === 1
    )

    return NextResponse.json({
      signed: true,
      user: address,
      balance: xrpBalance,
      nfts: collectionNfts,
    })
  } catch (error: any) {
    console.error('Xaman Verify Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
