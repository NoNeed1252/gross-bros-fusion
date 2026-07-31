'use client'

import { Gamepad2, MessageSquare, Wallet } from 'lucide-react'

export type PortalTab = 'arcade' | 'chat' | 'wallet'

interface PortalNavProps {
  activeTab: PortalTab
  setActiveTab: (tab: PortalTab) => void
}

export function PortalBottomNav({ activeTab, setActiveTab }: PortalNavProps) {
  const navItems: { id: PortalTab; label: string; icon: React.ElementType }[] = [
    { id: 'arcade', label: 'Arcade', icon: Gamepad2 },
    { id: 'chat', label: 'Comms', icon: MessageSquare },
    { id: 'wallet', label: 'Vault', icon: Wallet },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 flex justify-center border-t border-zinc-800/80 bg-zinc-950/90 px-4 py-2 backdrop-blur-md">
      <div className="flex w-full max-w-md justify-around items-center">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = activeTab === item.id
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center gap-1 rounded-lg px-4 py-1.5 transition-colors ${
                isActive
                  ? 'text-white font-medium'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <Icon className={`h-5 w-5 ${isActive ? 'text-white' : 'text-zinc-500'}`} />
              <span className="text-[10px] tracking-wider uppercase">{item.label}</span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
