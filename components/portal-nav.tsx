'use client'

import { MessageSquare, Wallet, Gamepad2 } from 'lucide-react'

export type TabId = 'chat' | 'wallet' | 'arcade'

interface PortalHeaderProps {
  activeTab: TabId
  setActiveTab: (tab: TabId) => void
  connected: boolean
  xrpBalance: string
}

export function PortalHeader({
  activeTab,
  setActiveTab,
  connected,
  xrpBalance,
}: PortalHeaderProps) {
  return (
    <header className="relative z-30 border-b border-border/60 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 md:px-8">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/20 text-primary font-bold text-sm tracking-tight">
            GB
          </div>
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
              Gross Bros
            </p>
            <h1 className="text-sm font-semibold leading-none tracking-tight">
              Fusion Portal
            </h1>
          </div>
        </div>

        <div className="hidden items-center gap-1 md:flex">
          {(
            [
              { id: 'chat' as TabId, label: 'Neural', icon: MessageSquare },
              { id: 'wallet' as TabId, label: 'Wallet', icon: Wallet },
              { id: 'arcade' as TabId, label: 'Arcade', icon: Gamepad2 },
            ] as const
          ).map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setActiveTab(id)}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                activeTab === id
                  ? 'bg-primary/15 text-primary'
                  : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <span
            className={`hidden sm:inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-mono ${
              connected
                ? 'bg-primary/10 text-primary'
                : 'bg-secondary text-muted-foreground'
            }`}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                connected ? 'bg-primary' : 'bg-muted-foreground'
              }`}
            />
            {connected ? `${xrpBalance} XRP` : 'Offline'}
          </span>
        </div>
      </div>
    </header>
  )
}

interface PortalBottomNavProps {
  activeTab: TabId
  setActiveTab: (tab: TabId) => void
}

export function PortalBottomNav({ activeTab, setActiveTab }: PortalBottomNavProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-border/60 bg-background/90 backdrop-blur-lg md:hidden">
      <div className="mx-auto flex max-w-lg items-stretch justify-around px-2 py-2">
        {(
          [
            { id: 'chat' as TabId, label: 'Neural', icon: MessageSquare },
            { id: 'wallet' as TabId, label: 'Wallet', icon: Wallet },
            { id: 'arcade' as TabId, label: 'Arcade', icon: Gamepad2 },
          ] as const
        ).map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setActiveTab(id)}
            className={`flex flex-1 flex-col items-center gap-0.5 rounded-lg py-2 text-[10px] font-medium transition-colors ${
              activeTab === id
                ? 'text-primary'
                : 'text-muted-foreground'
            }`}
          >
            <Icon className={`h-5 w-5 ${activeTab === id ? 'text-primary' : ''}`} />
            {label}
          </button>
        ))}
      </div>
    </nav>
  )
}