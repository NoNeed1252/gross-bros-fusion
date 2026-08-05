'use client'

import type { GrossBro } from '@/lib/gross-bros'
import { InvadersGame } from '@/components/arcade/invaders-game'

interface ArcadeTabProps {
  bro: GrossBro
}

export function ArcadeTab({ bro }: ArcadeTabProps) {
  return (
    <div className="mx-auto w-full max-w-3xl">
      <InvadersGame bro={bro} />
    </div>
  )
}