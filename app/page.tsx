'use client'

/**
 * Gross Bros Fusion Portal — root shell.
 *
 * Wallet connection state lives here so every tab can react to it.
 *
 * FUTURE INTEGRATION:
 * - `handleConnect` simulates the Xaman (XRPL) connect + NFT lookup flow.
 *   Replace with a real Xaman sign-in that resolves the holder's Gross Bro NFT.
 */

import { useState } from 'react'
import { PortalHeader, PortalBottomNav, type TabId } from '@/components/portal-nav'
import { PortalFooter } from '@/components/portal-footer'
import { ChatTab } from '@/components/tabs/chat-tab'
import { WalletTab } from '@/components/tabs/wallet-tab'
import { ArcadeTab } from '@/components/tabs/arcade-tab'
import { GROSS_BROS, pickRandomBro, type GrossBro } from '@/lib/gross-bros'

export default function Page() {
  const [tab, setTab] = useState<TabId>('chat')
  const [connected, setConnected] = useState(false)
  const [connecting, setConnecting] = useState(false)
  // The Bro the connected wallet holds. Resolved from the XRPL on connect.
  const [bro, setBro] = useState<GrossBro>(GROSS_BROS[0])

  function handleConnect() {
    setConnecting(true)
    // Simulate the Xaman sign-in + XRPL NFT resolution round-trip.
    window.setTimeout(() => {
      setBro(pickRandomBro())
      setConnected(true)
      setConnecting(false)
    }, 1400)
  }

  return (
    <div className="portal-bg relative flex min-h-dvh flex-col">
      <div className="grid-overlay pointer-events-none absolute inset-0 h-[420px]" aria-hidden />

      <PortalHeader active={tab} onChange={setTab} />

      <main className="relative z-10 flex-1 px-4 pb-28 pt-6 md:px-8 md:pb-10">
        {tab === 'chat' && (
          <ChatTab
            connected={connected}
            connecting={connecting}
            bro={bro}
            onConnect={handleConnect}
          />
        )}
        {tab === 'wallet' && <WalletTab connected={connected} bro={bro} />}
        {tab === 'arcade' && <ArcadeTab />}
      </main>

      <PortalFooter />
      <PortalBottomNav active={tab} onChange={setTab} />
    </div>
  )
}
