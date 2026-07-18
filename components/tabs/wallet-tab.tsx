'use client'

import Image from 'next/image'
import {
  Wallet,
  Copy,
  ArrowDownToLine,
  ArrowUpFromLine,
  Send,
  ExternalLink,
} from 'lucide-react'
import { COLLECTION, type GrossBro } from '@/lib/gross-bros'

const ACTIONS = [
  { icon: ArrowDownToLine, label: 'Receive' },
  { icon: Send, label: 'Send' },
  { icon: ArrowUpFromLine, label: 'Withdraw' },
]

interface WalletTabProps {
  connected: boolean
  address: string
  balance: string
  ownedBros: GrossBro[]
}

export function WalletTab({ connected, address, balance, ownedBros }: WalletTabProps) {
  const formatAddress = (addr: string) => {
    if (!addr) return ''
    return `${addr.slice(0, 8)}...${addr.slice(-8)}`
  }

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      {/* XRP balance */}
      <div className="rounded-2xl border border-border/70 bg-card/60 p-6 neon-border">
        <div className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
          <Wallet className="size-3.5 text-primary" />
          XRP Balance
        </div>
        <p className="mt-3 flex items-baseline gap-2 text-4xl font-bold tracking-tight text-foreground">
          {connected ? balance : '––––.––'}
          <span className="text-lg font-semibold text-primary text-glow">XRP</span>
        </p>
        {connected ? (
          <button
            type="button"
            onClick={() => navigator.clipboard.writeText(address)}
            className="mt-2 flex items-center gap-1.5 font-mono text-xs text-muted-foreground transition-colors hover:text-primary"
          >
            {formatAddress(address)} <Copy className="size-3" />
          </button>
        ) : (
          <p className="mt-2 font-mono text-xs text-muted-foreground">
            Connect a wallet on the Chat tab to view your balance.
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

      {/* NFT holdings */}
      <div className="rounded-2xl border border-border/70 bg-card/60 p-4">
        <div className="mb-3 flex items-center justify-between px-1">
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
            Gross Bros Held
          </p>
          <span className="rounded-full bg-primary/15 px-2 py-0.5 font-mono text-[10px] text-primary">
            {ownedBros.length} / {COLLECTION.totalNfts}
          </span>
        </div>

        {ownedBros.length > 0 ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {ownedBros.map((b) => (
              <div
                key={b.tokenId}
                className="overflow-hidden rounded-xl border border-border/70 bg-secondary/30 transition-all hover:border-primary/40"
              >
                <div className="relative aspect-square w-full">
                  <Image
                    src={b.image || '/placeholder.svg'}
                    alt={b.name}
                    fill
                    sizes="(max-width: 640px) 50vw, 200px"
                    className="object-cover"
                  />
                </div>
                <div className="p-2.5">
                  <p className="truncate text-sm font-semibold text-foreground">{b.name}</p>
                  <p className="truncate font-mono text-[10px] text-muted-foreground">
                    {b.faction}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-border/70 py-10 text-center">
            <p className="text-sm text-muted-foreground">No Gross Bros detected.</p>
            <p className="mt-1 font-mono text-xs text-muted-foreground">
              {connected ? 'Collect a Bro to unlock identity features.' : 'Connect your wallet to load your holdings.'}
            </p>
          </div>
        )}
      </div>

      {/* Collection meta */}
      <div className="flex items-center justify-between gap-3 rounded-2xl border border-border/70 bg-card/60 p-4">
        <div>
          <p className="text-sm font-semibold text-foreground">{COLLECTION.name}</p>
          <p className="font-mono text-[11px] text-muted-foreground">
            Floor {COLLECTION.floorXrp} XRP · {COLLECTION.holders} holders
          </p>
        </div>
        <a
          href={COLLECTION.marketplace}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 rounded-lg border border-primary/30 bg-primary/5 px-3 py-2 text-xs font-medium text-primary transition-colors hover:bg-primary/10"
        >
          xrp.cafe <ExternalLink className="size-3.5" />
        </a>
      </div>
    </div>
  )
}
