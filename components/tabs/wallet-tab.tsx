'use client'

/**
 * WALLET TAB
 *
 * FUTURE INTEGRATION:
 * - Wire in the logic from https://github.com/NoNeed1252/xrp-community-wallet
 *   (balances, send/receive, trustlines, tx history) via XRPL + Xaman.
 * - The sections below are clean placeholders designed to be swapped for
 *   live data without changing the layout.
 */

import {
  Wallet,
  Copy,
  ArrowDownToLine,
  ArrowUpFromLine,
  ArrowLeftRight,
  TrendingUp,
} from 'lucide-react'

const BALANCES = [
  { symbol: 'XRP', name: 'XRP Ledger', amount: '4,204.71', usd: '$2,481.20', up: true },
  { symbol: 'GROSS', name: 'Gross Token', amount: '77,490', usd: '$1,032.55', up: true },
  { symbol: 'RLUSD', name: 'Ripple USD', amount: '512.00', usd: '$512.00', up: false },
]

const ACTIONS = [
  { icon: ArrowDownToLine, label: 'Receive' },
  { icon: ArrowUpFromLine, label: 'Send' },
  { icon: ArrowLeftRight, label: 'Swap' },
]

export function WalletTab({ connected }: { connected: boolean }) {
  return (
    <div className="mx-auto max-w-3xl space-y-4">
      {/* Total balance */}
      <div className="rounded-2xl border border-border/70 bg-card/60 p-6 neon-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
            <Wallet className="size-3.5 text-primary" />
            Total Vault Value
          </div>
          <span className="flex items-center gap-1 rounded-full bg-primary/15 px-2 py-0.5 font-mono text-[10px] text-primary">
            <TrendingUp className="size-3" /> +12.4%
          </span>
        </div>
        <p className="mt-3 text-4xl font-bold tracking-tight text-foreground">
          {connected ? '$4,025.75' : '––––.––'}
        </p>
        {connected ? (
          <button
            type="button"
            className="mt-2 flex items-center gap-1.5 font-mono text-xs text-muted-foreground transition-colors hover:text-primary"
          >
            rNoNeed…7749Gross <Copy className="size-3" />
          </button>
        ) : (
          <p className="mt-2 font-mono text-xs text-muted-foreground">
            Connect a wallet on the Chat tab to view balances.
          </p>
        )}

        <div className="mt-5 grid grid-cols-3 gap-2">
          {ACTIONS.map(({ icon: Icon, label }) => (
            <button
              key={label}
              type="button"
              className="flex flex-col items-center gap-1.5 rounded-xl border border-border/70 bg-secondary/40 py-3 text-xs font-medium text-muted-foreground transition-all hover:border-primary/40 hover:text-primary"
            >
              <Icon className="size-4" />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Assets */}
      <div className="rounded-2xl border border-border/70 bg-card/60 p-4">
        <p className="mb-3 px-1 font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
          Assets
        </p>
        <ul className="divide-y divide-border/50">
          {BALANCES.map((b) => (
            <li key={b.symbol} className="flex items-center gap-3 py-3">
              <div className="grid size-10 place-items-center rounded-full border border-primary/30 bg-primary/10 font-mono text-xs font-bold text-primary">
                {b.symbol.slice(0, 3)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-foreground">{b.symbol}</p>
                <p className="truncate text-xs text-muted-foreground">{b.name}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-foreground">
                  {connected ? b.amount : '•••••'}
                </p>
                <p className="text-xs text-muted-foreground">{connected ? b.usd : '$•••'}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <p className="px-1 text-center font-mono text-[10px] tracking-wider text-muted-foreground">
        {'// PLACEHOLDER — TO BE REPLACED WITH xrp-community-wallet LOGIC'}
      </p>
    </div>
  )
}
