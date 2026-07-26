'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';

interface TradeTabProps {
  mainAddress?: string;
  mainBalance?: string;
}

// Helper to truncate XRPL address (first 6 + ... + last 6)
function truncateAddress(addr: string): string {
  if (!addr) return '';
  return `${addr.slice(0, 6)}...${addr.slice(-6)}`;
}

export function TradeTab({ mainAddress = '', mainBalance = '' }: TradeTabProps) {
  // Engine state – unlocked by default (paywall bypassed)
  const [engineActive, setEngineActive] = useState<boolean>(true);
  const [engineRunning, setEngineRunning] = useState<boolean>(false);

  // Burner vault placeholder values (could be fetched from backend later)
  const [burnerAddress, setBurnerAddress] = useState<string>('');
  const [burnerBalance, setBurnerBalance] = useState<string>('0');

  // Strategy controls
  const [strategy, setStrategy] = useState<string>('Grid Trading');
  const [upperBand, setUpperBand] = useState<string>('');
  const [lowerBand, setLowerBand] = useState<string>('');
  const [stopLoss, setStopLoss] = useState<string>('');
  const [takeProfit, setTakeProfit] = useState<string>('');

  // Initialise burner wallet (placeholder generation)
  useEffect(() => {
    // Simple deterministic placeholder – in a real app this would come from the backend
    const placeholder = 'r' + Math.random().toString(36).substring(2, 35);
    setBurnerAddress(placeholder);
    setBurnerBalance('0');
  }, []);

  const handleSweep = async () => {
    // Placeholder: call backend sweep endpoint
    try {
      await fetch('/api/sweep', { method: 'POST' });
      alert('Sweep request sent');
    } catch (e) {
      alert('Sweep failed');
    }
  };

  const toggleEngine = () => setEngineRunning(!engineRunning);

  return (
    <div className="p-4 bg-zinc-950 text-white border border-zinc-800">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold">TRADE BOT EXECUTION PORTAL</h1>
        <h2 className="text-lg text-zinc-300">Automated XRPL Trading Engine</h2>
        <div className="flex items-center mt-2">
          <span className="px-2 py-1 text-sm font-medium bg-zinc-800 rounded-full flex items-center">
            <span className="w-2 h-2 bg-green-500 rounded-full mr-1"></span>
            ENGINE ACTIVE
          </span>
        </div>
      </div>

      {/* Connected Wallet Card */}
      <div className="mb-4 p-3 border border-zinc-800 bg-zinc-900 rounded">
        <h3 className="font-medium mb-1">Connected Main Wallet</h3>
        <p className="text-sm">Address: {truncateAddress(mainAddress)}</p>
        <p className="text-sm">Balance: {mainBalance} XRP</p>
      </div>

      {/* Burner Vault Card */}
      <div className="mb-4 p-3 border border-zinc-800 bg-zinc-900 rounded">
        <h3 className="font-medium mb-1">Burner Vault Wallet</h3>
        <p className="text-sm">Address: {truncateAddress(burnerAddress)}</p>
        <p className="text-sm">Balance: {burnerBalance} XRP</p>
        <button
          onClick={handleSweep}
          className="mt-2 px-3 py-1 bg-indigo-600 hover:bg-indigo-700 rounded text-sm"
        >
          SWEEP TO MAIN WALLET
        </button>
      </div>

      {/* Strategy Execution Controls */}
      <div className="p-3 border border-zinc-800 bg-zinc-900 rounded">
        <h3 className="font-medium mb-3">Strategy Execution Controls</h3>
        <div className="grid grid-cols-1 gap-3">
          <label className="flex flex-col">
            <span className="text-sm mb-1">Strategy</span>
            <select
              value={strategy}
              onChange={e => setStrategy(e.target.value)}
              className="p-1 bg-zinc-800 border border-zinc-700 text-white"
            >
              <option>Grid Trading</option>
              <option>Scalp</option>
              <option>Momentum</option>
            </select>
          </label>
          <label className="flex flex-col">
            <span className="text-sm mb-1">Upper Band (XRP)</span>
            <input
              type="number"
              value={upperBand}
              onChange={e => setUpperBand(e.target.value)}
              className="p-1 bg-zinc-800 border border-zinc-700 text-white"
            />
          </label>
          <label className="flex flex-col">
            <span className="text-sm mb-1">Lower Band (XRP)</span>
            <input
              type="number"
              value={lowerBand}
              onChange={e => setLowerBand(e.target.value)}
              className="p-1 bg-zinc-800 border border-zinc-700 text-white"
            />
          </label>
          <label className="flex flex-col">
            <span className="text-sm mb-1">Stop Loss (%)</span>
            <input
              type="number"
              value={stopLoss}
              onChange={e => setStopLoss(e.target.value)}
              className="p-1 bg-zinc-800 border border-zinc-700 text-white"
            />
          </label>
          <label className="flex flex-col">
            <span className="text-sm mb-1">Take Profit (%)</span>
            <input
              type="number"
              value={takeProfit}
              onChange={e => setTakeProfit(e.target.value)}
              className="p-1 bg-zinc-800 border border-zinc-700 text-white"
            />
          </label>
          <button
            onClick={toggleEngine}
            className={`px-4 py-2 mt-2 rounded ${engineRunning ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'}`}
          >
            {engineRunning ? 'PAUSE ENGINE' : 'START ENGINE'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default TradeTab;
