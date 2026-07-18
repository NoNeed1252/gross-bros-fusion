'use client'

import { useState, useEffect } from 'react'
import { PortalHeader, PortalBottomNav, type TabId } from '@/components/portal-nav'
import { PortalFooter } from '@/components/portal-footer'
import { ChatTab } from '@/components/tabs/chat-tab'
import { WalletTab } from '@/components/tabs/wallet-tab'
import { ArcadeTab } from '@/components/tabs/arcade-tab'
import { GROSS_BROS, type GrossBro } from '@/lib/gross-bros'

export default function Page() {
  const [mounted, setMounted] = useState(false)
  const [tab, setTab] = useState<TabId>('chat')
  const [address, setAddress] = useState('')
  const [xrpBalance, setXrpBalance] = useState('0.00')
  const [ownedBros, setOwnedBros] = useState<GrossBro[]>([])
  const [connected, setConnected] = useState(false)
  const [connecting, setConnecting] = useState(false)
  const [bro, setBro] = useState<GrossBro>(GROSS_BROS[0])

  useEffect(() => {
    setMounted(true)

    // Check if we are returning from Xaman redirect
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      const redirectUuid = params.get('uuid')

      if (redirectUuid) {
        // Clear the query parameter to keep URL clean and prevent polling on reloads
        window.history.replaceState({}, document.title, window.location.pathname)
        setConnecting(true)

        const poll = setInterval(async () => {
          try {
            const vRes = await fetch(`/api/xaman/verify?uuid=${redirectUuid}`)
            const vData = await vRes.json()

            if (vData.signed) {
              clearInterval(poll)
              setAddress(vData.user)
              setXrpBalance(vData.balance)

              const found = GROSS_BROS.filter(b => vData.ownedNfts.includes(b.tokenId))
              setOwnedBros(found)

              const currentBro = found.length > 0 ? found[0] : GROSS_BROS[0]
              setBro(currentBro)

              setConnected(true)
              setConnecting(false)
            }
          } catch (err) {
            console.error('Verify redirect poll error:', err)
          }
        }, 2000)

        return () => clearInterval(poll)
      }
    }
  }, [])

  async function handleConnect() {
    setConnecting(true)
    try {
      const res = await fetch('/api/xaman/payload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'SignIn' }),
      })
      const { next, uuid, deeplink } = await res.json()

      // In a real app, we might open a popup, but spec says redirect.
      // Note: This redirect will stop execution, so polling needs to happen on return
      // or we handle it via a redirect back to this page with uuid.
      window.location.href = deeplink

      const poll = setInterval(async () => {
        const vRes = await fetch(`/api/xaman/verify?uuid=${uuid}`)
        const vData = await vRes.json()

        if (vData.signed) {
          clearInterval(poll)
          setAddress(vData.user)
          setXrpBalance(vData.balance)
          
          const found = GROSS_BROS.filter(b => vData.ownedNfts.includes(b.tokenId))
          setOwnedBros(found)
          
          const currentBro = found.length > 0 ? found[0] : GROSS_BROS[0]
          setBro(currentBro)
          
          setConnected(true)
          setConnecting(false)
        }
      }, 2000)
    } catch (err) {
      console.error('Connect error:', err)
      setConnecting(false)
    }
  }

  if (!mounted) {
    return <div className="portal-bg min-h-dvh" />
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
            ownedBros={ownedBros}
          />
        )}
        {tab === 'wallet' && (
          <WalletTab 
            connected={connected} 
            address={address} 
            balance={xrpBalance} 
            ownedBros={ownedBros} 
          />
        )}
        {tab === 'arcade' && <ArcadeTab />}
      </main>

      <PortalFooter />
      <PortalBottomNav active={tab} onChange={setTab} />
    </div>
  )
}
