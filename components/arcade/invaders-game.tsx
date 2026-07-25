'use client';

/**
 * GROSS INVADERS — ARCADE UPGRADE
 *
 * 1. Power-ups: Shields, Double Shots, Speed Boosts.
 * 2. Player Ship: Render active Gross Bro NFT face inside a futuristic neon chassis.
 * 3. Enemies: Retro spaceship/bug sprites.
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import type { GrossBro } from '@/lib/gross-bros'

const GAME_W = 640
const GAME_H = 560

const PLAYER_W = 56
const PLAYER_H = 56
const PLAYER_Y = GAME_H - 80
const PLAYER_SPEED_BASE = 6

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

const POWERUP_SIZE = 24
const POWERUP_SPEED = 2.5

type Vec = { x: number; y: number }
type Invader = { x: number; y: number; alive: boolean; type: number }
type Barrier = { x: number; y: number; health: number }

type PowerUpType = 'shield' | 'double' | 'speed'
type PowerUp = { x: number; y: number; type: PowerUpType }

type Status = 'idle' | 'playing' | 'over'

type GameState = {
  playerX: number
  playerSpeed: number
  bullets: Vec[]
  bombs: Vec[]
  invaders: Invader[]
  barriers: Barrier[]
  powerups: PowerUp[]
  dir: number
  speed: number
  fireCooldown: number
  bombTimer: number
  activeShield: number // timer
  activeDouble: number // timer
  activeSpeed: number  // timer
}

const NEON = '#00ff9f'
const ENEMY_COLORS = ['#ff00ff', '#00d2ff', '#ff5470', '#ffe600']
const POWERUP_COLORS = {
  shield: '#00d2ff',
  double: '#ff00ff',
  speed: '#ffe600'
}

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
          type: r % 4,
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
      playerSpeed: PLAYER_SPEED_BASE,
      bullets: [],
      bombs: [],
      invaders: spawnWave(waveNum),
      barriers: initBarriers(),
      powerups: [],
      dir: 1,
      speed: 0.7 + waveNum * 0.3,
      fireCooldown: 0,
      bombTimer: 60,
      activeShield: 0,
      activeDouble: 0,
      activeSpeed: 0
    }),
    [spawnWave, initBarriers],
  )

  const endGame = useCallback(() => {
    statusRef.current = 'over'
    setStatus('over')
    setBest((b) => Math.max(b, scoreRef.current))
    
    // Notify High Score
    if (scoreRef.current > 0) {
      console.log('Final Score:', scoreRef.current, 'for address:', bro.owner);
    }
  }, [bro.owner])

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
      ctx.fillRect(x + 4*s, y + 2*s, 1.5*s, 1.5*s)
      ctx.fillRect(x + 6.5*s, y + 2*s, 1.5*s, 1.5*s)
      ctx.fillRect(x, y + 8*s, 12*s, 2*s)
    }
  }

  const draw = useCallback((ctx: CanvasRenderingContext2D, s: GameState | null) => {
    ctx.clearRect(0, 0, GAME_W, GAME_H)

    ctx.fillStyle = 'rgba(0,255,159,0.12)'
    for (let i = 0; i < 40; i++) {
      const x = (i * 97) % GAME_W
      const y = (i * 53 + (i % 7) * 11) % GAME_H
      ctx.fillRect(x, y, 2, 2)
    }

    if (!s) return

    for (const b of s.barriers) {
      if (b.health <= 0) continue
      ctx.fillStyle = `rgba(0, 255, 159, ${b.health / 12})`
      ctx.strokeStyle = NEON
      ctx.lineWidth = 1
      const bx = b.x
      const by = b.y
      ctx.beginPath()
      // Mobile‑Safari compatibility: use rect() if roundRect() is unavailable
      if (typeof (ctx as any).roundRect === 'function') {
        ctx.roundRect(bx, by, BARRIER_W, BARRIER_H, 4)
      } else {
        ctx.rect(bx, by, BARRIER_W, BARRIER_H)
      }
      ctx.fill()
      ctx.stroke()
      if (b.health < 8) {
        ctx.strokeStyle = '#0a1512'
        ctx.beginPath()
        ctx.moveTo(bx + 10, by + 5); ctx.lineTo(bx + 20, by + 15)
        ctx.moveTo(bx + 50, by + 20); ctx.lineTo(bx + 40, by + 30)
        ctx.stroke()
      }
    }

    const stepCount = Math.floor(Date.now() / 500)
    for (const inv of s.invaders) {
      if (!inv.alive) continue
      drawEnemy(ctx, inv.x, inv.y, inv.type, stepCount)
    }

    // Power-ups
    for (const pu of s.powerups) {
      ctx.fillStyle = POWERUP_COLORS[pu.type]
      ctx.beginPath()
      ctx.arc(pu.x + POWERUP_SIZE/2, pu.y + POWERUP_SIZE/2, POWERUP_SIZE/2, 0, Math.PI*2)
      ctx.fill()
      ctx.fillStyle = '#0a1512'
      ctx.font = 'bold 12px monospace'
      ctx.textAlign = 'center'
      ctx.fillText(pu.type[0].toUpperCase(), pu.x + POWERUP_SIZE/2, pu.y + POWERUP_SIZE/2 + 4)
    }

    // Player
    const px = s.playerX
    const py = PLAYER_Y
    const pw = PLAYER_W
    const ph = PLAYER_H

    // Animated Thrusters
    const tTime = Date.now() / 50
    ctx.strokeStyle = s.activeSpeed > 0 ? POWERUP_COLORS.speed : NEON
    ctx.lineWidth = 1.5
    for (let i = 0; i < 3; i++) {
        const ty = py + ph + 2 + (i * 4 + tTime % 4)
        const tOffset = Math.sin(tTime + i) * 2
        ctx.beginPath()
        ctx.moveTo(px + pw * 0.35 + tOffset, ty)
        ctx.lineTo(px + pw * 0.35 + tOffset, ty + 6)
        ctx.moveTo(px + pw * 0.65 + tOffset, ty)
        ctx.lineTo(px + pw * 0.65 + tOffset, ty + 6)
        ctx.stroke()
    }

    ctx.save()
    if (s.activeShield > 0) {
      ctx.strokeStyle = POWERUP_COLORS.shield
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.arc(px + pw/2, py + ph/2, pw * 0.8, 0, Math.PI*2)
      ctx.stroke()
      ctx.fillStyle = 'rgba(0, 210, 255, 0.08)'
      ctx.fill()
    }

    // Gorgeous Spaceship Chassis
    const shipColor = s.activeSpeed > 0 ? POWERUP_COLORS.speed : NEON
    ctx.strokeStyle = shipColor
    ctx.lineWidth = 2
    ctx.lineJoin = 'round'
    
    // 1. Wings & Body Base
    ctx.beginPath()
    ctx.moveTo(px + pw/2, py + 4) // Center Front
    ctx.lineTo(px + pw + 8, py + ph - 8) // Right Wing Tip
    ctx.lineTo(px + pw * 0.7, py + ph + 2) // Right Rear
    ctx.lineTo(px + pw * 0.3, py + ph + 2) // Left Rear
    ctx.lineTo(px - 8, py + ph - 8) // Left Wing Tip
    ctx.closePath()
    ctx.stroke()

    // 2. Chassis Detail Lines
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(px + pw * 0.2, py + ph * 0.7); ctx.lineTo(px + pw * 0.8, py + ph * 0.7)
    ctx.moveTo(px + pw * 0.5, py + ph + 2); ctx.lineTo(px + pw * 0.5, py + py * 0.7)
    ctx.stroke()

    // 3. Compact Pilot Cockpit (Seamless Integration)
    const cockpitSize = 26
    const cx = px + (pw - cockpitSize) / 2
    const cy = py + 6
    
    const pimg = playerImgRef.current
    if (pimg && pimg.complete && pimg.naturalWidth > 0) {
      ctx.save()
      ctx.beginPath()
      ctx.arc(cx + cockpitSize/2, cy + cockpitSize/2, cockpitSize/2, 0, Math.PI * 2)
      ctx.clip()
      ctx.drawImage(pimg, cx, cy, cockpitSize, cockpitSize)
      ctx.restore()
      
      // Pilot Canopy Frame
      ctx.strokeStyle = shipColor
      ctx.lineWidth = 1.5
      ctx.beginPath()
      ctx.arc(cx + cockpitSize/2, cy + cockpitSize/2, cockpitSize/2, 0, Math.PI * 2)
      ctx.stroke()

      // Glass shine highlight
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)'
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.arc(cx + cockpitSize/2, cy + cockpitSize/2, cockpitSize/2 - 2, -Math.PI * 0.7, -Math.PI * 0.3)
      ctx.stroke()
    } else {
      ctx.fillStyle = shipColor
      ctx.beginPath()
      ctx.arc(cx + cockpitSize/2, cy + cockpitSize/2, cockpitSize/2, 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.restore()

    ctx.fillStyle = s.activeDouble > 0 ? POWERUP_COLORS.double : NEON
    for (const b of s.bullets) ctx.fillRect(b.x - 2, b.y, 4, 12)

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
      if (s.activeShield > 0) s.activeShield--
      if (s.activeDouble > 0) s.activeDouble--
      if (s.activeSpeed > 0) {
        s.activeSpeed--
        s.playerSpeed = PLAYER_SPEED_BASE * 1.6
      } else {
        s.playerSpeed = PLAYER_SPEED_BASE
      }

      let move = 0
      if (keysRef.current.has('left')) move -= 1
      if (keysRef.current.has('right')) move += 1
      move += touchDirRef.current
      s.playerX = clamp(s.playerX + move * s.playerSpeed, 4, GAME_W - PLAYER_W - 4)

      if (s.fireCooldown > 0) s.fireCooldown--
      if ((keysRef.current.has('fire') || keysRef.current.has('autofire')) && s.fireCooldown === 0) {
        if (s.activeDouble > 0) {
          s.bullets.push({ x: s.playerX + 10, y: PLAYER_Y })
          s.bullets.push({ x: s.playerX + PLAYER_W - 10, y: PLAYER_Y })
        } else {
          s.bullets.push({ x: s.playerX + PLAYER_W / 2, y: PLAYER_Y })
        }
        s.fireCooldown = 18
      }

      s.bullets = s.bullets.filter((b) => b.y > -20)
      for (const b of s.bullets) {
        b.y -= BULLET_SPEED
        for (const bar of s.barriers) {
          if (bar.health > 0 && b.x > bar.x && b.x < bar.x + BARRIER_W && b.y > bar.y && b.y < bar.y + BARRIER_H) {
            bar.health -= 1
            b.y = -100
          }
        }
      }

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

      s.bombTimer--
      if (s.bombTimer <= 0 && alive.length > 0) {
        const shooter = alive[Math.floor(Math.random() * alive.length)]
        s.bombs.push({ x: shooter.x + INV_SIZE / 2, y: shooter.y + INV_SIZE })
        s.bombTimer = Math.max(20, 100 - waveRef.current * 8)
      }
      s.bombs = s.bombs.filter((b) => b.y < GAME_H + 20)
      for (const b of s.bombs) {
        b.y += BOMB_SPEED
        for (const bar of s.barriers) {
          if (bar.health > 0 && b.x > bar.x && b.x < bar.x + BARRIER_W && b.y > bar.y && b.y < bar.y + BARRIER_H) {
            bar.health -= 1
            b.y = GAME_H + 100
          }
        }
      }

      // Power-up movement and collection
      s.powerups = s.powerups.filter(pu => pu.y < GAME_H + 20)
      for (const pu of s.powerups) {
        pu.y += POWERUP_SPEED
        if (pu.x > s.playerX - POWERUP_SIZE && pu.x < s.playerX + PLAYER_W && pu.y > PLAYER_Y && pu.y < PLAYER_Y + PLAYER_H) {
          if (pu.type === 'shield') s.activeShield = 600
          if (pu.type === 'double') s.activeDouble = 600
          if (pu.type === 'speed') s.activeSpeed = 600
          pu.y = GAME_H + 200
        }
      }

      for (const b of s.bullets) {
        for (const inv of s.invaders) {
          if (!inv.alive) continue
          if (b.x > inv.x && b.x < inv.x + INV_SIZE && b.y > inv.y && b.y < inv.y + INV_SIZE) {
            inv.alive = false
            b.y = -100
            scoreRef.current += 15
            setScore(scoreRef.current)
            // Power-up Drop Chance
            if (Math.random() < 0.15) {
              const types: PowerUpType[] = ['shield', 'double', 'speed']
              s.powerups.push({
                x: inv.x + INV_SIZE/2 - POWERUP_SIZE/2,
                y: inv.y + INV_SIZE/2,
                type: types[Math.floor(Math.random() * types.length)]
              })
            }
          }
        }
      }

      for (const b of s.bombs) {
        if (b.x > s.playerX && b.x < s.playerX + PLAYER_W && b.y > PLAYER_Y && b.y < PLAYER_Y + PLAYER_H) {
          b.y = GAME_H + 200
          if (s.activeShield > 0) {
            s.activeShield = 0
          } else {
            livesRef.current -= 1
            setLives(livesRef.current)
            if (livesRef.current <= 0) endGame()
          }
        }
      }

      if (s.invaders.some((i) => i.alive && i.y + INV_SIZE >= BARRIER_Y)) {
        endGame()
      }

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

  const startGame = useCallback(() => {
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
      if ([' ', 'arrowup', 'w'].includes(k)) {
        keysRef.current.delete('fire')
      }
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
        <div className="flex items-center justify-between border-b border-border/60 px-4 py-2.5 font-mono text-[11px] uppercase tracking-wider">
          <span className="text-muted-foreground">Score <span className="text-primary">{score}</span></span>
          <span className="text-muted-foreground">Wave <span className="text-primary">{wave}</span></span>
          <span className="flex items-center gap-1 text-muted-foreground">
            Lives
            <span className="flex gap-0.5">
              {Array.from({ length: 3 }).map((_, i) => (
                <span key={i} className={i < lives ? 'size-2 rounded-full bg-primary' : 'size-2 rounded-full bg-secondary'} />
              ))}
            </span>
          </span>
        </div>

        <div className="relative w-full aspect-[640/560]">
          <canvas ref={canvasRef} width={GAME_W} height={GAME_H} className="block w-full h-full touch-none" />
          {status !== 'playing' && (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-4 bg-background/80 px-6 text-center backdrop-blur-sm">
              <p className="font-mono text-[11px] uppercase tracking-[0.3em]" style={{ color: NEON }}>XRP-7 · ARCADE</p>
              <h2 className="text-3xl font-bold tracking-tight text-balance" style={{ color: NEON }}>{status === 'over' ? 'Rebellion Down' : 'Gross Invaders'}</h2>
              {status === 'over' ? (<p className="text-sm text-muted-foreground">Final score <span className="font-semibold" style={{ color: NEON }}>{score}</span></p>) : (<p className="max-w-xs text-sm leading-relaxed text-muted-foreground text-pretty">The Gross Bros broke loose. Pilot your Bro and defend the Ledger. Arrow keys / A · D to move, Space to fire.</p>)}
              <button type="button" onClick={startGame} className="rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-all hover:opacity-90 neon-ring">{status === 'over' ? 'Fight Again' : 'Start Game'}</button>
            </div>
          )}

          {/* Mobile controls - styled exactly like the original screenshot */}
          {status === 'playing' && (
            <div className="absolute bottom-0 left-0 right-0 z-30 flex items-center justify-between gap-3 bg-[#0a1512] px-4 py-3 border-t border-primary/30 md:hidden">
              {/* Left arrow */}
              <button
                onPointerDown={holdDir(-1)}
                onPointerUp={holdDir(0)}
                onPointerLeave={holdDir(0)}
                onPointerCancel={holdDir(0)}
                className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#111f1a] text-3xl font-bold text-primary border border-primary/40 active:bg-primary/10 active:scale-[0.95] transition-all select-none"
                aria-label="Move left"
              >
                &lt;
              </button>

              {/* Big FIRE button (matches original glowing style) */}
              <button
                onPointerDown={holdFire(true)}
                onPointerUp={holdFire(false)}
                onPointerLeave={holdFire(false)}
                onPointerCancel={holdFire(false)}
                className="flex-1 max-w-[210px] h-14 rounded-2xl bg-primary text-[#0a1512] text-lg font-extrabold tracking-[3px] shadow-[0_0_25px_#00ff9f] active:bg-[#00cc7a] active:scale-[0.985] transition-all select-none"
                aria-label="Fire"
              >
                FIRE
              </button>

              {/* Right arrow */}
              <button
                onPointerDown={holdDir(1)}
                onPointerUp={holdDir(0)}
                onPointerLeave={holdDir(0)}
                onPointerCancel={holdDir(0)}
                className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#111f1a] text-3xl font-bold text-primary border border-primary/40 active:bg-primary/10 active:scale-[0.95] transition-all select-none"
                aria-label="Move right"
              >
                &gt;
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default InvadersGame;

function clamp(v: number, min: number, max: number) { return Math.max(min, Math.min(max, v)) }