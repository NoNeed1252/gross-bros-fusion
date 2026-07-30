'use client';

import { Gamepad2, Trophy, Keyboard, Loader2 } from 'lucide-react'
import dynamic from 'next/dynamic'
// Load the heavy canvas game only on the client to avoid SSR hydration issues on mobile Safari.
const InvadersGame = dynamic(
  () => import('@/components/arcade/invaders-game').then((mod) => mod.InvadersGame),
  { ssr: false }
)
import { useState, useEffect } from 'react'
import type { GrossBro } from '@/lib/gross-bros'
import { getSupabase } from '@/lib/supabase'

// Helper to format wallet addresses for display
const formatWallet = (addr?: string) => {
  if (!addr || addr === 'Anonymous' || addr === 'Anon') return 'Anon'
  if (addr.length > 10) return `${addr.slice(0, 4)}...${addr.slice(-4)}`
  return addr
}

interface Score {
  // The wallet address of the player
  wallet_address: string
  // Total score achieved by the player
  score: number
  // The highest wave the player reached
  wave: number
}

interface ArcadeTabProps {
  bro: GrossBro
}

export function ArcadeTab({ bro }: ArcadeTabProps) {
  const [leaderboard, setLeaderboard] = useState<Score[]>([])
  const [loading, setLoading] = useState(true)

  // Fetch live leaderboard entries from Supabase on mount
  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const supabase = getSupabase()
        const { data, error } = await supabase
          .from('leaderboard')
          .select('wallet_address,score,wave')
          .order('score', { ascending: false })

        if (error) {
          console.error('Failed to fetch leaderboard:', error)
          setLeaderboard([])
        } else if (data) {
          setLeaderboard(data as Score[])
        }
      } catch (e) {
        console.error('Unexpected error while fetching leaderboard', e)
        setLeaderboard([])
      } finally {
        setLoading(false)
      }
    }

    fetchLeaderboard()
  }, [])

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

      <InvadersGame bro={bro} />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="space-y-3">
          <div className="flex items-center gap-3 rounded-2xl border border-border/70 bg-card/60 p-4">
            <Keyboard className="size-4 shrink-0 text-primary" />
            <p className="text-xs leading-snug text-muted-foreground">
              <span className="font-semibold text-foreground">Desktop:</span> Arrow keys or
              A/D to move, Space to fire.
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

        <div className="rounded-2xl border border-border/70 bg-card/60 p-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-wider text-primary">
              <Trophy className="size-3.5" />
              Rebellion Leaderboard
            </h3>
            <span className="font-mono text-[9px] text-muted-foreground uppercase">Top Pilots</span>
          </div>

          <div className="space-y-2">
            {loading ? (
              <div className="flex h-24 items-center justify-center">
                <Loader2 className="size-4 animate-spin text-primary/40" />
              </div>
            ) : (
              leaderboard.map((s, i) => (
                <div key={i} className="flex items-center justify-between rounded-lg bg-background/40 px-3 py-2">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-[10px] text-primary/60">#0{i + 1}</span>
                    <span className="font-mono text-[11px] text-foreground">{formatWallet(s.wallet_address)}</span>
                  </div>
                  <div className="text-right">
                    <div className="font-mono text-[11px] font-bold text-primary">{s.score}</div>
                    <div className="font-mono text-[8px] text-muted-foreground uppercase">Wave {s.wave}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
