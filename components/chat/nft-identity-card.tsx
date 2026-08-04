'use client'

import Image from 'next/image'
import { Sparkles } from 'lucide-react'
import type { GrossBro } from '@/lib/gross-bros'

function StatBar({ label, value }: { label: string; value: number }) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
        <span>{label}</span>
        <span className="text-primary">{value}</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-secondary">
        <div
          className="h-full rounded-full bg-primary"
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  )
}

export function NftIdentityCard({ bro }: { bro: GrossBro }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border/70 bg-card/60 neon-border">
      <div className="relative aspect-square w-full overflow-hidden">
        <Image
          src={bro.image || '/placeholder.svg'}
          alt={`${bro.name} — ${bro.species}`}
          fill
          sizes="(max-width: 768px) 100vw, 320px"
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-card via-card/20 to-transparent" />
        <div className="absolute left-3 top-3 flex items-center gap-1.5 rounded-full border border-primary/40 bg-background/70 px-2.5 py-1 backdrop-blur">
          <Sparkles className="size-3 text-primary" />
          <span className="font-mono text-[10px] tracking-wider text-primary">
            #{bro.tokenId}
          </span>
        </div>
        <div className="absolute inset-x-0 bottom-0 p-4">
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-primary">
            {bro.faction}
          </p>
          <h2 className="text-xl font-bold text-foreground text-balance">{bro.name}</h2>
          <p className="text-xs text-muted-foreground">{bro.species}</p>
        </div>
      </div>

      <div className="space-y-4 p-4">
        <p className="text-sm leading-relaxed text-muted-foreground text-pretty">
          {bro.backstory}
        </p>

        {/* On-chain traits */}
        <div className="flex flex-wrap gap-1.5">
          {bro.traits.map((t) => (
            <span
              key={t.type}
              className="rounded-md border border-primary/20 bg-primary/5 px-2 py-1 font-mono text-[10px] text-muted-foreground"
            >
              <span className="text-primary/80">{t.type}:</span> {t.value}
            </span>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-x-4 gap-y-3">
          <StatBar label="Chaos" value={bro.stats.chaos} />
          <StatBar label="Slime" value={bro.stats.slime} />
          <StatBar label="Loyalty" value={bro.stats.loyalty} />
          <StatBar label="Degeneracy" value={bro.stats.degeneracy} />
        </div>
      </div>
    </div>
  )
}
