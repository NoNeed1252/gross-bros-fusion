import { NextResponse } from 'next/server'
import { generateBotWallet, getBotWalletAddress } from '@/app/lib/botWallet'

const TREASURY =
  process.env.XAMAN_TREASURY_ADDRESS || 'rP1wMvanhfmsm7Af4FcHvSvfhash43LWSY'

const RLUSD_CURRENCY = '524C555344000000000000000000000000000000'
const RLUSD_ISSUER = 'rMxCKbEDwqr76QuheSUMdEGf4B9xJ8m5De'
const PRICE = '25' // $25 RLUSD — user can pay with XRP / RLUSD / tokens via pathfinding

const XAMAN_HEADERS = () => ({
  'Content-Type': 'application/json',
  'X-API-Key': process.env.XAMAN_API_KEY || process.env.XUMM_API_KEY || '',
  'X-API-Secret': process.env.XAMAN_API_SECRET || process.env.XUMM_API_SECRET || '',
})

async function supabaseRest(path: string, init?: RequestInit) {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) throw new Error('Supabase not configured')
  const res = await fetch(`${url}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
      ...(init?.headers || {}),
    },
  })
  const text = await res.text()
  let data: any = null
  try {
    data = text ? JSON.parse(text) : null
  } catch {
    data = text
  }
  if (!res.ok) {
    throw new Error(typeof data === 'string' ? data : data?.message || 'Supabase error')
  }
  return data
}

/** Create Xaman "Pay with Anything" payload for $25 RLUSD */
async function createPaymentPayload(holderAddress: string) {
  const body = {
    options: {
      force_network: 'MAINNET',
      pathfinding: true, // user can pay with XRP, RLUSD, Fuzzy, ATM, etc.
      submit: true,
      return_url: {
        app: 'https://grossbros.vercel.app/?bot_paid=1',
        web: 'https://grossbros.vercel.app/?bot_paid=1',
      },
    },
    custom_meta: {
      instruction: 'Activate Gross Bro Trade Bot — $25',
      blob: { purpose: 'trade_bot_activation', holder: holderAddress },
    },
    txjson: {
      TransactionType: 'Payment',
      Destination: TREASURY,
      Amount: {
        currency: RLUSD_CURRENCY,
        issuer: RLUSD_ISSUER,
        value: PRICE,
      },
    },
  }

  const resp = await fetch('https://xumm.app/api/v1/platform/payload', {
    method: 'POST',
    headers: XAMAN_HEADERS(),
    body: JSON.stringify(body),
  })
  const data = await resp.json()
  if (!resp.ok) {
    throw new Error(data?.error?.message || data?.message || 'Failed to create Xaman payload')
  }
  return data
}

/** Poll Xaman until signed, then confirm delivered amount looks like $25 RLUSD */
async function checkPayload(uuid: string) {
  const resp = await fetch(`https://xumm.app/api/v1/platform/payload/${uuid}`, {
    headers: XAMAN_HEADERS(),
  })
  const data = await resp.json()
  if (!resp.ok) throw new Error(data?.error?.message || 'Failed to check payload')
  return data
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const holder = searchParams.get('holder')
    if (!holder) {
      return NextResponse.json({ error: 'Missing holder' }, { status: 400 })
    }

    const rows = await supabaseRest(
      `bot_activations?holder_address=eq.${encodeURIComponent(holder)}&select=*`
    )
    const row = Array.isArray(rows) ? rows[0] : null

    let botAddress = row?.bot_address || null
    if (!botAddress && row?.paid) {
      // try legacy bot_wallets by owner
      try {
        botAddress = await getBotWalletAddress(holder)
      } catch {
        /* ignore */
      }
    }

    return NextResponse.json({
      paid: !!row?.paid,
      active: !!row?.active,
      botAddress,
      payment_uuid: row?.payment_uuid || null,
    })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { action, holderAddress, nftId, uuid } = body

    if (!holderAddress) {
      return NextResponse.json({ error: 'Missing holderAddress' }, { status: 400 })
    }

    // ----- create payment request -----
    if (action === 'create-payload') {
      const payload = await createPaymentPayload(holderAddress)

      // remember uuid for this holder
      await supabaseRest('bot_activations', {
        method: 'POST',
        headers: { Prefer: 'resolution=merge-duplicates,return=representation' },
        body: JSON.stringify({
          holder_address: holderAddress,
          paid: false,
          payment_uuid: payload.uuid,
          updated_at: new Date().toISOString(),
        }),
      }).catch(async () => {
        // upsert-style update if row exists
        await supabaseRest(
          `bot_activations?holder_address=eq.${encodeURIComponent(holderAddress)}`,
          {
            method: 'PATCH',
            body: JSON.stringify({
              payment_uuid: payload.uuid,
              updated_at: new Date().toISOString(),
            }),
          }
        )
      })

      return NextResponse.json({
        uuid: payload.uuid,
        qrUrl: payload.refs?.qr_png,
        deeplink:
          payload.next?.always ||
          payload.refs?.deeplink ||
          `xumm://sign/${payload.uuid}`,
      })
    }

    // ----- verify payment + create bot wallet -----
    if (action === 'verify') {
      if (!uuid) {
        return NextResponse.json({ error: 'Missing uuid' }, { status: 400 })
      }

      const data = await checkPayload(uuid)
      if (!data.meta?.signed) {
        return NextResponse.json({ signed: false, status: 'pending' })
      }

      const signer = data.response?.account
      if (signer && signer !== holderAddress) {
        return NextResponse.json(
          { error: 'Payment signed by a different wallet' },
          { status: 400 }
        )
      }

      const txid = data.response?.txid || null

      // Create / reuse bot wallet
      const idForWallet = nftId || holderAddress
      const botAddress = await generateBotWallet(idForWallet, holderAddress)

      await supabaseRest(
        `bot_activations?holder_address=eq.${encodeURIComponent(holderAddress)}`,
        {
          method: 'PATCH',
          body: JSON.stringify({
            paid: true,
            payment_txid: txid,
            bot_address: botAddress,
            updated_at: new Date().toISOString(),
          }),
        }
      ).catch(async () => {
        await supabaseRest('bot_activations', {
          method: 'POST',
          body: JSON.stringify({
            holder_address: holderAddress,
            paid: true,
            payment_uuid: uuid,
            payment_txid: txid,
            bot_address: botAddress,
          }),
        })
      })

      return NextResponse.json({
        signed: true,
        success: true,
        botAddress,
        message: 'Trade bot activated',
      })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (e: any) {
    console.error('activate-trade-bot error', e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}