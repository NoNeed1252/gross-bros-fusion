'use client'

/**
 * SOCIAL TAB — community / network hub.
 *
 * FUTURE INTEGRATION:
 * - Leaderboards, holder activity, and rebellion stats will be sourced from
 *   Supabase + on-chain XRPL data. Sections below are clean placeholders.
 */

import { Trophy, Activity, Users, TrendingUp } from 'lucide-react'

const LEADERBOARD = [
  { rank: 1, name: 'Sludge #7749', pnl: '+412%', slime: 9820 },
  { rank: 2, name: 'Gunk #0420', pnl: '+287%', slime: 7410 },
  { rank: 3, name: 'Mucus #1337', pnl: '+201%', slime: 6650 },
  { rank: 4, name: 'Bile #0069', pnl: '+188%', slime: 5900 },
  { rank: 5, name: 'Phlegm #2222', pnl: '+142%', slime: 4720 },
]

const ACTIVITY = [
  { who: 'Sludge #7749', what: 'flipped the bot to autonomous', when: '2m' },
  { who: 'Gunk #0420', what: 'deposited 1,200 XRP', when: '11m' },
  { who: 'Mucus #1337', what: 'joined the Nebula Runners', when: '34m' },
  { who: 'Bile #0069', what: 'closed a +38% position', when: '1h' },
]

const STATS = [
  { icon: Users, label: 'Active Bros', value: '2,341' },
  { icon: Activity, label: 'Bots Online', value: '1,087' },
  { icon: TrendingUp, label: 'Net PnL 24h', value: '+8.9%' },
]

export function SocialTab() {
  return (
    <div className="mx-auto max-w-4xl space-y-4">
      {/* Stat strip */}
      <div className="grid grid-cols-3 gap-3">
        {STATS.map(({ icon: Icon, label, value }) => (
          <div
            key={label}
            className="rounded-2xl border border-border/70 bg-card/60 p-4 text-center"
          >
            <Icon className="mx-auto mb-2 size-4 text-primary" />
            <p className="text-lg font-bold text-foreground sm:text-2xl">{value}</p>
            <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              {label}
            </p>
          </div>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Leaderboard */}
        <div className="rounded-2xl border border-border/70 bg-card/60 p-4">
          <div className="mb-3 flex items-center gap-2">
            <Trophy className="size-4 text-primary" />
            <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
              Rebel Leaderboard
            </p>
          </div>
          <ul className="space-y-1">
            {LEADERBOARD.map((row) => (
              <li
                key={row.rank}
                className="flex items-center gap-3 rounded-xl px-2 py-2 transition-colors hover:bg-secondary/40"
              >
                <span
                  className={
                    'grid size-6 place-items-center rounded-md font-mono text-xs font-bold ' +
                    (row.rank <= 3
                      ? 'bg-primary/15 text-primary'
                      : 'bg-secondary text-muted-foreground')
                  }
                >
                  {row.rank}
                </span>
                <span className="flex-1 truncate text-sm font-medium text-foreground">
                  {row.name}
                </span>
                <span className="font-mono text-xs text-primary">{row.pnl}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Activity feed */}
        <div className="rounded-2xl border border-border/70 bg-card/60 p-4">
          <div className="mb-3 flex items-center gap-2">
            <Activity className="size-4 text-primary" />
            <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
              Holder Activity
            </p>
          </div>
          <ul className="space-y-3">
            {ACTIVITY.map((a, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary" />
                <p className="flex-1 text-sm leading-snug text-muted-foreground">
                  <span className="font-semibold text-foreground">{a.who}</span> {a.what}
                </p>
                <span className="font-mono text-[10px] text-muted-foreground">{a.when}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <p className="px-1 text-center font-mono text-[10px] tracking-wider text-muted-foreground">
        {'// PLACEHOLDER — COMMUNITY DATA FROM SUPABASE + XRPL'}
      </p>
    </div>
  )
}
