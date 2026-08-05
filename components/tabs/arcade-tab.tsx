'use client'

import type { GrossBro } from '@/lib/gross-bros'
import { InvadersGame } from '@/components/arcade/invaders-game'
import { Leaderboard } from '@/components/arcade/leaderboard'

interface ArcadeTabProps {
  bro: GrossBro
  walletAddress?: string
}

export function ArcadeTab({ bro, walletAddress }: ArcadeTabProps) {
  return (
    <div className="mx-auto w-full max-w-3xl space-y-2">
      <InvadersGame bro={bro} walletAddress={walletAddress} />
      <Leaderboard />
    </div>
  )
}