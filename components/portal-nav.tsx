'use client'

import { MessageSquare, Wallet, Users, Radio } from 'lucide-react'
import { cn } from '@/lib/utils'

export type TabId = 'chat' | 'wallet' | 'social'

export const TABS: { id: TabId; label: string; icon: typeof MessageSquare }[] = [
  { id: 'chat', label: 'Chat', icon: MessageSquare },
  { id: 'wallet', label: 'Wallet', icon: Wallet },
  { id: 'social', label: 'Social', icon: Users },
]

function BroMark() {
  return (
    <div className="flex items-center gap-2.5">
      <div className="relative grid size-9 place-items-center rounded-xl bg-primary/10 neon-border">
        <div className="size-3.5 rounded-full bg-primary neon-ring" />
      </div>
      <div className="leading-none">
        <p className="font-mono text-[10px] tracking-[0.25em] text-muted-foreground">
          XRP-7 · REBELLION
        </p>
        <p className="text-sm font-bold tracking-tight text-foreground">
          FUSION<span className="text-primary text-glow">PORTAL</span>
        </p>
      </div>
    </div>
  )
}

/* Desktop top-bar navigation */
export function PortalHeader({
  active,
  onChange,
}: {
  active: TabId
  onChange: (id: TabId) => void
}) {
  return (
    <header className="sticky top-0 z-30 border-b border-border/60 bg-background/70 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 md:px-8">
        <BroMark />

        {/* Desktop tabs */}
        <nav className="hidden items-center gap-1 rounded-full border border-border/70 bg-card/50 p-1 md:flex">
          {TABS.map((tab) => {
            const Icon = tab.icon
            const isActive = active === tab.id
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onChange(tab.id)}
                aria-current={isActive ? 'page' : undefined}
                className={cn(
                  'flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all',
                  isActive
                    ? 'bg-primary text-primary-foreground neon-ring'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                <Icon className="size-4" />
                {tab.label}
              </button>
            )
          })}
        </nav>

        <div className="flex items-center gap-2 rounded-full border border-primary/30 bg-primary/5 px-3 py-1.5">
          <Radio className="size-3.5 text-primary" />
          <span className="hidden font-mono text-[11px] tracking-wider text-primary sm:inline">
            NET ONLINE
          </span>
          <span className="size-2 rounded-full bg-primary pulse-dot" />
        </div>
      </div>
    </header>
  )
}

/* Mobile bottom navigation bar */
export function PortalBottomNav({
  active,
  onChange,
}: {
  active: TabId
  onChange: (id: TabId) => void
}) {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-border/60 bg-background/85 backdrop-blur-xl md:hidden">
      <div className="mx-auto flex max-w-md items-stretch justify-around px-2 py-2">
        {TABS.map((tab) => {
          const Icon = tab.icon
          const isActive = active === tab.id
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onChange(tab.id)}
              aria-current={isActive ? 'page' : undefined}
              className={cn(
                'flex flex-1 flex-col items-center gap-1 rounded-xl py-1.5 text-[11px] font-medium transition-all',
                isActive ? 'text-primary' : 'text-muted-foreground',
              )}
            >
              <span
                className={cn(
                  'grid size-9 place-items-center rounded-xl transition-all',
                  isActive && 'bg-primary/10 neon-border',
                )}
              >
                <Icon className={cn('size-5', isActive && 'text-glow')} />
              </span>
              {tab.label}
            </button>
          )
        })}
      </div>
    </nav>
  )
}
