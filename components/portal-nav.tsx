'use client'

import { MessageSquare, Wallet, Gamepad2 } from 'lucide-react'

export type TabId = 'chat' | 'wallet' | 'arcade'

interface PortalHeaderProps {
  activeTab: TabId
  setActiveTab: (tab: TabId) => void
  connected: boolean
  xrpBalance: string
  onDisconnect?: () => void
}

export function PortalHeader({
  activeTab,
  setActiveTab,
  connected,
  xrpBalance,
  onDisconnect,
}: PortalHeaderProps) {
  return (
    <header className="relative z-30 border-b border-zinc-800 bg-zinc-950">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 md:px-8">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-zinc-800 text-sm font-bold tracking-tight text-zinc-100">
            GB
          </div>
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-zinc-500">
              Gross Bros
            </p>
            <h1 className="text-sm font-semibold leading-none tracking-tight text-zinc-100">
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
                  ? 'bg-zinc-800 text-zinc-100'
                  : 'text-zinc-500 hover:bg-zinc-900 hover:text-zinc-200'
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <span
            className={`hidden items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-mono sm:inline-flex ${
              connected
                ? 'bg-zinc-800 text-zinc-200'
                : 'bg-zinc-900 text-zinc-500'
            }`}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                connected ? 'bg-zinc-300' : 'bg-zinc-600'
              }`}
            />
            {connected ? `${xrpBalance} XRP` : 'Offline'}
          </span>
          {connected && onDisconnect && (
            <button
              type="button"
              onClick={onDisconnect}
              className="border border-zinc-700 bg-zinc-900 px-2.5 py-1.5 text-[11px] font-medium text-zinc-300 transition-colors hover:bg-zinc-800 hover:text-zinc-100"
            >
              Disconnect
            </button>
          )}
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
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-zinc-800 bg-zinc-950 md:hidden">
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
                ? 'text-zinc-100'
                : 'text-zinc-500'
            }`}
          >
            <Icon className={`h-5 w-5 ${activeTab === id ? 'text-zinc-100' : ''}`} />
            {label}
          </button>
        ))}
      </div>
    </nav>
  )
}
