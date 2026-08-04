'use client';

import { useState, useEffect, useRef } from 'react'
import { PortalHeader, PortalBottomNav, type TabId } from '@/components/portal-nav'
import { PortalFooter } from '@/components/portal-footer'
import { ChatTab } from '@/components/tabs/chat-tab'
import { WalletTab } from '@/components/tabs/wallet-tab'
import { ArcadeTab } from '@/components/tabs/arcade-tab'
import { GROSS_BROS_LITE, resolveBro, type GrossBro } from '@/lib/gross-bros'

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
  
  const pollRef = useRef<NodeJS.Timeout | null>(null)

  const clearPolling = () => {
    if (pollRef.current) {
      clearInterval(pollRef.current)
      pollRef.current = null
    }
    setConnecting(false)
  }

  const handleVerifyData = (data: any) => {
    if (data.error) {
      setError(data.error)
      clearPolling()
      return
    }

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
        // Persist wallet address to localStorage
        localStorage.setItem('wallet_address', data.user)
        localStorage.setItem('xaman_wallet', data.user)
      }
      clearPolling()
    }
  }

  const startPolling = (uuid: string) => {
    const startTime = Date.now()
    const TIMEOUT = 60000 // 60 seconds

    pollRef.current = setInterval(async () => {
      if (Date.now() - startTime > TIMEOUT) {
        setError('Connection timed out. Please try again.')
        clearPolling()
        return
      }

      try {
        const res = await fetch(`/api/xaman/verify?uuid=${uuid}`)
        const data = await res.json()
        
        if (res.status >= 500) {
          throw new Error(data.error || 'Internal Server Error')
        }
        
        handleVerifyData(data)
      } catch (e: any) {
        setError(`Connection error: ${e.message}`)
        clearPolling()
      }
    }, 2000)
  }

  useEffect(() => {
    setMounted(true)
  }, [])

  // Restore wallet address from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('wallet_address') || localStorage.getItem('xaman_wallet')
      if (stored) {
        setAddress(stored)
        setConnected(true)
      }
    }
  }, [])

  useEffect(() => {
    if (!mounted) return
    const params = new URLSearchParams(window.location.search)
    const redirectUuid = params.get('uuid')
    const xAppToken = params.get('xAppToken') || params.get('xappToken') || params.get('ott')

    if (xAppToken) {
      window.history.replaceState({}, document.title, window.location.pathname)
      setConnecting(true)
      fetch(`/api/xaman/verify?xAppToken=${xAppToken}`)
        .then(res => res.json())
        .then(handleVerifyData)
        .catch((e) => {
          setError(`Verification failed: ${e.message}`)
          setConnecting(false)
        })
    } else if (redirectUuid) {
      window.history.replaceState({}, document.title, window.location.pathname)
      setConnecting(true)
      startPolling(redirectUuid)
    }

    return () => clearPolling()
  }, [mounted])

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
      
      if (isXaman && (window as any).xumm?.xapp?.openSignRequest) {
        (window as any).xumm.xapp.openSignRequest({ uuid })
      } else {
        window.location.href = next || deeplink || `xumm://sign/${uuid}`
      }

      startPolling(uuid)
    } catch (e: any) {
      setError(e.message)
      setConnecting(false)
    }
  }

  if (!mounted) return <div className="portal-bg min-h-dvh" />

  return (
    <div className="portal-bg relative flex min-h-dvh flex-col">
      <div className="grid-overlay pointer-events-none absolute inset-0 h-[420px]" aria-hidden />
      <PortalHeader
        activeTab={tab}
        setActiveTab={setTab}
        connected={connected}
        xrpBalance={xrpBalance}
      />
      <main className="relative z-0 flex-1 px-4 pb-36 pt-6 md:px-8 md:pb-10">
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
        {tab === 'arcade' && <ArcadeTab bro={bro} />}
      </main>
      <PortalFooter />
      <PortalBottomNav activeTab={tab} setActiveTab={setTab} />
    </div>
  )
}
