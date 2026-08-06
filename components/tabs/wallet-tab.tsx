'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import {
  Wallet,
  Copy,
  ArrowDownToLine,
  ArrowUpFromLine,
  Send,
  ExternalLink,
  Bot,
  Shield,
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
  activeBroId?: string
  onSelectBro?: (bro: GrossBro) => void
}

export function WalletTab({
  connected,
  address,
  balance,
  ownedBros,
  activeBroId,
  onSelectBro,
}: WalletTabProps) {
  const [agreed, setAgreed] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [paid, setPaid] = useState(false)
  const [botAddress, setBotAddress] = useState<string | null>(null)
  const [statusMsg, setStatusMsg] = useState<string | null>(null)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const formatAddress = (addr: string) => {
    if (!addr) return ''
    return `${addr.slice(0, 8)}...${addr.slice(-8)}`
  }

  const clearPoll = () => {
    if (pollRef.current) {
      clearInterval(pollRef.current)
      pollRef.current = null
    }
  }

  const loadStatus = useCallback(async () => {
    if (!address) return
    try {
      const res = await fetch(
        `/api/activate-trade-bot?holder=${encodeURIComponent(address)}`
      )
      const data = await res.json()
      if (data.paid) {
        setPaid(true)
        setBotAddress(data.botAddress || null)
      }
    } catch {
      /* ignore */
    }
  }, [address])

  useEffect(() => {
    loadStatus()
    return () => clearPoll()
  }, [loadStatus])

  async function startActivation() {
    if (!connected || !address) {
      setError('Connect your wallet first (Chat tab).')
      return
    }
    if (ownedBros.length === 0) {
      setError('You need a Gross Bro NFT to activate the trade bot.')
      return
    }
    if (!agreed) {
      setError('Accept the Terms before paying.')
      return
    }

    setBusy(true)
    setError(null)
    setStatusMsg('Opening Xaman…')

    try {
      const res = await fetch('/api/activate-trade-bot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create-payload',
          holderAddress: address,
          nftId: ownedBros[0]?.tokenId || address,
        }),
      })
      const data = await res.json()
      if (!res.ok || data.error) throw new Error(data.error || 'Failed to start payment')

      const { uuid, deeplink } = data
      const isXaman = /xumm|xaman/i.test(navigator.userAgent)
      if (isXaman && (window as any).xumm?.xapp?.openSignRequest) {
        ;(window as any).xumm.xapp.openSignRequest({ uuid })
      } else if (deeplink) {
        window.location.href = deeplink
      }

      setStatusMsg('Waiting for payment in Xaman…')

      clearPoll()
      const started = Date.now()
      pollRef.current = setInterval(async () => {
        if (Date.now() - started > 120000) {
          clearPoll()
          setBusy(false)
          setStatusMsg(null)
          setError('Payment timed out. Try again.')
          return
        }
        try {
          const vRes = await fetch('/api/activate-trade-bot', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'verify',
              holderAddress: address,
              nftId: ownedBros[0]?.tokenId || address,
              uuid,
            }),
          })
          const v = await vRes.json()
          if (v.signed && v.success) {
            clearPoll()
            setPaid(true)
            setBotAddress(v.botAddress || null)
            setBusy(false)
            setStatusMsg('Trade bot activated.')
          }
        } catch {
          /* keep polling */
        }
      }, 2500)
    } catch (e: any) {
      setBusy(false)
      setStatusMsg(null)
      setError(e.message || 'Activation failed')
    }
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

      {/* TRADE BOT PAYWALL */}
      <div className="rounded-2xl border border-primary/30 bg-card/60 p-6 neon-border">
        <div className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.2em] text-primary">
          <Bot className="size-3.5" />
          Trade Bot
        </div>
        <h3 className="mt-2 text-lg font-semibold tracking-tight">
          Gross Bro Automated Trading
        </h3>
        <p className="mt-1 text-sm text-muted-foreground">
          One-time $25 activation. Pay with XRP, RLUSD, or other assets via Xaman.
          Trading can lose money — use only funds you can afford to risk.
        </p>

        {!connected && (
          <p className="mt-4 text-sm text-muted-foreground">
            Connect your wallet on the Chat tab first.
          </p>
        )}

        {connected && ownedBros.length === 0 && (
          <p className="mt-4 text-sm text-muted-foreground">
            You need at least one Gross Bro NFT to activate.
          </p>
        )}

        {connected && ownedBros.length > 0 && !paid && (
          <div className="mt-4 space-y-3">
            <label className="flex items-start gap-2 text-sm text-muted-foreground">
              <input
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="mt-1"
              />
              <span>
                I am 18+, I understand trading bots can lose money, and I agree to the{' '}
                <a href="/terms" className="text-primary underline">
                  Terms of Service
                </a>
                .
              </span>
            </label>

            <button
              type="button"
              disabled={busy || !agreed}
              onClick={startActivation}
              className="w-full rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition-opacity disabled:opacity-50"
            >
              {busy ? 'Waiting for Xaman…' : 'Activate Trade Bot — $25'}
            </button>

            {statusMsg && (
              <p className="text-center text-xs text-muted-foreground">{statusMsg}</p>
            )}
            {error && (
              <p className="text-center text-xs text-red-400">{error}</p>
            )}
          </div>
        )}

        {paid && (
          <div className="mt-4 space-y-3 rounded-xl border border-primary/20 bg-primary/5 p-4">
            <div className="flex items-center gap-2 text-sm font-medium text-primary">
              <Shield className="size-4" />
              Activated
            </div>
            {botAddress ? (
              <>
                <p className="text-xs text-muted-foreground">
                  Fund this bot wallet with XRP to trade (never share seeds):
                </p>
                <button
                  type="button"
                  onClick={() => navigator.clipboard.writeText(botAddress)}
                  className="flex w-full items-center justify-between gap-2 rounded-lg border border-border/60 bg-background/50 px-3 py-2 font-mono text-xs"
                >
                  <span className="truncate">{botAddress}</span>
                  <Copy className="size-3.5 shrink-0 text-primary" />
                </button>
              </>
            ) : (
              <p className="text-xs text-muted-foreground">
                Payment recorded. Bot address provisioning may take a moment —
                refresh this tab.
              </p>
            )}
            <p className="text-[11px] text-muted-foreground">
              Live trading engine comes next. Activation + funding is step 1.
            </p>
          </div>
        )}
      </div>

      {/* NFT grid */}
      <div className="rounded-2xl border border-border/70 bg-card/60 p-4">
        <p className="mb-3 font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
          Your Gross Bros
        </p>
        {ownedBros.length > 0 ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {ownedBros.map((b) => (
              <button
                key={b.tokenId}
                type="button"
                onClick={() => onSelectBro?.(b)}
                className="group overflow-hidden rounded-xl border border-border/50 bg-secondary/30 text-left transition-all hover:border-primary/40"
              >
                <div className="relative aspect-square overflow-hidden">
                  <Image
                    src={b.image || '/placeholder.svg'}
                    alt={b.name}
                    fill
                    sizes="(max-width: 640px) 50vw, 200px"
                    className="object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  {activeBroId === b.tokenId && (
                    <div className="absolute inset-0 flex items-center justify-center bg-primary/10">
                      <div className="rounded-full bg-primary px-2 py-0.5 font-mono text-[8px] uppercase tracking-wider text-primary-foreground">
                        Active
                      </div>
                    </div>
                  )}
                </div>
                <div className="p-2.5">
                  <p className="truncate text-sm font-semibold text-foreground group-hover:text-primary">
                    {b.name}
                  </p>
                  <p className="truncate font-mono text-[10px] text-muted-foreground">
                    {b.faction}
                  </p>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-border/70 py-10 text-center">
            <p className="text-sm text-muted-foreground">No Gross Bros detected.</p>
            <p className="mt-1 font-mono text-xs text-muted-foreground">
              {connected
                ? 'Collect a Bro to unlock identity features.'
                : 'Connect your wallet to load your holdings.'}
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