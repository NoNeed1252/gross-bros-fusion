'use client';

import { useState, useEffect } from "react";
import {
  Bot,
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  RefreshCw,
  Copy,
  Check,
  ShieldCheck,
  Zap,
  Activity,
  AlertCircle,
  Lock,
} from "lucide-react";

interface TradeTabProps {
  mainAddress: string;
  mainBalance: string;
  connected: boolean;
  onFundBot?: (amount: string) => void;
}

/**
 * TradeTab component with a $20 Xaman Pay‑with‑Anything paywall.
 * Users must pay $20 USD before the bot wallet functionality becomes available.
 * The component tracks three states:
 *   - locked: payment not yet completed.
 *   - paid: payment received, unlocks the full UI.
 *   - loadingPay: awaiting payment confirmation.
 */
export function TradeTab({
  mainAddress,
  mainBalance,
  connected,
  onFundBot,
}: TradeTabProps) {
  // === Paywall state ===
  const [paid, setPaid] = useState<boolean>(false);
  const [loadingPay, setLoadingPay] = useState<boolean>(false);

  // === Existing bot wallet state ===
  const [botAddress, setBotAddress] = useState<string>("");
  const [botBalance, setBotBalance] = useState<string>("0.00");
  const [copied, setCopied] = useState(false);
  const [botActive, setBotActive] = useState(false);
  const [depositAmount, setDepositAmount] = useState("10");
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState<string[]>([
    "Bot Engine Initialized. Local Vault encrypted.",
    "Awaiting operational funding from Main Wallet.",
  ]);

  // ---------------------------------------------------------------------
  // Paywall handling – in a real app this would call Xaman Pay‑with‑Anything
  // API. Here we simulate a delay and then mark the user as paid.
  // ---------------------------------------------------------------------
  const handlePay = async () => {
    setLoadingPay(true);
    // Simulate an async payment request – replace with real Xaman SDK call.
    await new Promise((res) => setTimeout(res, 1500));
    setPaid(true);
    setLoadingPay(false);
  };

  // ---------------------------------------------------------------------
  // Existing bot wallet logic (unchanged from previous implementation).
  // ---------------------------------------------------------------------
  useEffect(() => {
    let savedAddress = localStorage.getItem("tgb_bot_wallet_address");
    if (!savedAddress) {
      savedAddress =
        "rGros" + Math.random().toString(36).substring(2, 10).toUpperCase() + "BotXRP";
      localStorage.setItem("tgb_bot_wallet_address", savedAddress);
    }
    setBotAddress(savedAddress);

    const savedBalance = localStorage.getItem("tgb_bot_wallet_balance") || "0.00";
    setBotBalance(savedBalance);
  }, []);

  const handleCopy = () => {
    if (!botAddress) return;
    navigator.clipboard.writeText(botAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDeposit = () => {
    if (!connected) {
      alert("Please connect your Main Xaman Wallet first.");
      return;
    }
    const amt = parseFloat(depositAmount);
    if (isNaN(amt) || amt <= 0) return;

    setLoading(true);
    setTimeout(() => {
      const newBal = (parseFloat(botBalance) + amt).toFixed(2);
      setBotBalance(newBal);
      localStorage.setItem("tgb_bot_wallet_balance", newBal);
      setLogs((prev) => [
        `[${new Date().toLocaleTimeString()}] Funded ${amt} XRP from Main (${mainAddress.slice(
          0,
          6
        )}...),`,
        ...prev,
      ]);
      setLoading(false);
    }, 1200);
  };

  const handleWithdraw = () => {
    const cur = parseFloat(botBalance);
    if (cur <= 0) return;
    setLoading(true);
    setTimeout(() => {
      setLogs((prev) => [
        `[${new Date().toLocaleTimeString()}] Withdrew ${cur} XRP back to Main Wallet (${mainAddress.slice(
          0,
          6
        )}...),`,
        ...prev,
      ]);
      setBotBalance("0.00");
      localStorage.setItem("tgb_bot_wallet_balance", "0.00");
      setLoading(false);
    }, 1200);
  };

  const toggleBot = () => {
    const next = !botActive;
    setBotActive(next);
    setLogs((prev) => [
      `[${new Date().toLocaleTimeString()}] Trade Execution Engine: ${
        next ? "ONLINE" : "OFFLINE"
      },`,
      ...prev,
    ]);
  };

  // ---------------------------------------------------------------------
  // Render helpers
  // ---------------------------------------------------------------------
  const renderLocked = () => (
    <div className="flex flex-col items-center justify-center rounded-xl border border-zinc-800 bg-zinc-950/80 p-8 text-center">
      <Lock className="mb-4 h-12 w-12 text-emerald-400" />
      <h3 className="mb-2 text-lg font-bold text-zinc-100">Unlock Trade Bot</h3>
      <p className="mb-4 text-sm text-zinc-400">
        Access to the bot wallet requires a one‑time $20 USD payment via Xaman Pay‑with‑Anything.
      </p>
      <button
        onClick={handlePay}
        disabled={loadingPay}
        className="rounded-lg border border-emerald-500 bg-emerald-900 px-5 py-2 text-sm font-medium text-emerald-300 hover:bg-emerald-800 disabled:opacity-50"
      >
        {loadingPay ? "Processing…" : "Pay $20 USD to Unlock"}
      </button>
    </div>
  );

  const renderUnlocked = () => (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-950/80 p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg border border-zinc-700 bg-zinc-900 text-zinc-100">
              <Bot className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold uppercase tracking-wider text-zinc-100">
                Tactical Bot Wallet
              </h2>
              <p className="text-sm text-zinc-400">
                Isolated sub‑wallet for automated AI trading operations
              </p>
            </div>
          </div>
          <button
            onClick={toggleBot}
            className={`flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${
              botActive
                ? "border-emerald-500 bg-emerald-900 text-emerald-300"
                : "border-zinc-700 bg-zinc-800 text-zinc-300"
            }`}
          >
            <Zap className="h-4 w-4" />
            {botActive ? "Halt Bot" : "Activate Bot"}
          </button>
        </div>
      </div>

      {/* Bot Wallet Balance Card */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-950/80 p-5">
        <div className="flex items-center justify-between pb-3 text-xs uppercase tracking-wider text-zinc-400">
          <span className="flex items-center gap-1.5">
            <Wallet className="h-4 w-4 text-zinc-300" />
            Bot Operational Balance
          </span>
          <span className="rounded bg-zinc-900 px-2 py-0.5 text-[10px] text-zinc-400 border border-zinc-800">
            Local Vault
          </span>
        </div>
        <div className="text-3xl font-extrabold text-zinc-100">
          {botBalance} <span className="text-sm font-normal text-zinc-400">XRP</span>
        </div>
        <div className="mt-2 flex items-center gap-2">
          <span className="truncate font-mono text-sm text-zinc-300">
            {botAddress || "Generating…"}
          </span>
          {botAddress && (
            <button
              onClick={handleCopy}
              className="rounded p-1 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
            >
              {copied ? (
                <Check className="h-3.5 w-3.5 text-emerald-400" />
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )}
            </button>
          )}
        </div>
        {/* Quick Transfer Form */}
        <div className="mt-4 space-y-2">
          <label className="block text-xs font-semibold uppercase text-zinc-300">
            Transfer Funds From Main Wallet
          </label>
          <input
            type="number"
            value={depositAmount}
            onChange={(e) => setDepositAmount(e.target.value)}
            placeholder="Amount XRP"
            className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:border-zinc-600 focus:outline-none"
          />
          <div className="flex gap-2">
            <button
              onClick={handleDeposit}
              disabled={loading || !connected}
              className="flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2 text-xs font-semibold text-zinc-100 hover:bg-zinc-700 disabled:opacity-50"
            >
              <ArrowDownLeft className="h-3.5 w-3.5" />
              Fund
            </button>
            <button
              onClick={handleWithdraw}
              disabled={loading || !connected}
              className="flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2 text-xs font-semibold text-zinc-100 hover:bg-zinc-700 disabled:opacity-50"
            >
              <ArrowUpRight className="h-3.5 w-3.5" />
              Withdraw All
            </button>
          </div>
        </div>
      </div>

      {/* Main Wallet Overview */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-950/80 p-5">
        <div className="flex items-center justify-between pb-3 text-xs uppercase tracking-wider text-zinc-400">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
            Linked Main Wallet (Xaman)
          </span>
          <span
            className={`rounded px-2 py-0.5 text-[10px] font-semibold ${
              connected
                ? "bg-emerald-950/50 text-emerald-400 border border-emerald-800/50"
                : "bg-red-950/50 text-red-400 border border-red-800/50"
            }`}
          >
            {connected ? "CONNECTED" : "NOT CONNECTED"}
          </span>
        </div>
        <div className="text-2xl font-bold text-zinc-100">
          {mainBalance || "0.00"} <span className="text-sm font-normal text-zinc-400">XRP</span>
        </div>
        <p className="mt-1 text-sm text-zinc-300">
          {connected ? mainAddress : "Connect wallet via Wallet Tab to link"}
        </p>
        <div className="mt-2 flex items-center gap-1.5 font-semibold text-zinc-200">
          <AlertCircle className="h-3.5 w-3.5 text-amber-400" />
          Security Protocol Active
        </div>
        <p className="mt-1 text-xs text-zinc-400">
          Your main Xaman wallet and NFTs remain untouched. The AI Bot only trades using funds in this isolated Bot Wallet.
        </p>
      </div>

      {/* Execution Console */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-950/80 p-5">
        <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3 mb-3">
          <span className="text-xs font-bold uppercase tracking-wider text-zinc-300 flex items-center gap-2">
            <Activity className="h-4 w-4 text-zinc-400" />
            Execution Console & Event Log
          </span>
          <span className="text-[10px] font-mono text-zinc-500">SECTOR-7 BOT ENGINE v1.0</span>
        </div>
        <div className="space-y-1 text-sm text-zinc-300 font-mono">
          {logs.map((log, i) => (
            <div key={i}>{log}</div>
          ))}
        </div>
      </div>
    </div>
  );

  return paid ? renderUnlocked() : renderLocked();
}
