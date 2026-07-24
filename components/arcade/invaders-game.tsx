'use client';

import React, { useRef, useState, useEffect, useCallback } from "react";
import { Leaderboard } from "./leaderboard";

const GAME_W = 640;
const GAME_H = 560;

// Types for simple game entities
interface Player {
  x: number;
  y: number;
  width: number;
  height: number;
}
interface Enemy {
  x: number;
  y: number;
  size: number;
}

export default function InvadersGame() {
  // Game state
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [wave, setWave] = useState(1);
  const [status, setStatus] = useState<'idle' | 'playing' | 'over'>('idle');

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);

  // Refs for mutable objects (performance)
  const playerRef = useRef<Player>({ x: GAME_W / 2 - 15, y: GAME_H - 30, width: 30, height: 20 });
  const enemiesRef = useRef<Enemy[]>([]);
  const bulletsRef = useRef<{ x: number; y: number; size: number }[]>([]);
  const lastFireRef = useRef<number>(0);

  // Helper to reset game
  const resetGame = useCallback(() => {
    setScore(0);
    setLives(3);
    setWave(1);
    playerRef.current = { x: GAME_W / 2 - 15, y: GAME_H - 30, width: 30, height: 20 };
    enemiesRef.current = [];
    bulletsRef.current = [];
    setStatus('idle');
  }, []);

  // Start button handler
  const start = useCallback(() => {
    resetGame();
    setStatus('playing');
    spawnWave();
    animationRef.current = requestAnimationFrame(gameLoop);
  }, [resetGame]);

  // Spawn a wave of enemies
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

  // Keyboard handling (A/D arrows, Space)
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
    if (now - lastFireRef.current < 200) return; // fire rate limit
    lastFireRef.current = now;
    const player = playerRef.current;
    bulletsRef.current.push({ x: player.x + player.width / 2 - 2, y: player.y - 10, size: 4 });
  }, []);

  // Main game loop
  const gameLoop = useCallback(() => {
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, GAME_W, GAME_H);

    // Draw player
    const player = playerRef.current;
    ctx.fillStyle = '#00ff99';
    ctx.fillRect(player.x, player.y, player.width, player.height);

    // Update and draw bullets
    ctx.fillStyle = '#ffdd00';
    bulletsRef.current = bulletsRef.current.filter((b) => {
      b.y -= 6;
      if (b.y < 0) return false;
      ctx.fillRect(b.x, b.y, b.size, b.size * 3);
      return true;
    });

    // Update and draw enemies
    ctx.fillStyle = '#ff4444';
    const enemySpeed = 0.5 + wave * 0.1;
    enemiesRef.current = enemiesRef.current.filter((e) => {
      e.y += enemySpeed;
      // Collision with player
      if (
        e.x < player.x + player.width &&
        e.x + e.size > player.x &&
        e.y < player.y + player.height &&
        e.y + e.size > player.y
      ) {
        // Player hit
        setLives((l) => {
          const newLives = l - 1;
          if (newLives <= 0) {
            setStatus('over');
          }
          return newLives;
        });
        return false;
      }
      // Collision with bullets
      const hitIndex = bulletsRef.current.findIndex(
        (b) => b.x < e.x + e.size && b.x + b.size > e.x && b.y < e.y + e.size && b.y + b.size * 3 > e.y
      );
      if (hitIndex !== -1) {
        // Remove bullet
        bulletsRef.current.splice(hitIndex, 1);
        setScore((s) => s + 10);
        return false;
      }
      // Draw enemy if still alive
      ctx.fillRect(e.x, e.y, e.size, e.size);
      // If enemy reaches bottom, player loses a life
      if (e.y + e.size >= GAME_H) {
        setLives((l) => {
          const newLives = l - 1;
          if (newLives <= 0) {
            setStatus('over');
          }
          return newLives;
        });
        return false;
      }
      return true;
    });

    // Check if wave cleared
    if (enemiesRef.current.length === 0 && status === 'playing') {
      setWave((w) => w + 1);
      spawnWave();
    }

    // Continue loop if still playing
    if (status === 'playing') {
      animationRef.current = requestAnimationFrame(gameLoop);
    }
  }, [status, wave, spawnWave]);

  // Cleanup on unmount
  useEffect(() => {
    return () => cancelAnimationFrame(animationRef.current);
  }, []);

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
        <div className="relative w-full aspect-[640/560] touch-none">
          <canvas ref={canvasRef} width={GAME_W} height={GAME_H} className="block w-full h-full" />
          {status !== 'playing' && (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-4 bg-background/80 px-6 text-center backdrop-blur-sm">
              <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-primary">XRP-7 · ARCADE</p>
              <h2 className="text-3xl font-bold tracking-tight text-balance">{status === 'over' ? 'Rebellion Down' : 'Gross Invaders'}</h2>
              {status === 'over' ? (
                <p className="text-sm text-muted-foreground">Final score <span className="font-semibold text-primary">{score}</span></p>
              ) : (
                <p className="max-w-xs text-sm leading-relaxed text-muted-foreground text-pretty">The Gross Bros broke loose. Pilot your Bro and defend the Ledger. Arrow keys / A · D to move, Space to fire.</p>
              )}
              <button type="button" onClick={start} className="rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-all hover:opacity-90 neon-ring">{status === 'over' ? 'Fight Again' : 'Start Game'}</button>
            </div>
          )}
        </div>
      </div>
      <Leaderboard />
    </div>
  );
}
