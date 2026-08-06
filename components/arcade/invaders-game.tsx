'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

const W = 640
const H = 560
const PLAYER_W = 64
const PLAYER_H = 44
const PLAYER_Y = H - 82
const SPEED = 8
const BULLET_SPEED = 11
const BOMB_SPEED = 4
const INV_SIZE = 36
const COLORS = ['#C0C0C0', '#FFFFFF', '#94a3b8', '#e2e8f0']
const ALIEN: number[][] = [
  [0,0,1,1,1,1,0,0], [0,1,1,1,1,1,1,0], [1,1,1,1,1,1,1,1],
  [1,0,1,1,1,1,0,1], [1,0,0,1,1,0,0,1], [0,1,0,0,0,0,1,0],
]
const SHIP: number[][] = [
  [0,0,0,1,1,0,0,0], [0,0,1,1,1,1,0,0], [1,1,1,1,1,1,1,1],
  [1,1,0,1,1,0,1,1], [1,0,0,1,1,0,0,1],
]
type Item = { x: number; y: number; alive: boolean; row: number }
type Shot = { x: number; y: number }

function sprite(ctx: CanvasRenderingContext2D, x: number, y: number, data: number[][], color: string, scale: number) {
  ctx.fillStyle = color
  data.forEach((row, py) => row.forEach((on, px) => {
    if (on) ctx.fillRect(x + px * scale, y + py * scale, scale, scale)
  }))
}

export function InvadersGame({ walletAddress }: { bro?: unknown; walletAddress?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const keys = useRef<Record<string, boolean>>({})
  const player = useRef(W / 2 - PLAYER_W / 2)
  const invaders = useRef<Item[]>([])
  const shots = useRef<Shot[]>([])
  const bombs = useRef<Shot[]>([])
  const [score, setScore] = useState(0)
  const [wave, setWave] = useState(1)
  const [lives, setLives] = useState(3)
  const [playing, setPlaying] = useState(false)
  const scoreRef = useRef(0)
  const waveRef = useRef(1)
  const livesRef = useRef(3)

  const spawn = useCallback((n: number) => {
    const next: Item[] = []
    for (let row = 0; row < 4; row++) for (let col = 0; col < 10; col++) {
      next.push({ x: 42 + col * 58, y: 48 + row * 44, alive: true, row })
    }
    invaders.current = next
    shots.current = []
    bombs.current = []
    waveRef.current = n
  }, [])

  const submit = useCallback(() => {
    const address = walletAddress || (typeof window !== 'undefined' ? localStorage.getItem('wallet_address') : null)
    if (!address) return
    fetch('/api/leaderboard', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ address, score: scoreRef.current, wave: waveRef.current }),
    }).catch((error) => console.error('Leaderboard submission failed:', error))
  }, [walletAddress])

  useEffect(() => {
    const down = (event: KeyboardEvent) => { keys.current[event.key.toLowerCase()] = true }
    const up = (event: KeyboardEvent) => { keys.current[event.key.toLowerCase()] = false }
    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up) }
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return
    let frame = 0
    let last = 0
    let direction = 1
    let fireAt = 0
    const loop = (time: number) => {
      if (playing) {
        const step = keys.current.arrowleft || keys.current.a ? -SPEED : keys.current.arrowright || keys.current.d ? SPEED : 0
        player.current = Math.max(4, Math.min(W - PLAYER_W - 4, player.current + step))
        if (keys.current[' '] || keys.current.enter) {
          if (time - last > 180) { shots.current.push({ x: player.current + PLAYER_W / 2, y: PLAYER_Y }); last = time }
        }
        shots.current.forEach((shot) => { shot.y -= BULLET_SPEED })
        shots.current = shots.current.filter((shot) => shot.y > 0)
        const live = invaders.current.filter((item) => item.alive)
        if (live.length && time > fireAt) {
          const target = live[Math.floor(Math.random() * live.length)]
          bombs.current.push({ x: target.x + INV_SIZE / 2, y: target.y + INV_SIZE })
          fireAt = time + Math.max(320, 900 - waveRef.current * 45)
        }
        bombs.current.forEach((bomb) => { bomb.y += BOMB_SPEED })
        bombs.current = bombs.current.filter((bomb) => bomb.y < H)
        const edge = live.some((item) => item.x + direction * (1.2 + waveRef.current * 0.2) < 8 || item.x + direction * (1.2 + waveRef.current * 0.2) > W - INV_SIZE - 8)
        if (edge) { direction *= -1; invaders.current.forEach((item) => { if (item.alive) item.y += 18 }) }
        else invaders.current.forEach((item) => { if (item.alive) item.x += direction * (1.2 + waveRef.current * 0.2) })
        shots.current.forEach((shot) => invaders.current.forEach((item) => {
          if (item.alive && shot.x > item.x && shot.x < item.x + INV_SIZE && shot.y > item.y && shot.y < item.y + INV_SIZE) {
            item.alive = false; shot.y = -100; scoreRef.current += 15; setScore(scoreRef.current)
          }
        }))
        bombs.current.forEach((bomb) => {
          if (bomb.x > player.current && bomb.x < player.current + PLAYER_W && bomb.y > PLAYER_Y && bomb.y < PLAYER_Y + PLAYER_H) {
            bomb.y = H + 1; livesRef.current -= 1; setLives(livesRef.current)
            if (livesRef.current <= 0) { setPlaying(false); submit() }
          }
        })
        if (invaders.current.every((item) => !item.alive)) { waveRef.current += 1; setWave(waveRef.current); spawn(waveRef.current) }
        if (invaders.current.some((item) => item.alive && item.y + INV_SIZE > PLAYER_Y)) { setPlaying(false); submit() }
      }
      ctx.fillStyle = '#121212'; ctx.fillRect(0, 0, W, H)
      ctx.strokeStyle = '#18181b'; ctx.lineWidth = 1
      for (let y = 0; y < H; y += 28) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke() }
      invaders.current.forEach((item) => { if (item.alive) sprite(ctx, item.x, item.y, ALIEN, COLORS[item.row], 4) })
      sprite(ctx, player.current, PLAYER_Y, SHIP, '#FFFFFF', 8)
      ctx.fillStyle = '#C0C0C0'; shots.current.forEach((shot) => ctx.fillRect(shot.x - 2, shot.y, 4, 13))
      ctx.fillStyle = '#94a3b8'; bombs.current.forEach((bomb) => ctx.fillRect(bomb.x - 2, bomb.y, 4, 13))
      ctx.fillStyle = '#FFFFFF'; ctx.font = 'bold 16px monospace'; ctx.fillText(`SCORE ${score}`, 12, 22); ctx.fillText(`WAVE ${wave}`, 270, 22); ctx.fillText(`LIVES ${lives}`, 520, 22)
      frame = requestAnimationFrame(loop)
    }
    spawn(1)
    frame = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(frame)
  }, [playing, score, wave, lives, spawn, submit])

  const start = () => { scoreRef.current = 0; livesRef.current = 3; setScore(0); setLives(3); setWave(1); spawn(1); setPlaying(true) }
  const move = (direction: string) => { player.current = Math.max(4, Math.min(W - PLAYER_W - 4, player.current + (direction === 'left' ? -18 : 18))) }

  return <div className="mx-auto w-full max-w-[640px] select-none border border-[#C0C0C0] bg-[#121212] p-3 text-[#FFFFFF]">
    <div className="mb-3 flex items-center justify-between border-b border-[#C0C0C0] pb-2 font-mono text-xs tracking-[0.2em]"><span>SECTOR 7</span><span>GROSS INVADERS</span></div>
    <div className="border border-[#18181b] bg-[#121212]"><canvas ref={canvasRef} width={W} height={H} className="block h-auto w-full" /></div>
    {!playing && <button type="button" onClick={start} className="mt-3 w-full border border-[#C0C0C0] bg-[#0f172a] px-4 py-3 font-mono text-sm font-bold tracking-[0.2em] text-white">START MISSION</button>}
    {playing && <div className="mt-3 flex gap-2 md:hidden"><button type="button" onClick={() => move('left')} className="flex-1 border border-[#C0C0C0] bg-[#18181b] py-3 font-mono text-white">LEFT</button><button type="button" onClick={() => { keys.current[' '] = true; setTimeout(() => { keys.current[' '] = false }, 120) }} className="flex-1 border border-[#C0C0C0] bg-[#0f172a] py-3 font-mono text-white">FIRE</button><button type="button" onClick={() => move('right')} className="flex-1 border border-[#C0C0C0] bg-[#18181b] py-3 font-mono text-white">RIGHT</button></div>}
  </div>
}

export default InvadersGame
