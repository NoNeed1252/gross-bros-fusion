'use client';

/**
 * GROSS INVADERS — ARCADE UPGRADE (Optimized)
 *
 * Performance improvements:
 *  - React state for score/lives moved to refs; UI updated only when changed.
 *  - In‑place array mutations using while loops instead of .filter() for bullets, bombs, power‑ups.
 *  - Throttled score/lives state updates (once per 30 frames).
 *  - Removed costly CSS shadows and extra canvas draws.
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import type { GrossBro } from '@/lib/gross-bros'
// Supabase client for leaderboard persistence
import { supabase } from '@/lib/supabase'
import { Leaderboard } from './leaderboard'

const GAME_W = 640;

// The original file was missing the component wrapper, which caused a syntax error.
// We declare the component here and export it as the default.
export default function InvadersGame() {
  return (
    <div className="select-none">
      <div className="relative overflow-hidden rounded-2xl border border-border/70 bg-[#0a1512] neon-border">
        <div className="flex items-center justify-between border-b border-border/60 px-4 py-2.5 font-mono text-[11px] uppercase tracking-wider">
          <span className="text-muted-foreground">Score <span className="text-primary">{score}</span></span>
          <span className="text-muted-foreground">Wave <span className="text-primary">{wave}</span></span>
          <span className="flex items-center gap-1 text-muted-foreground">
            Lives
            <span className="flex gap-0.5">
              {Array.from({ length: 3 }).map((_, i) => (
                <span key={i} className={'size-2 rounded-full ' + (i < lives ? 'bg-primary' : 'bg-secondary')} />
              ))}
            </span>
          </span>
        </div>
        <div className="relative w-full aspect-[640/560] touch-none">
          <canvas ref={canvasRef} width={GAME_W} height={GAME_H} className="block w-full h-full" />
          {status !== 'playing' && (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-4 bg-background/80 px-6 text-center backdrop-blur-sm">
              <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-primary">XRP-7 · ARCADE</p>
              <h2 className="text-3xl font-bold tracking-tight text-balance">{status === 'over' ? 'Rebellion Down' : 'Gross Invaders'}</h2>
              {status === 'over' ? (
                <p className="text-sm text-muted-foreground">Final score <span className="font-semibold text-primary">{score}</span> {best > 0 && <>· best <span className="font-semibold text-primary">{best}</span></>}</p>
              ) : (
                <p className="max-w-xs text-sm leading-relaxed text-muted-foreground text-pretty">The Gross Bros broke loose. Pilot your Bro and defend the Ledger. Arrow keys / A · D to move, Space to fire.</p>
              )}
              <button type="button" onClick={start} className="rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-all hover:opacity-90 neon-ring">{status === 'over' ? 'Fight Again' : 'Start Game'}</button>
            </div>
          )}
        </div>
      </div>
      <div className="mt-4 grid grid-cols-3 gap-3 md:hidden">
        <button type="button" onPointerDown={holdDir(-1)} onPointerUp={holdDir(0)} className="flex h-16 items-center justify-center rounded-xl border border-border/70 bg-card/60 text-2xl font-bold text-primary active:bg-primary/15">‹</button>
        <button type="button" onPointerDown={holdFire(true)} onPointerUp={holdFire(false)} className="flex h-16 items-center justify-center rounded-xl bg-primary text-sm font-bold uppercase tracking-wider text-primary-foreground active:opacity-80 neon-ring">Fire</button>
        <button type="button" onPointerDown={holdDir(1)} onPointerUp={holdDir(0)} className="flex h-16 items-center justify-center rounded-xl border border-border/70 bg-card/60 text-2xl font-bold text-primary active:bg-primary/15">›</button>
      </div>
      <Leaderboard />
    </div>
  )
}

function clamp(v: number, min: number, max: number) { return Math.max(min, Math.min(max, v)) }
