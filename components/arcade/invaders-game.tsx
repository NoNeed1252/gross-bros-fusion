'use client'

/**
 * GROSS INVADERS — a Space-Invaders style mini game for the Arcade tab.
 *
 * The invaders are the real Galactic Gross Bros NFT faces. Pure canvas +
 * requestAnimationFrame, no game engine. Works with keyboard (desktop) and
 * on-screen touch controls (mobile).
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import { GROSS_BROS } from '@/lib/gross-bros'

const GAME_W = 640
const GAME_H = 560

const PLAYER_W = 48
const PLAYER_H = 16
const PLAYER_Y = GAME_H - 42
const PLAYER_SPEED = 6

const BULLET_SPEED = 9
const BOMB_SPEED = 3.4

const COLS = 6
const ROWS = 4
const INV_SIZE = 40
const GAP_X = 24
const GAP_Y = 20
const OFFSET_X = 70
const OFFSET_Y = 56

type Vec = { x: number; y: number }
type Invader = { x: number; y: number; alive: boolean; img: number }

type Status = 'idle' | 'playing' | 'over'

type GameState = {
  playerX: number
  bullets: Vec[]
  bombs: Vec[]
  invaders: Invader[]
  dir: number
  speed: number
  fireCooldown: number
  bombTimer: number
}

const NEON = '#00ff9f'

export function InvadersGame() {
  const [mounted, setMounted] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const imagesRef = useRef<HTMLImageElement[]>([])
  const stateRef = useRef<GameState | null>(null)
  const rafRef = useRef<number>(0)
  const keysRef = useRef<Set<string>>(new Set())
  const touchDirRef = useRef<0 | -1 | 1>(0)
  const statusRef = useRef<Status>('idle')

  const [status, setStatus] = useState<Status>('idle')
  const [score, setScore] = useState(0)
  const [lives, setLives] = useState(3)
  const [wave, setWave] = useState(1)
  const [best, setBest] = useState(0)

  const scoreRef = useRef(0)
  const livesRef = useRef(3)
  const waveRef = useRef(1)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Preload the NFT faces used as invader sprites.
  useEffect(() => {
    if (!mounted) return
    // Only preload if we haven't already
    if (imagesRef.current.length === 0) {
      imagesRef.current = GROSS_BROS.map((b) => {
        const img = new window.Image()
        img.src = b.image
        return img
      })
    }
  }, [mounted])

  const spawnWave = useCallback((waveNum: number): Invader[] => {
    const invaders: Invader[] = []
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        invaders.push({
          x: OFFSET_X + c * (INV_SIZE + GAP_X),
          y: OFFSET_Y + r * (INV_SIZE + GAP_Y),
          alive: true,
          img: (r * COLS + c) % GROSS_BROS.length,
        })
      }
    }
    return invaders
  }, [])

  const initState = useCallback(
    (waveNum: number): GameState => ({
      playerX: GAME_W / 2 - PLAYER_W / 2,
      bullets: [],
      bombs: [],
      invaders: spawnWave(waveNum),
      dir: 1,
      speed: 0.6 + waveNum * 0.25,
      fireCooldown: 0,
      bombTimer: 60,
    }),
    [spawnWave],
  )

  const endGame = useCallback(() => {
    statusRef.current = 'over'
    setStatus('over')
    setBest((b) => Math.max(b, scoreRef.current))
  }, [])

  const draw = useCallback((ctx: CanvasRenderingContext2D, s: GameState | null) => {
    ctx.clearRect(0, 0, GAME_W, GAME_H)

    // starfield dots
    ctx.fillStyle = 'rgba(0,255,159,0.15)'
    for (let i = 0; i < 40; i++) {
      const x = (i * 97) % GAME_W
      const y = (i * 53 + (i % 7) * 11) % GAME_H
      ctx.fillRect(x, y, 2, 2)
    }

    if (!s) return

    // invaders (NFT faces)
    const imgs = imagesRef.current
    for (const inv of s.invaders) {
      if (!inv.alive) continue
      ctx.save()
      const img = imgs[inv.img]
      if (img && img.complete && img.naturalWidth > 0) {
        ctx.beginPath()
        const r = 8
        roundRect(ctx, inv.x, inv.y, INV_SIZE, INV_SIZE, r)
        ctx.clip()
        ctx.drawImage(img, inv.x, inv.y, INV_SIZE, INV_SIZE)
      } else {
        ctx.fillStyle = NEON
        roundRect(ctx, inv.x, inv.y, INV_SIZE, INV_SIZE, 8)
        ctx.fill()
      }
      ctx.restore()
      // neon outline
      ctx.strokeStyle = NEON
      ctx.lineWidth = 2
      roundRect(ctx, inv.x, inv.y, INV_SIZE, INV_SIZE, 8)
      ctx.stroke()
    }

    // player ship
    ctx.save()
    ctx.fillStyle = NEON
    const px = s.playerX
    ctx.beginPath()
    ctx.moveTo(px + PLAYER_W / 2, PLAYER_Y - PLAYER_H)
    ctx.lineTo(px + PLAYER_W, PLAYER_Y + PLAYER_H / 2)
    ctx.lineTo(px + PLAYER_W * 0.72, PLAYER_Y + PLAYER_H / 2)
    ctx.lineTo(px + PLAYER_W * 0.72, PLAYER_Y + PLAYER_H)
    ctx.lineTo(px + PLAYER_W * 0.28, PLAYER_Y + PLAYER_H)
    ctx.lineTo(px + PLAYER_W * 0.28, PLAYER_Y + PLAYER_H / 2)
    ctx.lineTo(px, PLAYER_Y + PLAYER_H / 2)
    ctx.closePath()
    ctx.fill()
    ctx.restore()

    // bullets
    ctx.save()
    ctx.fillStyle = NEON
    for (const b of s.bullets) ctx.fillRect(b.x - 2, b.y, 4, 12)
    ctx.restore()

    // bombs
    ctx.fillStyle = '#ff5470'
    for (const b of s.bombs) ctx.fillRect(b.x - 2, b.y, 4, 12)
  }, [])

  const loop = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const s = stateRef.current

    if (statusRef.current === 'playing' && s) {
      // --- movement ---
      let move = 0
      if (keysRef.current.has('left')) move -= 1
      if (keysRef.current.has('right')) move += 1
      move += touchDirRef.current
      s.playerX = clamp(s.playerX + move * PLAYER_SPEED, 4, GAME_W - PLAYER_W - 4)

      // --- player fire ---
      if (s.fireCooldown > 0) s.fireCooldown--
      if ((keysRef.current.has('fire') || keysRef.current.has('autofire')) && s.fireCooldown === 0) {
        s.bullets.push({ x: s.playerX + PLAYER_W / 2, y: PLAYER_Y - PLAYER_H })
        s.fireCooldown = 16
      }

      // --- bullets ---
      s.bullets = s.bullets.filter((b) => b.y > -20)
      for (const b of s.bullets) b.y -= BULLET_SPEED

      // --- invader movement ---
      const alive = s.invaders.filter((i) => i.alive)
      let hitEdge = false
      const step = s.speed + (ROWS * COLS - alive.length) * 0.06
      for (const inv of alive) {
        const nx = inv.x + s.dir * step
        if (nx < 6 || nx > GAME_W - INV_SIZE - 6) hitEdge = true
      }
      if (hitEdge) {
        s.dir *= -1
        for (const inv of s.invaders) inv.y += 18
      } else {
        for (const inv of s.invaders) if (inv.alive) inv.x += s.dir * step
      }

      // --- invader bombs ---
      s.bombTimer--
      if (s.bombTimer <= 0 && alive.length > 0) {
        const shooter = alive[Math.floor(Math.random() * alive.length)]
        s.bombs.push({ x: shooter.x + INV_SIZE / 2, y: shooter.y + INV_SIZE })
        s.bombTimer = Math.max(24, 90 - waveRef.current * 6)
      }
      s.bombs = s.bombs.filter((b) => b.y < GAME_H + 20)
      for (const b of s.bombs) b.y += BOMB_SPEED

      // --- collisions: bullet vs invader ---
      for (const b of s.bullets) {
        for (const inv of s.invaders) {
          if (!inv.alive) continue
          if (b.x > inv.x && b.x < inv.x + INV_SIZE && b.y > inv.y && b.y < inv.y + INV_SIZE) {
            inv.alive = false
            b.y = -100
            scoreRef.current += 10
            setScore(scoreRef.current)
          }
        }
      }

      // --- collisions: bomb vs player ---
      for (const b of s.bombs) {
        if (
          b.x > s.playerX &&
          b.x < s.playerX + PLAYER_W &&
          b.y > PLAYER_Y - PLAYER_H &&
          b.y < PLAYER_Y + PLAYER_H
        ) {
          b.y = GAME_H + 200
          livesRef.current -= 1
          setLives(livesRef.current)
          if (livesRef.current <= 0) {
            endGame()
          }
        }
      }

      // --- invaders reach the player ---
      if (s.invaders.some((i) => i.alive && i.y + INV_SIZE >= PLAYER_Y - PLAYER_H)) {
        endGame()
      }

      // --- wave cleared ---
      if (s.invaders.every((i) => !i.alive)) {
        waveRef.current += 1
        setWave(waveRef.current)
        const fresh = initState(waveRef.current)
        fresh.playerX = s.playerX
        stateRef.current = fresh
      }
    }

    draw(ctx, stateRef.current)
    rafRef.current = requestAnimationFrame(loop)
  }, [draw, endGame, initState])

  // Start / restart
  const start = useCallback(() => {
    scoreRef.current = 0
    livesRef.current = 3
    waveRef.current = 1
    setScore(0)
    setLives(3)
    setWave(1)
    stateRef.current = initState(1)
    statusRef.current = 'playing'
    setStatus('playing')
  }, [initState])

  // Single rAF lifecycle
  useEffect(() => {
    if (!mounted) return
    rafRef.current = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(rafRef.current)
  }, [loop, mounted])

  // Keyboard controls
  useEffect(() => {
    if (!mounted) return
    const down = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase()
      if (['arrowleft', 'a'].includes(k)) keysRef.current.add('left')
      if (['arrowright', 'd'].includes(k)) keysRef.current.add('right')
      if ([' ', 'arrowup', 'w'].includes(k)) {
        keysRef.current.add('fire')
        if (k === ' ') e.preventDefault()
      }
    }
    const up = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase()
      if (['arrowleft', 'a'].includes(k)) keysRef.current.delete('left')
      if (['arrowright', 'd'].includes(k)) keysRef.current.delete('right')
      if ([' ', 'arrowup', 'w'].includes(k)) keysRef.current.delete('fire')
    }
    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    return () => {
      window.removeEventListener('keydown', down)
      window.removeEventListener('keyup', up)
    }
  }, [mounted])

  // Touch button handlers
  const holdDir = (dir: 0 | -1 | 1) => () => {
    touchDirRef.current = dir
  }
  const holdFire = (on: boolean) => () => {
    if (on) keysRef.current.add('autofire')
    else keysRef.current.delete('autofire')
  }

  if (!mounted) return <div className="aspect-[640/560] w-full rounded-2xl bg-[#0a1512]" />

  return (
    <div className="select-none">
      <div className="relative overflow-hidden rounded-2xl border border-border/70 bg-[#0a1512] neon-border">
        {/* HUD */}
        <div className="flex items-center justify-between border-b border-border/60 px-4 py-2.5 font-mono text-[11px] uppercase tracking-wider">
          <span className="text-muted-foreground">
            Score <span className="text-primary">{score}</span>
          </span>
          <span className="text-muted-foreground">
            Wave <span className="text-primary">{wave}</span>
          </span>
          <span className="flex items-center gap-1 text-muted-foreground">
            Lives
            <span className="flex gap-0.5">
              {Array.from({ length: 3 }).map((_, i) => (
                <span
                  key={i}
                  className={
                    'size-2 rounded-full ' + (i < lives ? 'bg-primary' : 'bg-secondary')
                  }
                />
              ))}
            </span>
          </span>
        </div>

        {/* Canvas Wrapper */}
        <div 
          className="relative w-full aspect-[640/560] touch-none"
        >
          <canvas
            ref={canvasRef}
            width={GAME_W}
            height={GAME_H}
            className="block w-full h-full"
          />

          {/* Overlays */}
          {status !== 'playing' && (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-4 bg-background/80 px-6 text-center backdrop-blur-sm">
              <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-primary">
                XRP-7 · ARCADE
              </p>
              <h2 className="text-3xl font-bold tracking-tight text-balance">
                {status === 'over' ? 'Rebellion Down' : 'Gross Invaders'}
              </h2>
              {status === 'over' ? (
                <p className="text-sm text-muted-foreground">
                  Final score <span className="font-semibold text-primary">{score}</span>
                  {best > 0 && (
                    <>
                      {' · '}best <span className="font-semibold text-primary">{best}</span>
                    </>
                  )}
                </p>
              ) : (
                <p className="max-w-xs text-sm leading-relaxed text-muted-foreground text-pretty">
                  The Gross Bros are descending. Move, shoot, and hold the line for
                  XRP-7. Arrow keys / A · D to move, Space to fire.
                </p>
              )}
              <button
                type="button"
                onClick={start}
                className="rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-all hover:opacity-90 neon-ring"
              >
                {status === 'over' ? 'Fight Again' : 'Start Game'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Touch controls (mobile) */}
      <div className="mt-4 grid grid-cols-3 gap-3 md:hidden">
        <button
          type="button"
          aria-label="Move left"
          onPointerDown={holdDir(-1)}
          onPointerUp={holdDir(0)}
          onPointerLeave={holdDir(0)}
          onPointerCancel={holdDir(0)}
          className="flex h-16 items-center justify-center rounded-xl border border-border/70 bg-card/60 text-2xl font-bold text-primary active:bg-primary/15"
        >
          ‹
        </button>
        <button
          type="button"
          aria-label="Fire"
          onPointerDown={holdFire(true)}
          onPointerUp={holdFire(false)}
          onPointerLeave={holdFire(false)}
          onPointerCancel={holdFire(false)}
          className="flex h-16 items-center justify-center rounded-xl bg-primary text-sm font-bold uppercase tracking-wider text-primary-foreground active:opacity-80 neon-ring"
        >
          Fire
        </button>
        <button
          type="button"
          aria-label="Move right"
          onPointerDown={holdDir(1)}
          onPointerUp={holdDir(0)}
          onPointerLeave={holdDir(0)}
          onPointerCancel={holdDir(0)}
          className="flex h-16 items-center justify-center rounded-xl border border-border/70 bg-card/60 text-2xl font-bold text-primary active:bg-primary/15"
        >
          ›
        </button>
      </div>
    </div>
  )
}

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v))
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}
