import { NextResponse } from 'next/server'

/**
 * API Route: Create Xaman Sign-In / Payment Payload
 *
 * This endpoint communicates with the Xaman (Xumm) API to create a sign‑in or
 * payment request (Payload). It returns a websocket URL for status tracking and
 * a deep‑link/QR URL for the user to sign in their mobile wallet.
 */

export async function POST(request: Request) {
  try {
    // The front‑end (TradeTab) sends { amount, currency, userAddress }.
    // We treat any request with an amount as a payment payload.
    const { amount, currency, userAddress } = await request.json()
    const { origin } = new URL(request.url)

    // Basic validation – ensure we have the required fields.
    if (!amount || !currency || !userAddress) {
      return NextResponse.json({ error: 'Missing required payload parameters' }, { status: 400 })
    }

    // Verify that Xaman credentials are present. If they are missing we fail
    // early with a clear message rather than a generic parse error later.
    const apiKey = process.env.XAMAN_API_KEY || process.env.XUMM_API_KEY || ''
    const apiSecret = process.env.XAMAN_API_SECRET || process.env.XUMM_API_SECRET || ''
    if (!apiKey || !apiSecret) {
      return NextResponse.json({ error: 'Xaman API credentials not configured' }, { status: 500 })
    }

    // Build the payload expected by the Xumm/Xaman platform.
    const payloadBody: any = {
      txjson: {
        TransactionType: 'Payment',
      },
      options: {
        return_url: {
          app: `${origin}/?uuid={id}`,
          web: `${origin}/?uuid={id}`,
        },
      },
    }

    // Convert the amount to drops if the currency is XRP; otherwise forward the
    // amount as‑is. Xaman can handle non‑XRP amounts via its own conversion – we
    // simply pass the value.
    if (currency.toUpperCase() === 'XRP') {
      payloadBody.txjson.Amount = (parseFloat(amount) * 1_000_000).toString()
    } else {
      // For USD or other fiat we attach the amount under a custom field.
      // Xaman will interpret this based on the Destination account settings.
      payloadBody.txjson.Amount = amount
    }
    payloadBody.txjson.Destination = userAddress

    const response = await fetch('https://xumm.app/api/v1/platform/payload', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': apiKey,
        'X-API-Secret': apiSecret,
      },
      body: JSON.stringify(payloadBody),
    })

    // Guard against non‑JSON or malformed responses.
    let data: any = {}
    try {
      data = await response.json()
    } catch (jsonErr) {
      console.error('Failed to parse Xaman response as JSON', jsonErr)
      return NextResponse.json({ error: 'Invalid response format from Xaman API' }, { status: 502 })
    }

    if (!response.ok) {
      // Propagate the error message from Xaman if available.
      const apiMsg = data.error?.message || 'Failed to create Xaman payload'
      return NextResponse.json({ error: apiMsg }, { status: response.status })
    }

    // Map the Xaman response to the shape the UI expects.
    const result = {
      payload_id: data.uuid,
      uuid: data.uuid,
      qr_png: data.refs?.qr_png,
      next_url: data.next?.always,
      deeplink: `xumm://sign/${data.uuid}`,
      wsUrl: data.refs?.websocket_status,
    }

    // Defensive sanity check – if critical fields are missing we surface a clear error.
    if (!result.payload_id || !result.qr_png || !result.next_url) {
      console.error('Xaman payload missing expected fields', result)
      return NextResponse.json({ error: 'Unexpected Xaman API response format' }, { status: 502 })
    }

    return NextResponse.json(result)
  } catch (error: any) {
    console.error('Xaman Payload Error:', error)
    return NextResponse.json({ error: error.message ?? 'Internal server error' }, { status: 500 })
  }
}
