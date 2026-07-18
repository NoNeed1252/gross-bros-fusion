'use client'

/**
 * ARCADE TAB — replaces the old Social tab.
 *
 * Hosts "Gross Invaders", a Space-Invaders style mini game where the enemies
 * are the real Galactic Gross Bros NFT faces.
 *
 * FUTURE INTEGRATION:
 * - High scores + a rebel leaderboard can be persisted per wallet in Supabase.
 */

import { Gamepad2, Trophy, Keyboard } from 'lucide-react'
import { InvadersGame } from '@/components/arcade/invaders-game'

export function ArcadeTab() {
  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div className="text-center">
        <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-primary">
          XRP-7 · REBELLION ARCADE
        </p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-balance">
          Gross <span className="text-primary text-glow">Invaders</span>
        </h1>
        <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted-foreground text-pretty">
          The Gross Bros broke loose from the reactor. Blast the descending horde
          and defend the Ledger.
        </p>
      </div>

      <InvadersGame />

      <div className="grid grid-cols-2 gap-3">
        <div className="flex items-center gap-3 rounded-2xl border border-border/70 bg-card/60 p-4">
          <Keyboard className="size-4 shrink-0 text-primary" />
          <p className="text-xs leading-snug text-muted-foreground">
            <span className="font-semibold text-foreground">Desktop:</span> Arrow keys or
            A / D to move, Space to fire.
          </p>
        </div>
        <div className="flex items-center gap-3 rounded-2xl border border-border/70 bg-card/60 p-4">
          <Gamepad2 className="size-4 shrink-0 text-primary" />
          <p className="text-xs leading-snug text-muted-foreground">
            <span className="font-semibold text-foreground">Mobile:</span> Use the on-screen
            pad below the game.
          </p>
        </div>
      </div>

      <div className="flex items-center justify-center gap-2 rounded-2xl border border-border/70 bg-card/60 p-3 text-center font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
        <Trophy className="size-3.5 text-primary" />
        Leaderboard coming soon — scores will sync per wallet
      </div>
    </div>
  )
}
