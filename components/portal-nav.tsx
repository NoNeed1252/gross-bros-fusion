'use client'

import { MessageSquare, Wallet } from 'lucide-react'

export type TabId = 'chat' | 'wallet'

interface TabConfig {
  id: TabId
  label: string
  icon: any
}

const tabs: TabConfig[] = [
  { id: 'chat', label: 'Tactical AI', icon: MessageSquare },
  { id: 'wallet', label: 'Holder Wallet', icon: Wallet }
]

interface NavProps {
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
}: NavProps) {
  return (
    <header className="border-b border-zinc-800 bg-zinc-950/50 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-700 bg-zinc-900 font-black text-zinc-100">
            TGB
          </div>
          <div>
            <h1 className="text-sm font-bold uppercase tracking-wider text-zinc-100">
              The Gross Bros
            </h1>
            <p className="text-[10px] font-medium tracking-widest text-zinc-400">
              TACTICAL PORTAL // SECTOR-7
            </p>
          </div>
        </div>

        {/* Desktop Tabs */}
        <nav className="hidden md:flex items-center gap-1">
          {tabs.map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all ${
                  isActive
                    ? 'border border-zinc-700 bg-zinc-800 text-zinc-100'
                    : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            )
          })}
        </nav>

        <div className="flex items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-xs font-medium text-zinc-300">
          <span
            className={`h-2 w-2 rounded-full ${
              connected ? 'bg-zinc-100' : 'bg-zinc-600'
            }`}
          />
          <span>{connected ? `${xrpBalance} XRP` : 'Offline'}</span>
        </div>
      </div>
    </header>
  )
}

export function PortalBottomNav({
  activeTab,
  setActiveTab
}: Omit<NavProps, 'connected' | 'xrpBalance'>) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 border-t border-zinc-800 bg-zinc-950/80 backdrop-blur-lg md:hidden">
      <div className="grid grid-cols-2 gap-1 p-2">
        {tabs.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-col items-center justify-center rounded-lg py-2 transition-all ${
                isActive
                  ? 'bg-zinc-900 text-zinc-100'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <Icon className="h-5 w-5" />
              <span className="mt-1 text-[10px] font-semibold">{tab.label}</span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
