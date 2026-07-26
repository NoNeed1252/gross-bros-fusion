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

  let body: any = {};
  try {
    body = await request.json();
  } catch {
    // ignore parse errors, default to signin
  }

  const type = body?.type === 'payment' ? 'payment' : 'signin';

  const txjson: any =
    type === 'payment'
      ? {
          TransactionType: 'Payment',
          Destination:
            process.env.XAMAN_TREASURY_ADDRESS ||
            'rG1QQv2nh2grL33zpS3pBAnr58844f25p2',
          Amount: '36000000', // 36 XRP in drops
        }
      : {
          TransactionType: 'SignIn',
        };

  const payload = { txjson };

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
    return NextResponse.json({ success: false, error: data }, { status: response.status });
  }

  return NextResponse.json({
    success: true,
    uuid: data.uuid,
    qr_png: data.refs?.qr_png,
    deeplink: data.next?.always || data.refs?.deeplink || `xumm://sign/${data.uuid}`,
    always: data.next?.always,
  });
}
