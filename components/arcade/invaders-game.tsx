'use client'

/**
 * GROSS INVADERS — UPGRADED
 *
 * 1. Barriers: Destructible bunkers.
 * 2. Player Ship: Render active Gross Bro NFT face.
 * 3. Enemies: Retro spaceship/bug sprites.
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import type { GrossBro } from '@/lib/gross-bros'

const GAME_W = 640
const GAME_H = 560

const PLAYER_W = 44
const PLAYER_H = 44
const PLAYER_Y = GAME_H - 70
const PLAYER_SPEED = 6

const BULLET_SPEED = 9
const BOMB_SPEED = 3.4

const COLS = 6
const ROWS = 4
const INV_SIZE = 36
const GAP_X = 28
const GAP_Y = 24
const OFFSET_X = 70
const OFFSET_Y = 56

const BARRIER_COUNT = 4
const BARRIER_W = 64
const BARRIER_H = 40
const BARRIER_Y = PLAYER_Y - 80

type Vec = { x: number; y: number }
type Invader = { x: number; y: number; alive: boolean; type: number }
type Barrier = { x: number; y: number; health: number }

type Status = 'idle' | 'playing' | 'over'

type GameState = {
  playerX: number
  bullets: Vec[]
  bombs: Vec[]
  invaders: Invader[]
  barriers: Barrier[]
  dir: number
  speed: number
  fireCooldown: number
  bombTimer: number
}

const NEON = '#00ff9f'
const ENEMY_COLORS = ['#ff00ff', '#00d2ff', '#ff5470', '#ffe600']

export function InvadersGame({ bro }: { bro: GrossBro }) {
  const [mounted, setMounted] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const playerImgRef = useRef<HTMLImageElement | null>(null)
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

  // Load active Bro image for the player ship
  useEffect(() => {
    if (!mounted) return
    const img = new window.Image()
    img.src = bro.image
    img.onload = () => {
      playerImgRef.current = img
    }
  }, [mounted, bro.image])

  const spawnWave = useCallback((waveNum: number): Invader[] => {
    const invaders: Invader[] = []
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        invaders.push({
          x: OFFSET_X + c * (INV_SIZE + GAP_X),
          y: OFFSET_Y + r * (INV_SIZE + GAP_Y),
          alive: true,
          type: r % 4, // different enemy types
        })
      }
    }
    return invaders
  }, [])

  const initBarriers = useCallback((): Barrier[] => {
    const barriers: Barrier[] = []
    const spacing = (GAME_W - (BARRIER_COUNT * BARRIER_W)) / (BARRIER_COUNT + 1)
    for (let i = 0; i < BARRIER_COUNT; i++) {
      barriers.push({
        x: spacing + i * (BARRIER_W + spacing),
        y: BARRIER_Y,
        health: 12,
      })
    }
    return barriers
  }, [])

  const initState = useCallback(
    (waveNum: number): GameState => ({
      playerX: GAME_W / 2 - PLAYER_W / 2,
      bullets: [],
      bombs: [],
      invaders: spawnWave(waveNum),
      barriers: initBarriers(),
      dir: 1,
      speed: 0.7 + waveNum * 0.3,
      fireCooldown: 0,
      bombTimer: 60,
    }),
    [spawnWave, initBarriers],
  )

  const endGame = useCallback(() => {
    statusRef.current = 'over'
    setStatus('over')
    setBest((b) => Math.max(b, scoreRef.current))
  }, [])

  const drawEnemy = (ctx: CanvasRenderingContext2D, x: number, y: number, type: number, step: number) => {
    ctx.fillStyle = ENEMY_COLORS[type]
    const s = INV_SIZE / 12
    
    ctx.beginPath()
    if (type === 0) { // Bug
      ctx.fillRect(x + 4*s, y + 2*s, 4*s, 2*s)
      ctx.fillRect(x + 2*s, y + 4*s, 8*s, 2*s)
      ctx.fillRect(x, y + 6*s, 12*s, 2*s)
      ctx.fillRect(x + 2*s, y + 8*s, 2*s, 2*s)
      ctx.fillRect(x + 8*s, y + 8*s, 2*s, 2*s)
      // legs
      if (step % 2 === 0) {
        ctx.fillRect(x, y + 2*s, 2*s, 2*s)
        ctx.fillRect(x + 10*s, y + 2*s, 2*s, 2*s)
      } else {
        ctx.fillRect(x, y + 10*s, 2*s, 2*s)
        ctx.fillRect(x + 10*s, y + 10*s, 2*s, 2*s)
      }
    } else if (type === 1) { // Ship
      ctx.fillRect(x + 5*s, y, 2*s, 4*s)
      ctx.fillRect(x + 2*s, y + 4*s, 8*s, 4*s)
      ctx.fillRect(x, y + 8*s, 12*s, 2*s)
      ctx.fillRect(x + 4*s, y + 10*s, 4*s, 2*s)
    } else if (type === 2) { // Spider
      ctx.fillRect(x + 3*s, y + 2*s, 6*s, 6*s)
      ctx.fillRect(x, y + 4*s, 3*s, 2*s)
      ctx.fillRect(x + 9*s, y + 4*s, 3*s, 2*s)
      if (step % 2 === 0) {
        ctx.fillRect(x, y, 2*s, 2*s)
        ctx.fillRect(x + 10*s, y, 2*s, 2*s)
      } else {
        ctx.fillRect(x, y + 10*s, 2*s, 2*s)
        ctx.fillRect(x + 10*s, y + 10*s, 2*s, 2*s)
      }
    } else { // Robot
      ctx.fillRect(x + 2*s, y, 8*s, 8*s)
      ctx.fillRect(x + 4*s, y + 2*s, 1.5*s, 1.5*s) // eye
      ctx.fillRect(x + 6.5*s, y + 2*s, 1.5*s, 1.5*s) // eye
      ctx.fillRect(x, y + 8*s, 12*s, 2*s)
    }
  }

  const draw = useCallback((ctx: CanvasRenderingContext2D, s: GameState | null) => {
    ctx.clearRect(0, 0, GAME_W, GAME_H)

    // starfield dots
    ctx.fillStyle = 'rgba(0,255,159,0.12)'
    for (let i = 0; i < 40; i++) {
      const x = (i * 97) % GAME_W
      const y = (i * 53 + (i % 7) * 11) % GAME_H
      ctx.fillRect(x, y, 2, 2)
    }

    if (!s) return

    // Barriers
    for (const b of s.barriers) {
      if (b.health <= 0) continue
      ctx.fillStyle = `rgba(0, 255, 159, ${b.health / 12})`
      ctx.strokeStyle = NEON
      ctx.lineWidth = 1
      const bx = b.x
      const by = b.y
      // Draw bunker shape
      ctx.beginPath()
      ctx.roundRect(bx, by, BARRIER_W, BARRIER_H, 4)
      ctx.fill()
      ctx.stroke()
      // Damage cracks
      if (b.health < 8) {
        ctx.strokeStyle = '#0a1512'
        ctx.beginPath()
        ctx.moveTo(bx + 10, by + 5); ctx.lineTo(bx + 20, by + 15)
        ctx.moveTo(bx + 50, by + 20); ctx.lineTo(bx + 40, by + 30)
        ctx.stroke()
      }
    }

    // Enemies (Procedural)
    const stepCount = Math.floor(Date.now() / 500)
    for (const inv of s.invaders) {
      if (!inv.alive) continue
      drawEnemy(ctx, inv.x, inv.y, inv.type, stepCount)
    }

    // Player (Gross Bro Image)
    ctx.save()
    const pimg = playerImgRef.current
    if (pimg && pimg.complete && pimg.naturalWidth > 0) {
      ctx.beginPath()
      ctx.roundRect(s.playerX, PLAYER_Y, PLAYER_W, PLAYER_H, 8)
      ctx.clip()
      ctx.drawImage(pimg, s.playerX, PLAYER_Y, PLAYER_W, PLAYER_H)
      // Neon frame for the NFT ship
      ctx.strokeStyle = NEON
      ctx.lineWidth = 2
      ctx.strokeRect(s.playerX, PLAYER_Y, PLAYER_W, PLAYER_H)
    } else {
      // Fallback ship
      ctx.fillStyle = NEON
      ctx.fillRect(s.playerX, PLAYER_Y, PLAYER_W, PLAYER_H)
    }
    ctx.restore()

    // Bullets (Player)
    ctx.fillStyle = NEON
    for (const b of s.bullets) ctx.fillRect(b.x - 2, b.y, 4, 12)

    // Bombs (Enemies)
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
        s.bullets.push({ x: s.playerX + PLAYER_W / 2, y: PLAYER_Y })
        s.fireCooldown = 18
      }

      // --- bullets ---
      s.bullets = s.bullets.filter((b) => b.y > -20)
      for (const b of s.bullets) {
        b.y -= BULLET_SPEED
        // Bullet vs Barrier
        for (const bar of s.barriers) {
          if (bar.health > 0 && b.x > bar.x && b.x < bar.x + BARRIER_W && b.y > bar.y && b.y < bar.y + BARRIER_H) {
            bar.health -= 1
            b.y = -100
          }
        }
      }

      // --- invader movement ---
      const alive = s.invaders.filter((i) => i.alive)
      let hitEdge = false
      const step = s.speed + (ROWS * COLS - alive.length) * 0.08
      for (const inv of alive) {
        const nx = inv.x + s.dir * step
        if (nx < 6 || nx > GAME_W - INV_SIZE - 6) hitEdge = true
      }
      if (hitEdge) {
        s.dir *= -1
        for (const inv of s.invaders) inv.y += 20
      } else {
        for (const inv of s.invaders) if (inv.alive) inv.x += s.dir * step
      }

      // --- invader bombs ---
      s.bombTimer--
      if (s.bombTimer <= 0 && alive.length > 0) {
        const shooter = alive[Math.floor(Math.random() * alive.length)]
        s.bombs.push({ x: shooter.x + INV_SIZE / 2, y: shooter.y + INV_SIZE })
        s.bombTimer = Math.max(20, 100 - waveRef.current * 8)
      }
      s.bombs = s.bombs.filter((b) => b.y < GAME_H + 20)
      for (const b of s.bombs) {
        b.y += BOMB_SPEED
        // Bomb vs Barrier
        for (const bar of s.barriers) {
          if (bar.health > 0 && b.x > bar.x && b.x < bar.x + BARRIER_W && b.y > bar.y && b.y < bar.y + BARRIER_H) {
            bar.health -= 1
            b.y = GAME_H + 100
          }
        }
      }

      // --- collisions: bullet vs invader ---
      for (const b of s.bullets) {
        for (const inv of s.invaders) {
          if (!inv.alive) continue
          if (b.x > inv.x && b.x < inv.x + INV_SIZE && b.y > inv.y && b.y < inv.y + INV_SIZE) {
            inv.alive = false
            b.y = -100
            scoreRef.current += 15
            setScore(scoreRef.current)
          }
        }
      }

      // --- collisions: bomb vs player ---
      for (const b of s.bombs) {
        if (
          b.x > s.playerX &&
          b.x < s.playerX + PLAYER_W &&
          b.y > PLAYER_Y &&
          b.y < PLAYER_Y + PLAYER_H
        ) {
          b.y = GAME_H + 200
          livesRef.current -= 1
          setLives(livesRef.current)
          if (livesRef.current <= 0) endGame()
        }
      }

      // --- invaders reach the player ---
      if (s.invaders.some((i) => i.alive && i.y + INV_SIZE >= BARRIER_Y)) {
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

  useEffect(() => {
    if (!mounted) return
    rafRef.current = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(rafRef.current)
  }, [loop, mounted])

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

  const holdDir = (dir: 0 | -1 | 1) => () => { touchDirRef.current = dir }
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

        {/* Canvas Wrapper */}
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
              <button type="button" onClick={start} className="rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-all hover:opacity-90 neon-ring">
                {status === 'over' ? 'Fight Again' : 'Start Game'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Touch controls (mobile) */}
      <div className="mt-4 grid grid-cols-3 gap-3 md:hidden">
        <button type="button" onPointerDown={holdDir(-1)} onPointerUp={holdDir(0)} className="flex h-16 items-center justify-center rounded-xl border border-border/70 bg-card/60 text-2xl font-bold text-primary active:bg-primary/15">‹</button>
        <button type="button" onPointerDown={holdFire(true)} onPointerUp={holdFire(false)} className="flex h-16 items-center justify-center rounded-xl bg-primary text-sm font-bold uppercase tracking-wider text-primary-foreground active:opacity-80 neon-ring">Fire</button>
        <button type="button" onPointerDown={holdDir(1)} onPointerUp={holdDir(0)} className="flex h-16 items-center justify-center rounded-xl border border-border/70 bg-card/60 text-2xl font-bold text-primary active:bg-primary/15">›</button>
      </div>
    </div>
  )
}

function clamp(v: number, min: number, max: number) { return Math.max(min, Math.min(max, v)) }
