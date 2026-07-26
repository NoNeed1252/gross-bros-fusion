'use client';

import React, { useState, useEffect } from "react";
import Image from "next/image";

interface TradeTabProps {
  user?: any;
  connected?: boolean;
  mainAddress?: string;
  mainBalance?: string;
}

export function TradeTab({ user, connected, mainAddress, mainBalance }: TradeTabProps) {
  // Vault seed persisted in localStorage
  const [vaultSeed, setVaultSeed] = useState<string>("");
  const [engineRunning, setEngineRunning] = useState<boolean>(false);

  // Strategy controls (placeholders for now)
  const [gridStrategy, setGridStrategy] = useState<string>("");
  const [upperBand, setUpperBand] = useState<string>("");
  const [lowerBand, setLowerBand] = useState<string>("");
  const [stopLoss, setStopLoss] = useState<string>("");
  const [takeProfit, setTakeProfit] = useState<string>("");

  // Initialise vault seed from localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedSeed = localStorage.getItem("tgb_masterstroke_vault_seed");
      if (storedSeed) {
        setVaultSeed(storedSeed);
      } else {
        const newSeed = Math.random().toString(36).substring(2, 15);
        localStorage.setItem("tgb_masterstroke_vault_seed", newSeed);
        setVaultSeed(newSeed);
      }
    }
  }, []);

  const handleSweep = async () => {
    try {
      await fetch("/api/sweep", { method: "POST" });
      alert("Sweep request sent");
    } catch (e) {
      console.error(e);
      alert("Sweep failed");
    }
  };

  const handleEngineToggle = () => {
    setEngineRunning(!engineRunning);
  };

  // Render ---------------------------------------------------------------
  return (
    <div className="p-4 border border-zinc-800/80 bg-zinc-950 text-white">
      <h1 className="text-2xl font-bold mb-2">Masterstroke Control Center</h1>
      <p className="mb-2">Burner Vault Seed: {vaultSeed}</p>
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
            className={`px-4 py-2 rounded ${engineRunning ? "bg-red-600 hover:bg-red-700" : "bg-green-600 hover:bg-green-700"}`}
          >
            {engineRunning ? "Pause" : "Start"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default TradeTab;
