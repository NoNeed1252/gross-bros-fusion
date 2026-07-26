import React, { useState, useEffect } from 'react';
import Image from 'next/image';

interface TradeTabProps {
  user?: any;
  connected?: boolean;
  mainAddress?: string;
  mainBalance?: string;
}

// Helper to generate a simple random seed string
function generateSeed(): string {
  return Math.random().toString(36).substring(2, 15);
}

export function TradeTab({ user, connected, mainAddress, mainBalance }: TradeTabProps) {
  // Vault seed and activation status persisted in localStorage
  const [vaultSeed, setVaultSeed] = useState<string>('');
  const [activated, setActivated] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  // Paywall / activation UI state
  const [payload, setPayload] = useState<
    | { always?: string; deeplink?: string; qr_png?: string }
    | null
  >(null);

  // Strategy controls (placeholders for now)
  const [gridStrategy, setGridStrategy] = useState<string>('');
  const [upperBand, setUpperBand] = useState<string>('');
  const [lowerBand, setLowerBand] = useState<string>('');
  const [stopLoss, setStopLoss] = useState<string>('');
  const [takeProfit, setTakeProfit] = useState<string>('');
  const [engineRunning, setEngineRunning] = useState<boolean>(false);

  // Detect mobile environment for deep‑link redirect
  const isMobile = typeof window !== 'undefined' && /Mobi|Android/i.test(navigator.userAgent);

  // Initialise vault seed and activation flag from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedSeed = localStorage.getItem('tgb_masterstroke_vault_seed');
      if (storedSeed) {
        setVaultSeed(storedSeed);
      } else {
        const newSeed = generateSeed();
        localStorage.setItem('tgb_masterstroke_vault_seed', newSeed);
        setVaultSeed(newSeed);
      }
      const storedActivated = localStorage.getItem('tgb_masterstroke_activated');
      setActivated(storedActivated === 'true');
    }
  }, []);

  // --- Paywall actions ----------------------------------------------------
  const handleAuthorize = async () => {
    setErrorMessage('');
    try {
      const res = await fetch('/api/xaman/payload', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setPayload({ always: data.always, deeplink: data.deeplink, qr_png: data.qr_png });
        if (isMobile && (data.always || data.deeplink)) {
          window.location.href = data.always || data.deeplink;
        }
      } else {
        setErrorMessage(data.error || 'Authorization failed');
      }
    } catch (err) {
      setErrorMessage('Network error while authorizing');
    }
  };

  const handleVerify = async () => {
    setErrorMessage('');
    try {
      const res = await fetch('/api/xaman/verify', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        localStorage.setItem('tgb_masterstroke_activated', 'true');
        setActivated(true);
      } else {
        setErrorMessage(data.error || 'Verification failed');
      }
    } catch (err) {
      setErrorMessage('Network error while verifying payment');
    }
  };

  // --- Active bot controls -------------------------------------------------
  const handleSweep = async () => {
    // Placeholder: implement sweep funds API call
    try {
      await fetch('/api/sweep', { method: 'POST' });
      alert('Sweep request sent');
    } catch (e) {
      console.error(e);
      alert('Sweep failed');
    }
  };

  const handleEngineToggle = () => {
    setEngineRunning(!engineRunning);
    // Placeholder: send engine state to backend if needed
  };

  // Render ---------------------------------------------------------------
  return (
    <div className="p-4 border border-zinc-800 bg-zinc-950 text-white">
      {/* Paywall / Authorization View */}
      {!activated && (
        <div>
          <h1 className="text-2xl font-bold mb-2">TACTICAL MASTERSTROKE</h1>
          <h2 className="text-lg mb-4">Automated XRP Ledger Execution Engine</h2>
          {connected && (
            <div className="mb-4">
              <p>Main Wallet Address: {mainAddress}</p>
              <p>Main Wallet Balance: {mainBalance}</p>
            </div>
          )}
          <p className="mb-2 text-red-500">INACTIVE — $20 USD / ~36 XRP REQUIRED</p>
          {errorMessage && (
            <div className="text-red-400 mb-2">{errorMessage}</div>
          )}
          <button
            onClick={handleAuthorize}
            className="mr-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded"
          >
            Authorize Xaman Wallet
          </button>
          <button
            onClick={handleVerify}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded"
          >
            Verify Payment & Activate
          </button>
          {payload && payload.qr_png && (
            <div className="mt-4">
              <Image src={payload.qr_png} alt="Xaman QR" width={200} height={200} />
            </div>
          )}
        </div>
      )}

      {/* Active Bot Control Center */}
      {activated && (
        <div>
          <h1 className="text-2xl font-bold mb-2">Masterstroke Control Center</h1>
          <p className="mb-2">Burner Vault Seed: {vaultSeed}</p>
          {/* Placeholder for vault address and balance */}
          <p className="mb-2">Vault Balance: --</p>
          <button
            onClick={handleSweep}
            className="mb-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded"
          >
            Sweep Funds to Main Wallet
          </button>
          <div className="grid grid-cols-1 gap-4">
            <label>
              Grid Strategy:
              <select
                value={gridStrategy}
                onChange={e => setGridStrategy(e.target.value)}
                className="ml-2 p-1 border border-zinc-800 bg-zinc-900 text-white"
              >
                <option value="">Select…</option>
                <option value="basic">Basic</option>
                <option value="advanced">Advanced</option>
              </select>
            </label>
            <label>
              Upper Band:
              <input
                type="number"
                value={upperBand}
                onChange={e => setUpperBand(e.target.value)}
                className="ml-2 p-1 border border-zinc-800 bg-zinc-900 text-white"
              />
            </label>
            <label>
              Lower Band:
              <input
                type="number"
                value={lowerBand}
                onChange={e => setLowerBand(e.target.value)}
                className="ml-2 p-1 border border-zinc-800 bg-zinc-900 text-white"
              />
            </label>
            <label>
              Stop Loss (%):
              <input
                type="number"
                value={stopLoss}
                onChange={e => setStopLoss(e.target.value)}
                className="ml-2 p-1 border border-zinc-800 bg-zinc-900 text-white"
              />
            </label>
            <label>
              Take Profit (%):
              <input
                type="number"
                value={takeProfit}
                onChange={e => setTakeProfit(e.target.value)}
                className="ml-2 p-1 border border-zinc-800 bg-zinc-900 text-white"
              />
            </label>
            <div className="flex items-center">
              <span className="mr-2">Engine:</span>
              <button
                onClick={handleEngineToggle}
                className={`px-4 py-2 rounded ${engineRunning ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'}`}
              >
                {engineRunning ? 'Pause' : 'Start'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default TradeTab;
