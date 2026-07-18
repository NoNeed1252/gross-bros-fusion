'use client'

/**
 * Trade bot control surface.
 *
 * FUTURE INTEGRATION:
 * - These controls will drive the XRPL trading bot from:
 *   https://github.com/NoNeed1252/xrpl-trading-bot
 * - Each action should hit a secured server action / route handler that
 *   talks to the bot process (start/stop, deposit, withdraw, status,
 *   autonomous mode) scoped to the connected wallet + NFT.
 */

import { Power, ArrowDownToLine, ArrowUpFromLine, Activity, Zap } from 'lucide-react'
import { cn } from '@/lib/utils'

export type BotAction =
  | 'toggle'
  | 'deposit'
  | 'withdraw'
  | 'status'
  | 'autonomous'

export function TradeBotPanel({
  botOn,
  autonomous,
  onAction,
}: {
  botOn: boolean
  autonomous: boolean
  onAction: (action: BotAction) => void
}) {
  return (
    <div className="rounded-2xl border border-border/70 bg-card/60 p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
            Fusion Trade Bot
          </span>
        </div>
        <span
          className={cn(
            'flex items-center gap-1.5 rounded-full px-2 py-0.5 font-mono text-[10px] tracking-wider',
            botOn
              ? 'bg-primary/15 text-primary'
              : 'bg-secondary text-muted-foreground',
          )}
        >
          <span
            className={cn(
              'size-1.5 rounded-full',
              botOn ? 'bg-primary pulse-dot' : 'bg-muted-foreground',
            )}
          />
          {botOn ? 'ACTIVE' : 'OFFLINE'}
        </span>
      </div>

      {/* Primary power toggle */}
      <button
        type="button"
        onClick={() => onAction('toggle')}
        className={cn(
          'mb-3 flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition-all',
          botOn
            ? 'bg-primary text-primary-foreground neon-ring'
            : 'border border-primary/40 bg-primary/5 text-primary hover:bg-primary/10',
        )}
      >
        <Power className="size-4" />
        {botOn ? 'Turn Bot OFF' : 'Turn Bot ON'}
      </button>

      <div className="grid grid-cols-2 gap-2">
        <BotButton icon={ArrowDownToLine} label="Deposit" onClick={() => onAction('deposit')} />
        <BotButton icon={ArrowUpFromLine} label="Withdraw" onClick={() => onAction('withdraw')} />
        <BotButton icon={Activity} label="Check Status" onClick={() => onAction('status')} />
        <BotButton
          icon={Zap}
          label="Autonomous"
          active={autonomous}
          onClick={() => onAction('autonomous')}
        />
      </div>
    </div>
  )
}

function BotButton({
  icon: Icon,
  label,
  onClick,
  active,
}: {
  icon: typeof Power
  label: string
  onClick: () => void
  active?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-xs font-medium transition-all',
        active
          ? 'border-primary/50 bg-primary/10 text-primary'
          : 'border-border/70 bg-secondary/40 text-muted-foreground hover:border-primary/40 hover:text-foreground',
      )}
    >
      <Icon className="size-3.5" />
      {label}
    </button>
  )
}
