import { NextResponse } from 'next/server'

/**
 * API Route: Create Xaman Sign-In / Payment Payload
 * 
 * This endpoint communicates with the Xaman (Xumm) API to create a sign-in or 
 * payment request (Payload). It returns a websocket URL for status tracking 
 * and a deep-link/QR URL for the user to sign in their mobile wallet.
 */

export async function POST(request: Request) {
  try {
    const { type, amount, destination } = await request.json()
    const { origin } = new URL(request.url)

    // Base payload for Xaman API
    const payloadBody: any = {
      txjson: {
        TransactionType: type === 'payment' ? 'Payment' : 'SignIn',
      },
      options: {
        return_url: {
          app: `${origin}/?uuid={id}`,
          web: `${origin}/?uuid={id}`
        }
      }
    }

    if (type === 'payment') {
      payloadBody.txjson.Amount = (parseFloat(amount) * 1000000).toString() // Convert XRP to drops
      payloadBody.txjson.Destination = destination || process.env.NEXT_PUBLIC_TREASURY_WALLET
    }

    const response = await fetch('https://xumm.app/api/v1/platform/payload', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': process.env.XAMAN_API_KEY || process.env.XUMM_API_KEY || '',
        'X-API-Secret': process.env.XAMAN_API_SECRET || process.env.XUMM_API_SECRET || '',
      },
      body: JSON.stringify(payloadBody),
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error?.message || 'Failed to create Xaman payload')
    }

    // According to Xaman docs, next.always is the universal link
    // and next.app_deeplink is the custom scheme. We provide both.
    return NextResponse.json({
      uuid: data.uuid,
      next: data.always || data.next.always,
      deeplink: data.next.app_deeplink || `xumm://sign/${data.uuid}`,
      qrUrl: data.refs.qr_png,
      wsUrl: data.refs.websocket_status,
    })
  } catch (error: any) {
    console.error('Xaman Payload Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
