import { NextResponse } from 'next/server';
import { generateBotWallet } from '@/app/lib/botWallet';
import crypto from 'crypto';
import { Wallet, Client, AccountSet, Payment } from 'xrpl';

/** Helper to call Xaman payload API for RLUSD payment */
async function createXamanPayload(): Promise<any> {
  const treasury = process.env.XAMAN_TREASURY_ADDRESS || 'rG1QQv2nh2grL33zpS3pBAnr58844f25p2';
  const rlusdCurrency = '524C555344000000000000000000000000000000'; // hex for RLUSD
  const rlusdIssuer = 'rMxCKbEDwqr76QuheSUMdEGf4B9xJ8m5De';

  const payloadBody = {
    txjson: {
      TransactionType: 'Payment',
      Destination: treasury,
      Amount: {
        currency: rlusdCurrency,
        value: '20',
        issuer: rlusdIssuer,
      },
    },
    options: {
      submit: true,
    },
  };

  const resp = await fetch('https://xumm.app/api/v1/platform/payload', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': process.env.XAMAN_API_KEY || process.env.XUMM_API_KEY || '',
      'X-API-Secret': process.env.XAMAN_API_SECRET || process.env.XUMM_API_SECRET || '',
    },
    body: JSON.stringify(payloadBody),
  });
  const data = await resp.json();
  if (!resp.ok) throw new Error(data.error?.message || 'Xaman payload creation failed');
  return data;
}

/** Verify a transaction on XRPL for RLUSD payment */
async function verifyTransaction(txHash: string): Promise<boolean> {
  const client = new Client('wss://xrplcluster.com');
  await client.connect();
  try {
    const tx = await client.request({ command: 'tx', transaction: txHash });
    const meta = tx.result.meta;
    if (meta.TransactionResult !== 'tesSUCCESS') return false;
    // Delivered amount can be in meta.DeliveredAmount or meta.delivered_amount depending on version
    const delivered = meta.DeliveredAmount || meta.delivered_amount;
    if (!delivered) return false;
    // Expect issued token object
    if (typeof delivered === 'object') {
      const { currency, value, issuer } = delivered;
      if (
        currency === 'RLUSD' ||
        currency === '524C555344000000000000000000000000000000'
      ) {
        const amt = parseFloat(value);
        return amt >= 19.5;
      }
    }
    return false;
  } finally {
    await client.disconnect();
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { nftId, ownerAddress, action } = body;
    if (!nftId || !ownerAddress || !action) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    if (action === 'create-payload') {
      const payload = await createXamanPayload();
      const result = {
        uuid: payload.uuid,
        qrUrl: payload.refs?.qr_png,
        deeplink: payload.refs?.qr_uri || `xumm://sign/${payload.uuid}`,
      };
      return NextResponse.json(result);
    }
    if (action === 'verify') {
      const { txHash } = body;
      if (!txHash) {
        return NextResponse.json({ error: 'txHash required for verification' }, { status: 400 });
      }
      const ok = await verifyTransaction(txHash);
      if (!ok) {
        return NextResponse.json({ success: false, message: 'Transaction verification failed' }, { status: 400 });
      }
      const botAddress = await generateBotWallet(nftId, ownerAddress);
      return NextResponse.json({ success: true, message: 'Fusion activated!', botAddress });
    }
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (e: any) {
    console.error('activate-trade-bot error', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
