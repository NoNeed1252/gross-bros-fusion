'use client';

import { Bot, Gamepad2, MessageSquare, Wallet } from 'lucide-react';

interface PortalNavProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  connected: boolean;
  xrpBalance: string;
}

export function PortalNav({
  activeTab,
  setActiveTab,
  connected,
  xrpBalance,
}: PortalNavProps) {
  const tabs = [
    { id: 'chat', label: 'Tactical AI', icon: MessageSquare },
    { id: 'wallet', label: 'Holder Wallet', icon: Wallet },
    { id: 'trade', label: 'Trade Bot', icon: Bot },
    { id: 'arcade', label: 'Arcade', icon: Gamepad2 },
  ];

  return (
    <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-700 bg-zinc-900 font-black text-zinc-100">
          CCC
        </div>
        <h1 className="text-sm font-bold uppercase tracking-wider text-zinc-100">
          The Combat Chimps
        </h1>
        <p className="text-[10px] font-medium tracking-widest text-zinc-400">
          TACTICAL PORTAL // SECTOR-7
        </p>
      </div>

      <div className="flex items-center gap-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all ${
                isActive
                  ? 'border border-zinc-700 bg-zinc-800 text-zinc-100'
                  : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200'
              }`}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      <div className="flex items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-xs font-medium text-zinc-300">
        <span
          className={`h-2 w-2 rounded-full ${
            connected ? 'bg-emerald-400' : 'bg-zinc-600'
          }`}
        />
        <span>{connected ? `${xrpBalance} XRP` : 'Offline'}</span>
      </div>
    </nav>
  );
}
