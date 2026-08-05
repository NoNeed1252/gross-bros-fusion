'use client'

import type { GrossBro } from '@/lib/gross-bros'
import { InvadersGame } from '@/components/arcade/invaders-game'
import { Leaderboard } from '@/components/arcade/leaderboard'

interface ArcadeTabProps {
  bro: GrossBro
}

export function ArcadeTab({ bro }: ArcadeTabProps) {
  return (
    <div className="mx-auto w-full max-w-3xl space-y-2">
      <InvadersGame bro={bro} />
      <Leaderboard />
    </div>
  )
}