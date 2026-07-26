'use client';

import React, { useEffect, useState } from 'react';
import { Wallet, Client, generateSeed } from 'xrpl';

interface TradeTabProps {
  connected?: boolean;
  mainAddress?: string;
  mainBalance?: string;
}

export function TradeTab({ connected, mainAddress, mainBalance }: TradeTabProps) {
  const [seed, setSeed] = useState<string>('');
  const [address, setAddress] = useState<string>('');
  const [balance, setBalance] = useState<string>(mainBalance ?? '0');
  const [cccAuth, setCccAuth] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  // Initialise or create burner seed
  useEffect(() => {
    if (typeof window === 'undefined') return;
    let stored = localStorage.getItem('burner_wallet_seed');
    if (!stored) {
      stored = generateSeed();
      localStorage.setItem('burner_wallet_seed', stored);
    }
    setSeed(stored);
  }, []);

  // Derive address from seed
  useEffect(() => {
    if (!seed) return;
    try {
      const wallet = Wallet.fromSeed(seed);
      setAddress(wallet.classicAddress);
    } catch (e) {
      console.error('Failed to derive address', e);
    }
  }, [seed]);

  // Fetch balance and CCC NFT status
  useEffect(() => {
    if (!address) return;
    const client = new Client('wss://s.altnet.rippletest.net:51233');
    client.connect()
      .then(async () => {
        const info = await client.request({
          command: 'account_info',
          account: address,
          ledger_index: 'validated',
        });
        const drops = info.result.account_data.Balance;
        const xrp = (Number(drops) / 1_000_000).toFixed(6);
        setBalance(xrp);
        // Check for CCC NFT (placeholder: look for NFT with Issuer "ccc" if present)
        const nfts = await client.request({
          command: 'account_nfts',
          account: address,
        });
        const hasCcc = nfts.result.account_nfts?.some((n: any) => n.Issuer?.toLowerCase().includes('ccc')) ?? false;
        setCccAuth(hasCcc);
      })
      .catch((e) => console.error('XRPL client error', e))
      .finally(() => {
        setLoading(false);
        client.disconnect();
      });
  }, [address]);

  const fundLink = 'https://xaman.app/deposit'; // placeholder link for Xaman deposit QR

  return (
    <div className="bg-zinc-950 border border-zinc-800 text-white p-4">
      <h2 className="text-xl font-semibold mb-2">Burner Wallet Portal</h2>
      {loading ? (
        <p>Loading wallet information…</p>
      ) : (
        <>
          <p className="mb-1"><strong>Address:</strong> {address}</p>
          <p className="mb-1"><strong>Balance:</strong> {balance} XRP</p>
          <p className="mb-3"><strong>CCC NFT Authorized:</strong> {cccAuth ? 'Yes' : 'No'}</p>
          <a
            href={fundLink}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded"
          >
            Fund via Xaman
          </a>
        </>
      )}
    </div>
  );
}

export default TradeTab;
