'use client'

import React from 'react'
import { Gamepad2, MessageSquare, Wallet } from 'lucide-react'

export type TabId = 'arcade' | 'chat' | 'wallet'

interface PortalHeaderProps {
  activeTab: TabId
  setActiveTab: (tab: TabId) => void
  walletConnected?: boolean
  walletAddress?: string
}

export function PortalHeader({
  activeTab,
  setActiveTab,
  walletConnected = false,
  walletAddress = '',
}: PortalHeaderProps) {
  const navItems: { id: TabId; label: string; icon: React.ElementType }[] = [
    { id: 'arcade', label: 'Arcade', icon: Gamepad2 },
    { id: 'chat', label: 'Comms', icon: MessageSquare },
    { id: 'wallet', label: 'Vault', icon: Wallet },
  ]

  return (
    <header className="fixed top-0 left-0 right-0 z-30 flex items-center justify-between border-b border-zinc-800/80 bg-zinc-950/90 px-4 py-2 backdrop-blur-md">
      <div className="flex items-center space-x-2">
        <span className="text-xl font-bold text-white">TGB</span>
      </div>
      <nav className="flex">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = activeTab === item.id
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center gap-1 rounded-lg px-3 py-1.5 transition-colors ${
                isActive ? 'text-white font-medium' : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <Icon className={`h-5 w-5 ${isActive ? 'text-white' : 'text-zinc-500'}`} />
              <span className="text-[10px] tracking-wider uppercase">{item.label}</span>
            </button>
          )
        })}
      </nav>
      <div>
        {walletConnected ? (
          <span className="text-sm text-white">{walletAddress.slice(0, 6)}…{walletAddress.slice(-4)}</span>
        ) : (
          <button className="rounded bg-white px-2 py-0.5 text-xs font-medium text-gray-800">
            Connect Wallet
          </button>
        )}
      </div>
    </header>
  )
}

export function PortalBottomNav({ activeTab, setActiveTab }: { activeTab: TabId; setActiveTab: (tab: TabId) => void }) {
  const navItems: { id: TabId; label: string; icon: React.ElementType }[] = [
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
                isActive ? 'text-white font-medium' : 'text-zinc-500 hover:text-zinc-300'
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
