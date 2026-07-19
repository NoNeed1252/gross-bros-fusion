import { NextResponse } from 'next/server'

/**
 * API Route: Verify Xaman Payload Status
 * Checks sign-in verification status and queries XRPL for balance and NFTs.
 * Includes full NFT objects with enriched server-side metadata resolution.
 */

function hexToUtf8(hex: string): string {
  if (!hex) return ''
  try {
    const matched = hex.match(/.{1,2}/g)
    if (!matched) return ''
    const bytes = new Uint8Array(matched.map(byte => parseInt(byte, 16)))
    return new TextDecoder().decode(bytes)
  } catch (e) {
    return ''
  }
}

async function fetchIpfsMetadata(uri: string) {
  if (!uri) return null
  const cleanUri = uri.replace('ipfs://', '').replace('https://ipfs.io/ipfs/', '').replace('https://cloudflare-ipfs.com/ipfs/', '')
  const gateways = [
    `https://cloudflare-ipfs.com/ipfs/${cleanUri}`,
    `https://ipfs.io/ipfs/${cleanUri}`,
  ]

  for (const url of gateways) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(5000) })
      if (res.ok) return await res.json()
    } catch (e) {
      continue
    }
  }
  return null
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const uuid = searchParams.get('uuid')
  // Handle casing variations for Xaman/xApp support
  const xAppToken = searchParams.get('xAppToken') || searchParams.get('xappToken') || searchParams.get('ott')

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
      if (!response.ok) return NextResponse.json({ error: data.error?.message || 'Failed to verify xApp Token' }, { status: response.status })
      address = data.account
    } else {
      const response = await fetch(`https://xumm.app/api/v1/platform/payload/${uuid}`, {
        method: 'GET',
        headers,
      })
      const data = await response.json()
      if (!response.ok) return NextResponse.json({ error: data.error?.message || 'Failed to verify Xaman payload' }, { status: response.status })
      if (!data.meta.signed) return NextResponse.json({ signed: false, status: 'pending' })
      address = data.response.account
    }

    if (!address) return NextResponse.json({ signed: false, status: 'expired' })

    // Query balance and NFTs from XRPL
    const xrplRes = await fetch('https://xrplcluster.com', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify([
        { method: 'account_info', params: [{ account: address, ledger_index: 'validated' }] },
        { method: 'account_nfts', params: [{ account: address, limit: 400 }] }
      ]),
    })
    
    if (!xrplRes.ok) throw new Error('XRPL Node connection failed')
    
    const xrplData = await xrplRes.json()
    const accountInfo = xrplData[0]?.result?.account_data
    const nfts = xrplData[1]?.result?.account_nfts || []

    const xrpBalance = accountInfo ? (Number(accountInfo.Balance) / 1000000).toFixed(2) : '0.00'

    // Filter for Galactic Gross Bros collection
    const collectionNfts = nfts.filter(
      (nft: any) =>
        nft.Issuer === 'rP1wMvanhfmsm7Af4FcHvSvfhash43LWSY' && nft.NFTokenTaxon === 1
    )

    // Enriched Metadata resolution
    const enrichedNfts = await Promise.all(collectionNfts.map(async (nft: any) => {
      const uri = hexToUtf8(nft.URI)
      const metadata = await fetchIpfsMetadata(uri)
      return { ...nft, enrichedMetadata: metadata }
    }))

    return NextResponse.json({
      signed: true,
      user: address,
      balance: xrpBalance,
      nfts: enrichedNfts,
    })
  } catch (error: any) {
    console.error('Xaman Verify Error:', error)
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
  }
}
