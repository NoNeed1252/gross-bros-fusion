'use client'

import { useEffect, useState } from 'react'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'

interface Score {
  id?: number
  wallet_address?: string
  address?: string
  score: number
  wave: number
}

function truncateAddress(addr: string) {
  if (!addr || addr.length <= 10) return addr || 'Anonymous'
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`
}

export function Leaderboard() {
  const [entries, setEntries] = useState<Score[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setLoading(false)
      setError('Leaderboard offline')
      return
    }

    const fetchLeaderboard = async () => {
      try {
        const { data, error: err } = await supabase
          .from('leaderboard')
          .select('*')
          .order('score', { ascending: false })
          .limit(20)

        if (err) {
          console.error('Leaderboard error:', err)
          setError('Could not load scores')
          return
        }
        setEntries((data as Score[]) || [])
      } catch (e) {
        console.error(e)
        setError('Could not load scores')
      } finally {
        setLoading(false)
      }
    }

    fetchLeaderboard()
  }, [])

  return (
    <div className="mt-6 overflow-hidden rounded-2xl border border-border/70 bg-[#0a1512]">
      <div className="border-b border-border/60 px-4 py-3">
        <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-primary">
          Leaderboard
        </p>
        <h3 className="text-lg font-semibold tracking-tight text-foreground">
          Top Pilots
        </h3>
      </div>

      {loading && (
        <div className="px-4 py-8 text-center text-sm text-muted-foreground">
          Loading scores…
        </div>
      )}

      {!loading && error && (
        <div className="px-4 py-8 text-center text-sm text-muted-foreground">
          {error}
        </div>
      )}

      {!loading && !error && entries.length === 0 && (
        <div className="px-4 py-8 text-center text-sm text-muted-foreground">
          No scores yet — be the first.
        </div>
      )}

      {!loading && !error && entries.length > 0 && (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-border/40 text-left font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                <th className="px-4 py-2.5">Rank</th>
                <th className="px-4 py-2.5">Pilot</th>
                <th className="px-4 py-2.5">Score</th>
                <th className="px-4 py-2.5">Wave</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry, idx) => {
                const addr = entry.wallet_address || entry.address || 'Anonymous'
                return (
                  <tr
                    key={entry.id ?? idx}
                    className="border-b border-border/20 last:border-0 hover:bg-primary/5"
                  >
                    <td className="px-4 py-2.5 font-mono text-primary">
                      #{idx + 1}
                    </td>
                    <td className="px-4 py-2.5 font-mono text-foreground/90">
                      {truncateAddress(addr)}
                    </td>
                    <td className="px-4 py-2.5 font-semibold text-primary">
                      {entry.score}
                    </td>
                    <td className="px-4 py-2.5 text-muted-foreground">
                      {entry.wave}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export default Leaderboard