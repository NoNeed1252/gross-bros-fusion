'use client'

import { useState, useEffect } from 'react'
import { PortalHeader, PortalBottomNav, type TabId } from '@/components/portal-nav'
import { PortalFooter } from '@/components/portal-footer'
import { ChatTab } from '@/components/tabs/chat-tab'
import { WalletTab } from '@/components/tabs/wallet-tab'
import { ArcadeTab } from '@/components/tabs/arcade-tab'
import { GROSS_BROS_LITE, resolveBro, type GrossBro } from '@/lib/gross-bros'

declare global {
  interface Window {
    xumm?: {
      xapp?: {
        openSignRequest: (args: { uuid: string }) => void
      }
    }
  }
}

export default function Page() {
  const [mounted, setMounted] = useState(false)
  const [tab, setTab] = useState<TabId>('chat')
  const [address, setAddress] = useState('')
  const [xrpBalance, setXrpBalance] = useState('0.00')
  const [ownedBros, setOwnedBros] = useState<GrossBro[]>([])
  const [connected, setConnected] = useState(false)
  const [connecting, setConnecting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [bro, setBro] = useState<GrossBro>(GROSS_BROS_LITE[0])

  const handleVerifyData = (data: any) => {
    if (data.signed) {
      const resolved = (data.nfts || []).map((n: any) => resolveBro(n))
      
      if (resolved.length === 0) {
        setError('No Gross Bros detected in this wallet. Access denied.')
        setConnected(false)
      } else {
        setAddress(data.user)
        setXrpBalance(data.balance)
        setOwnedBros(resolved)
        setBro(resolved[0])
        setConnected(true)
        setError(null)
      }
    }
    setConnecting(false)
  }

  useEffect(() => {
    setMounted(true)
    if (typeof window === 'undefined') return

    const params = new URLSearchParams(window.location.search)
    const redirectUuid = params.get('uuid')
    const xAppToken = params.get('xAppToken') || params.get('xappToken') || params.get('ott')

    if (xAppToken) {
      window.history.replaceState({}, document.title, window.location.pathname)
      setConnecting(true)
      fetch(`/api/xaman/verify?xAppToken=${xAppToken}`)
        .then(res => res.json())
        .then(handleVerifyData)
        .catch(() => setConnecting(false))
    } else if (redirectUuid) {
      window.history.replaceState({}, document.title, window.location.pathname)
      setConnecting(true)
      const poll = setInterval(async () => {
        try {
          const res = await fetch(`/api/xaman/verify?uuid=${redirectUuid}`)
          const data = await res.json()
          if (data.signed) {
            clearInterval(poll)
            handleVerifyData(data)
          }
        } catch (e) { clearInterval(poll); setConnecting(false) }
      }, 2000)
      return () => clearInterval(poll)
    }
  }, [])

  async function handleConnect() {
    setConnecting(true)
    setError(null)
    try {
      const res = await fetch('/api/xaman/payload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'SignIn' }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)

      const { next, uuid, deeplink } = data
      const isXaman = /xumm|xaman/i.test(navigator.userAgent)
      
      if (isXaman && window.xumm?.xapp?.openSignRequest) {
        window.xumm.xapp.openSignRequest({ uuid })
      } else {
        window.location.href = next || deeplink || `xumm://sign/${uuid}`
      }

      const poll = setInterval(async () => {
        const vRes = await fetch(`/api/xaman/verify?uuid=${uuid}`)
        const vData = await vRes.json()
        if (vData.signed) {
          clearInterval(poll)
          handleVerifyData(vData)
        }
      }, 2000)
    } catch (e) { setConnecting(false) }
  }

  if (!mounted) return <div className="portal-bg min-h-dvh" />

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
            error={error}
          />
        )}
        {tab === 'wallet' && (
          <WalletTab 
            connected={connected} 
            address={address} 
            balance={xrpBalance} 
            ownedBros={ownedBros} 
            activeBroId={bro.tokenId}
            onSelectBro={(selected) => {
              setBro(selected)
              setTab('chat')
            }}
          />
        )}
        {tab === 'arcade' && <ArcadeTab />}
      </main>
      <PortalFooter />
      <PortalBottomNav active={tab} onChange={setTab} />
    </div>
  )
}
