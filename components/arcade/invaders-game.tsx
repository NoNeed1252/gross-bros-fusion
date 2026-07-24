'use client';

import React, { useRef, useState, useEffect, useCallback } from "react";
import { Leaderboard } from "./leaderboard";
import { GROSS_BROS } from "@/assets";

const GAME_W = 640;
const GAME_H = 560;

const UI_COLOR = "#00ff9f";

interface Player { x: number; y: number; width: number; height: number; }
interface Enemy { x: number; y: number; size: number; }
interface Bullet { x: number; y: number; size: number; }

export function InvadersGame() {
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [wave, setWave] = useState(1);
  const [status, setStatus] = useState<'idle' | 'playing' | 'over'>('idle');

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);

  const playerRef = useRef<Player>({ x: GAME_W / 2 - 15, y: GAME_H - 30, width: 30, height: 20 });
  const enemiesRef = useRef<Enemy[]>([]);
  const bulletsRef = useRef<Bullet[]>([]);
  const lastFireRef = useRef<number>(0);

  const invaderImg = useRef<HTMLImageElement>(new Image());
  useEffect(() => { invaderImg.current.src = GROSS_BROS?.invader?.src ?? ""; }, []);

  const resetGame = useCallback(() => {
    setScore(0);
    setLives(3);
    setWave(1);
    playerRef.current = { x: GAME_W / 2 - 15, y: GAME_H - 30, width: 30, height: 20 };
    enemiesRef.current = [];
    bulletsRef.current = [];
    setStatus('idle');
  }, []);

  const start = useCallback(() => {
    resetGame();
    setStatus('playing');
    spawnWave();
    animationRef.current = requestAnimationFrame(gameLoop);
  }, [resetGame]);

  const spawnWave = useCallback(() => {
    const cols = 8;
    const rows = Math.min(3 + wave, 6);
    const spacing = 40;
    const startX = (GAME_W - (cols - 1) * spacing) / 2;
    const enemies: Enemy[] = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        enemies.push({ x: startX + c * spacing, y: 30 + r * spacing, size: 30 });
      }
    }
    enemiesRef.current = enemies;
  }, [wave]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (status !== 'playing') return;
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        playerRef.current.x = Math.max(0, playerRef.current.x - 15);
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        playerRef.current.x = Math.min(GAME_W - playerRef.current.width, playerRef.current.x + 15);
      } else if (e.key === ' ' || e.key === 'Spacebar') {
        fireBullet();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [status]);

  const fireBullet = useCallback(() => {
    const now = Date.now();
    if (now - lastFireRef.current < 200) return;
    lastFireRef.current = now;
    const p = playerRef.current;
    bulletsRef.current.push({ x: p.x + p.width / 2 - 2, y: p.y - 10, size: 4 });
  }, []);

  const gameLoop = useCallback(() => {
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = UI_COLOR;
    ctx.fillRect(0, 0, GAME_W, GAME_H);
    const player = playerRef.current;
    ctx.fillStyle = UI_COLOR;
    ctx.fillRect(player.x, player.y, player.width, player.height);
    ctx.fillStyle = '#ffdd00';
    const bulletSpeed = 9;
    bulletsRef.current = bulletsRef.current.filter(b => { b.y -= bulletSpeed; if (b.y < 0) return false; ctx.fillRect(b.x, b.y, b.size, b.size * 3); return true; });
    const enemySpeed = 0.6 + wave * 0.25;
    enemiesRef.current = enemiesRef.current.filter(e => {
      e.y += enemySpeed;
      if (e.x < player.x + player.width && e.x + e.size > player.x && e.y < player.y + player.height && e.y + e.size > player.y) {
        setLives(l => { const nl = l - 1; if (nl <= 0) setStatus('over'); return nl; });
        return false;
      }
      const hitIdx = bulletsRef.current.findIndex(b => b.x < e.x + e.size && b.x + b.size > e.x && b.y < e.y + e.size && b.y + b.size * 3 > e.y);
      if (hitIdx !== -1) { bulletsRef.current.splice(hitIdx, 1); setScore(s => s + 10); return false; }
      if (invaderImg.current.complete && invaderImg.current.src) {
        ctx.drawImage(invaderImg.current, e.x, e.y, e.size, e.size);
      } else {
        ctx.fillRect(e.x, e.y, e.size, e.size);
      }
      if (e.y + e.size >= GAME_H) {
        setLives(l => { const nl = l - 1; if (nl <= 0) setStatus('over'); return nl; });
        return false;
      }
      return true;
    });
    if (enemiesRef.current.length === 0 && status === 'playing') { setWave(w => w + 1); spawnWave(); }
    if (status === 'playing') animationRef.current = requestAnimationFrame(gameLoop);
  }, [status, wave, spawnWave]);

  useEffect(() => () => cancelAnimationFrame(animationRef.current), []);

  return (
    <div className="select-none">
      <div className="relative overflow-hidden rounded-2xl border border-border/70 bg-[#001f00] neon-border">
        <div className="flex items-center justify-between border-b border-border/60 px-4 py-2.5 font-mono text-[11px] uppercase tracking-wider" style={{ color: UI_COLOR }}>
          <span>Score <span style={{ color: UI_COLOR }}>{score}</span></span>
          <span>Wave <span style={{ color: UI_COLOR }}>{wave}</span></span>
          <span className="flex items-center gap-1">Lives<span className="flex gap-0.5">{Array.from({ length: 3 }).map((_, i) => (<span key={i} className={i < lives ? 'size-2 rounded-full bg-primary' : 'size-2 rounded-full bg-secondary'} />))}</span></span>
        </div>
        <div className="relative w-full aspect-[640/560] touch-none">
          <canvas ref={canvasRef} width={GAME_W} height={GAME_H} className="block w-full h-full" />
          {status !== 'playing' && (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-4 bg-background/80 px-6 text-center backdrop-blur-sm">
              <p className="font-mono text-[11px] uppercase tracking-[0.3em]" style={{ color: UI_COLOR }}>XRP-7 · ARCADE</p>
              <h2 className="text-3xl font-bold tracking-tight text-balance" style={{ color: UI_COLOR }}>{status === 'over' ? 'Rebellion Down' : 'Gross Invaders'}</h2>
              {status === 'over' ? (<p className="text-sm text-muted-foreground">Final score <span className="font-semibold" style={{ color: UI_COLOR }}>{score}</span></p>) : (<p className="max-w-xs text-sm leading-relaxed text-muted-foreground text-pretty">The Gross Bros broke loose. Pilot your Bro and defend the Ledger. Arrow keys / A · D to move, Space to fire.</p>)}
              <button type="button" onClick={start} className="rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-all hover:opacity-90 neon-ring">{status === 'over' ? 'Fight Again' : 'Start Game'}</button>
            </div>
          )}
        </div>
      </div>
      <Leaderboard />
    </div>
  );
}

export default InvadersGame;
