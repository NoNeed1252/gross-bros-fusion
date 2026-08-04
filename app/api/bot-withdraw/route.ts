import { NextResponse } from 'next/server';
import { getBotWalletSeed, getBotWalletAddress } from '@/app/lib/botWallet';
import { Wallet, Client, Payment } from 'xrpl';

export async function POST(request: Request) {
  try {
    const { nftId, ownerAddress, amount, destination } = await request.json();
    if (!nftId || !ownerAddress || !amount || !destination) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    // Safety: ensure destination matches owner address
    if (destination !== ownerAddress) {
      return NextResponse.json({ error: 'Destination must be the owner address' }, { status: 400 });
    }
    const seed = await getBotWalletSeed(nftId);
    if (!seed) {
      return NextResponse.json({ error: 'Bot wallet not found for this NFT' }, { status: 404 });
    }
    const wallet = Wallet.fromSeed(seed);
    const botAddress = wallet.classicAddress;
    const client = new Client('wss://xrplcluster.com');
    await client.connect();
    try {
      const payment: Payment = {
        TransactionType: 'Payment',
        Account: botAddress,
        Destination: destination,
        Amount: (Number(amount) * 1_000_000).toString(), // drops
      };
      const prepared = await client.autofill(payment, { wallet });
      const signed = wallet.sign(prepared);
      const result = await client.submitAndWait(signed.tx_blob);
      if (result.result.meta.TransactionResult !== 'tesSUCCESS') {
        return NextResponse.json({ error: 'Withdrawal transaction failed' }, { status: 500 });
      }
      return NextResponse.json({ success: true, txHash: result.result.hash });
    } finally {
      await client.disconnect();
    }
  } catch (e: any) {
    console.error('bot-withdraw error', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
