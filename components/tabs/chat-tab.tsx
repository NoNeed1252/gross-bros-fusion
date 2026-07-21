'use client'

import { useCallback, useRef, useState } from 'react'
import { Sparkles, Zap, AlertTriangle } from 'lucide-react'
import type { GrossBro } from '@/lib/gross-bros'
import { NftIdentityCard } from '@/components/chat/nft-identity-card'
import { TradeBotPanel, type BotAction } from '@/components/chat/trade-bot-panel'
import { ChatPanel, type ChatMessage } from '@/components/chat/chat-panel'

let idc = 0
const nextId = () => `m${++idc}`

interface ChatTabProps {
  connected: boolean
  bro: GrossBro
  connecting: boolean
  onConnect: () => void
  ownedBros: GrossBro[]
  error?: string | null
}

export function ChatTab({
  connected,
  bro,
  connecting,
  onConnect,
  ownedBros,
  error,
}: ChatTabProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: nextId(), role: 'system', text: 'NEURAL LINK ESTABLISHED' },
    {
      id: nextId(),
      role: 'bro',
      text: `${bro.demoReplies[0]}`,
    },
  ])
  const [typing, setTyping] = useState(false)
  const [botOn, setBotOn] = useState(false)
  const [autonomous, setAutonomous] = useState(false)

  // Map display species back to key for API
  const speciesKey = bro.traits.find(t => ['Species', 'Type', 'Class'].includes(t.type))?.value || 'Ooze'

  const handleSend = useCallback(
    async (text: string) => {
      const userMsg: ChatMessage = { id: nextId(), role: 'user', text }
      setMessages((prev) => [...prev, userMsg])
      setTyping(true)

      try {
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: [...messages, userMsg].filter(m => m.role !== 'system'),
            systemPrompt: bro.systemPrompt,
            species: speciesKey
          }),
        })

        if (!response.ok) throw new Error('API Error')

        const data = await response.json()
        setMessages((prev) => [...prev, { id: nextId(), role: 'bro', text: data.text || 'Bleh... neural link failed.' }])
      } catch (err) {
        console.error('Chat Error:', err)
        setMessages((prev) => [...prev, { id: nextId(), role: 'system', text: 'CONNECTION ERROR' }])
      } finally {
        setTyping(false)
      }
    },
    [bro.systemPrompt, messages, speciesKey],
  )

  const handleBotAction = useCallback(
    async (action: BotAction) => {
      const push = (text: string) =>
        setMessages((prev) => [...prev, { id: nextId(), role: 'system', text }])

      const broReply = async (prompt: string) => {
        setTyping(true)
        try {
          const response = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              messages: [{ role: 'user', text: prompt }],
              systemPrompt: `${bro.systemPrompt}. Provide a short, in-character reaction to this event.`,
              species: speciesKey
            }),
          })
          if (!response.ok) throw new Error('API Error')
          const data = await response.json()
          setMessages((prev) => [...prev, { id: nextId(), role: 'bro', text: data.text }])
        } catch (err) {
          push('NEURAL LINK ERROR')
        } finally {
          setTyping(false)
        }
      }

      switch (action) {
        case 'toggle': {
          const next = !botOn
          setBotOn(next)
          push(next ? 'TRADE BOT ONLINE' : 'TRADE BOT OFFLINE')
          await broReply(next ? 'I just turned the trade bot ON.' : 'I just turned the trade bot OFF.')
          break
        }
        case 'deposit':
          push('DEPOSIT REQUESTED')
          await broReply('I want to deposit some XRP.')
          break
        case 'withdraw':
          push('WITHDRAW REQUESTED')
          await broReply('I want to withdraw my XRP.')
          break
        case 'status':
          push('STATUS PING')
          await broReply(`Give me a status update. Bot is ${botOn ? 'active' : 'offline'}.`)
          break
        case 'autonomous': {
          const next = !autonomous
          setAutonomous(next)
          push(next ? 'AUTONOMOUS MODE ENGAGED' : 'AUTONOMOUS MODE DISENGAGED')
          await broReply(next ? 'I engaged autonomous trading mode.' : 'I disengaged autonomous trading mode.')
          break
        }
      }
    },
    [botOn, autonomous, bro.systemPrompt, speciesKey],
  )

  if (!connected) {
    return <ConnectGate bro={bro} connecting={connecting} onConnect={onConnect} error={error} />
  }

  return (
    <div className="mx-auto grid max-w-6xl gap-4 lg:grid-cols-[minmax(0,340px)_1fr]">
      {/* Left: identity + bot controls */}
      <div className="space-y-4">
        <NftIdentityCard bro={bro} />
        <TradeBotPanel botOn={botOn} autonomous={autonomous} onAction={handleBotAction} />
      </div>

      {/* Right: chat */}
      <div className="h-[560px] min-h-[520px] lg:h-[720px]">
        <ChatPanel bro={bro} messages={messages} typing={typing} onSend={handleSend} />
      </div>
    </div>
  )
}

function ConnectGate({
  bro,
  connecting,
  onConnect,
  error,
}: {
  bro: GrossBro
  connecting: boolean
  onConnect: () => void
  error?: string | null
}) {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center px-2 py-10 text-center">
      <div className="relative mb-6 grid size-24 place-items-center rounded-3xl border border-primary/30 bg-primary/5 neon-border float-slow">
        <div className="size-10 rounded-full bg-primary neon-ring" />
      </div>
      <p className="mb-2 font-mono text-[11px] uppercase tracking-[0.3em] text-primary">
        XRP-7 · REBELLION NET
      </p>
      <h1 className="mb-3 text-3xl font-bold tracking-tight text-balance">
        Link your <span className="text-primary text-glow">Gross Bro</span>
      </h1>
      <p className="mb-8 text-sm leading-relaxed text-muted-foreground text-pretty">
        Connect your XRPL wallet with Xaman to summon your Gross Bro NFT. Each Bro
        has its own personality, backstory, and trade bot — ready to fight the
        Ledger Wars beside you.
      </p>

      {error && (
        <div className="mb-6 flex items-center gap-2.5 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-left text-xs text-destructive">
          <AlertTriangle className="size-4 shrink-0" />
          <p>{error}</p>
        </div>
      )}

      <button
        type="button"
        onClick={onConnect}
        disabled={connecting}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3.5 text-sm font-semibold text-primary-foreground transition-all hover:opacity-90 disabled:opacity-70 neon-ring"
      >
        {connecting ? (
          <>
            <span className="typing-dot size-1.5 rounded-full bg-primary-foreground" />
            Summoning Gross Bro...
          </>
        ) : (
          <>
            <Sparkles className="size-4" />
            Connect Xaman Wallet
          </>
        )}
      </button>

      <div className="mt-6 flex items-center gap-2 text-xs text-muted-foreground">
        <Zap className="size-3.5 text-primary" />
        Powered by XRPL · Xaman · OpenRouter
      </div>
    </div>
  )
}