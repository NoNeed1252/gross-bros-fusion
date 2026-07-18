'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { Send, Bot } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { GrossBro } from '@/lib/gross-bros'

export type ChatMessage = {
  id: string
  role: 'user' | 'bro' | 'system'
  text: string
}

export function ChatPanel({
  bro,
  messages,
  typing,
  onSend,
}: {
  bro: GrossBro
  messages: ChatMessage[]
  typing: boolean
  onSend: (text: string) => void
}) {
  const [draft, setDraft] = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, typing])

  function submit() {
    const text = draft.trim()
    if (!text) return
    onSend(text)
    setDraft('')
  }

  const quickPrompts = ['What can you do?', 'Read the market', 'Tell me your story']

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-border/70 bg-card/40">
      {/* Chat header */}
      <div className="flex items-center gap-3 border-b border-border/60 bg-card/60 px-4 py-3">
        <div className="relative size-9 overflow-hidden rounded-full border border-primary/40">
          <Image src={bro.image || '/placeholder.svg'} alt={bro.name} fill className="object-cover" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-foreground">{bro.name}</p>
          <p className="flex items-center gap-1.5 font-mono text-[10px] tracking-wider text-primary">
            <span className="size-1.5 rounded-full bg-primary pulse-dot" />
            LINKED · SPEAKING IN-CHARACTER
          </p>
        </div>
        <Bot className="size-4 text-muted-foreground" />
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto px-4 py-5">
        {messages.map((m) =>
          m.role === 'system' ? (
            <div key={m.id} className="flex justify-center">
              <span className="rounded-full border border-border/60 bg-secondary/50 px-3 py-1 font-mono text-[10px] tracking-wider text-muted-foreground">
                {m.text}
              </span>
            </div>
          ) : (
            <div
              key={m.id}
              className={cn('flex gap-2.5', m.role === 'user' ? 'justify-end' : 'justify-start')}
            >
              {m.role === 'bro' && (
                <div className="relative mt-0.5 size-7 shrink-0 overflow-hidden rounded-full border border-primary/40">
                  <Image src={bro.image || '/placeholder.svg'} alt="" fill className="object-cover" />
                </div>
              )}
              <div
                className={cn(
                  'max-w-[78%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed',
                  m.role === 'user'
                    ? 'rounded-br-sm bg-primary text-primary-foreground'
                    : 'rounded-bl-sm border border-border/70 bg-secondary/60 text-foreground',
                )}
              >
                {m.text}
              </div>
            </div>
          ),
        )}

        {typing && (
          <div className="flex gap-2.5">
            <div className="relative mt-0.5 size-7 shrink-0 overflow-hidden rounded-full border border-primary/40">
              <Image src={bro.image || '/placeholder.svg'} alt="" fill className="object-cover" />
            </div>
            <div className="flex items-center gap-1 rounded-2xl rounded-bl-sm border border-border/70 bg-secondary/60 px-4 py-3">
              <span className="typing-dot size-1.5 rounded-full bg-primary" style={{ animationDelay: '0ms' }} />
              <span className="typing-dot size-1.5 rounded-full bg-primary" style={{ animationDelay: '150ms' }} />
              <span className="typing-dot size-1.5 rounded-full bg-primary" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        )}
      </div>

      {/* Quick prompts */}
      <div className="flex flex-wrap gap-2 border-t border-border/60 px-4 pt-3">
        {quickPrompts.map((q) => (
          <button
            key={q}
            type="button"
            onClick={() => onSend(q)}
            className="rounded-full border border-border/70 bg-secondary/40 px-3 py-1 text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
          >
            {q}
          </button>
        ))}
      </div>

      {/* Composer */}
      <div className="flex items-center gap-2 p-4">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.nativeEvent.isComposing && e.keyCode !== 229) {
              e.preventDefault()
              submit()
            }
          }}
          placeholder={`Message ${bro.name}...`}
          className="h-11 flex-1 rounded-xl border border-border/70 bg-background/60 px-4 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary/50"
        />
        <button
          type="button"
          onClick={submit}
          disabled={!draft.trim()}
          aria-label="Send message"
          className="grid size-11 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground transition-all hover:opacity-90 disabled:opacity-40"
        >
          <Send className="size-4" />
        </button>
      </div>
    </div>
  )
}
