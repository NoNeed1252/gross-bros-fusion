import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const apiKey = process.env.XAMAN_API_KEY || process.env.XUMM_API_KEY;
  const apiSecret = process.env.XAMAN_API_SECRET || process.env.XUMM_API_SECRET;

  if (!apiKey || !apiSecret) {
    return NextResponse.json(
      { success: false, error: 'Missing Xaman/Xumm API credentials' },
      { status: 500 }
    );
  }

  // Safely parse JSON body; default to empty object for missing/invalid payloads
  let body: any = {};
  try {
    body = await request.json();
  } catch {
    // No body or invalid JSON – treat as sign‑in request
  }

  const type = body?.type === 'payment' ? 'payment' : 'signin';

  const txjson: any =
    type === 'payment'
      ? {
          TransactionType: 'Payment',
          Destination:
            process.env.XAMAN_TREASURY_ADDRESS ||
            'rG1QQv2nh2grL33zpS3pBAnr58844f25p2',
          Amount: '36000000', // 36 XRP in drops (~$20 USD)
        }
      : {
          TransactionType: 'SignIn',
        };

  const payload = { txjson };

  try {
    const response = await fetch('https://xumm.app/api/v1/platform/payload', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'x-api-secret': apiSecret,
        'content-type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      // Return explicit error details from Xaman/Xumm API
      return NextResponse.json(
        {
          success: false,
          error: data?.message || data?.error || 'Failed to create payload',
        },
        { status: response.status }
      );
    }

    return NextResponse.json({
      success: true,
      uuid: data.uuid,
      qr_png: data.refs?.qr_png,
      deeplink: data.next?.always || data.refs?.deeplink || `xumm://sign/${data.uuid}`,
      always: data.next?.always,
    });
  } catch (err) {
    // Network or unexpected error – surface a clear JSON error
    return NextResponse.json(
      { success: false, error: (err as any).message || 'Network error while contacting Xaman API' },
      { status: 500 }
    );
  }
}
