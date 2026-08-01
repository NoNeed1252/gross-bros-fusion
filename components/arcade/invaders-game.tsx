'use client';

/**
 * Full-screen Space Invaders implementation for the Gross Bros Fusion arcade.
 * Features:
 *  - 8‑bit style alien pixel matrix drawing with cyan, magenta, and green colors.
 *  - Mobile touch control buttons (LEFT, RIGHT, FIRE) styled cleanly.
 *  - Canvas based gameplay, keyboard support, and score/leaderboard submission.
 */

import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase';

interface LeaderboardEntry {
  wallet_address: string;
  score: number;
  wave: number;
}

const PLAYER_WIDTH = 72;
const PLAYER_HEIGHT = 24;
const PLAYER_SPEED = 5;

const CANVAS_W = 640;
const CANVAS_H = 480;
const INVADER_ROWS = 5;
const INVADER_COLS = 10;
const INVADER_WIDTH = 40;
const INVADER_HEIGHT = 30;
const INVADER_HGAP = 20;
const INVADER_VGAP = 20;
const INVADER_START_Y = 40;
const BULLET_SPEED = 7;
const ENEMY_BULLET_SPEED = 4;
const ENEMY_FIRE_INTERVAL = 1500;

// Colors for the alien matrix – cycled per column
const INVADER_COLORS = ['#00ffff', '#ff00ff', '#00ff00']; // cyan, magenta, green

export default function InvadersGame({ bro }: { bro?: any }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [wave, setWave] = useState(1);
  const [lives, setLives] = useState(3);
  const [gameOver, setGameOver] = useState(false);

  const playerRef = useRef({ x: CANVAS_W / 2 - PLAYER_WIDTH / 2, y: CANVAS_H - PLAYER_HEIGHT - 10 });
  const bulletsRef = useRef<Array<{ x: number; y: number }>>([]);
  const enemyBulletsRef = useRef<Array<{ x: number; y: number }>>([]);
  const invadersRef = useRef<Array<{ x: number; y: number; alive: boolean; col: number }>>([]);
  const lastEnemyFireRef = useRef(0);
  const keys = useRef<{ [k: string]: boolean }>({});

  const initInvaders = () => {
    const invaders: typeof invadersRef.current = [];
    const totalWidth = INVADER_COLS * INVADER_WIDTH + (INVADER_COLS - 1) * INVADER_HGAP;
    const offsetX = (CANVAS_W - totalWidth) / 2;
    for (let r = 0; r < INVADER_ROWS; r++) {
      for (let c = 0; c < INVADER_COLS; c++) {
        invaders.push({
          x: offsetX + c * (INVADER_WIDTH + INVADER_HGAP),
          y: INVADER_START_Y + r * (INVADER_HEIGHT + INVADER_VGAP),
          alive: true,
          col: c,
        });
      }
    }
    invadersRef.current = invaders;
  };

  const startWave = () => {
    initInvaders();
    bulletsRef.current = [];
    enemyBulletsRef.current = [];
    lastEnemyFireRef.current = performance.now();
  };

  const submitScore = async () => {
    const wallet = localStorage.getItem('wallet_address') ?? 'Anonymous';
    const entry: LeaderboardEntry = { wallet_address: wallet, score, wave };
    try {
      const { error } = await supabase.from('leaderboard').insert(entry);
      if (error) console.error('Leaderboard insert error:', error);
    } catch (e) {
      console.error('Failed to submit leaderboard entry', e);
    }
  };

  // Keyboard listeners
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      keys.current[e.key] = true;
      if ((e.key === ' ' || e.key === 'Enter') && !gameOver) {
        const p = playerRef.current;
        bulletsRef.current.push({ x: p.x + PLAYER_WIDTH / 2, y: p.y });
      }
    };
    const up = (e: KeyboardEvent) => {
      keys.current[e.key] = false;
    };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
    };
  }, []);

  // Touch button handlers – used by the on‑screen UI
  const touchMove = (dir: 'left' | 'right') => {
    const p = playerRef.current;
    if (dir === 'left') p.x = Math.max(0, p.x - PLAYER_SPEED);
    else p.x = Math.min(CANVAS_W - PLAYER_WIDTH, p.x + PLAYER_SPEED);
  };
  const touchFire = () => {
    if (gameOver) return;
    const p = playerRef.current;
    bulletsRef.current.push({ x: p.x + PLAYER_WIDTH / 2, y: p.y });
  };

  // Main game loop
  useEffect(() => {
    let animationId: number;
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    startWave();
    const loop = (time: number) => {
      const p = playerRef.current;
      // Keyboard movement
      if (keys.current['ArrowLeft'] || keys.current['a'] || keys.current['A']) p.x = Math.max(0, p.x - PLAYER_SPEED);
      if (keys.current['ArrowRight'] || keys.current['d'] || keys.current['D']) p.x = Math.min(CANVAS_W - PLAYER_WIDTH, p.x + PLAYER_SPEED);

      // Player bullets
      bulletsRef.current.forEach(b => (b.y -= BULLET_SPEED));
      bulletsRef.current = bulletsRef.current.filter(b => b.y > 0);

      // Enemy fire
      if (time - lastEnemyFireRef.current > ENEMY_FIRE_INTERVAL) {
        const alive = invadersRef.current.filter(i => i.alive);
        if (alive.length) {
          const shooter = alive[Math.floor(Math.random() * alive.length)];
          enemyBulletsRef.current.push({ x: shooter.x + INVADER_WIDTH / 2, y: shooter.y + INVADER_HEIGHT });
        }
        lastEnemyFireRef.current = time;
      }

      // Enemy bullets movement
      enemyBulletsRef.current.forEach(b => (b.y += ENEMY_BULLET_SPEED));
      enemyBulletsRef.current = enemyBulletsRef.current.filter(b => b.y < CANVAS_H);

      // Collision detection (player bullets vs invaders)
      bulletsRef.current.forEach(bullet => {
        invadersRef.current.forEach(inv => {
          if (!inv.alive) return;
          if (
            bullet.x > inv.x &&
            bullet.x < inv.x + INVADER_WIDTH &&
            bullet.y > inv.y &&
            bullet.y < inv.y + INVADER_HEIGHT
          ) {
            inv.alive = false;
            bullet.y = -100;
            setScore(s => s + 10);
          }
        });
      });
      bulletsRef.current = bulletsRef.current.filter(b => b.y > 0);

      // Collision detection (enemy bullets vs player)
      enemyBulletsRef.current.forEach(b => {
        if (b.x > p.x && b.x < p.x + PLAYER_WIDTH && b.y > p.y && b.y < p.y + PLAYER_HEIGHT) {
          b.y = CANVAS_H + 100;
          setLives(l => l - 1);
        }
      });
      enemyBulletsRef.current = enemyBulletsRef.current.filter(b => b.y < CANVAS_H);

      // Wave progression
      if (invadersRef.current.every(i => !i.alive)) {
        setWave(w => w + 1);
        startWave();
      }

      // Game over
      if (lives <= 0 && !gameOver) {
        setGameOver(true);
        submitScore();
      }

      // Rendering
      ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);

      // Player ship (green)
      ctx.fillStyle = '#00ff00';
      ctx.fillRect(p.x, p.y, PLAYER_WIDTH, PLAYER_HEIGHT);

      // Invaders – draw with column‑based color for 8‑bit effect
      invadersRef.current.forEach(inv => {
        if (!inv.alive) return;
        const color = INVADER_COLORS[inv.col % INVADER_COLORS.length];
        ctx.fillStyle = color;
        ctx.fillRect(inv.x, inv.y, INVADER_WIDTH, INVADER_HEIGHT);
      });

      // Player bullets (yellow)
      ctx.fillStyle = '#ffff00';
      bulletsRef.current.forEach(b => ctx.fillRect(b.x - 2, b.y - 10, 4, 10));

      // Enemy bullets (white)
      ctx.fillStyle = '#ffffff';
      enemyBulletsRef.current.forEach(b => ctx.fillRect(b.x - 2, b.y, 4, 10));

      // HUD
      ctx.fillStyle = '#ffffff';
      ctx.font = '14px monospace';
      ctx.fillText(`Score: ${score}`, 10, 20);
      ctx.fillText(`Wave: ${wave}`, 10, 38);
      ctx.fillText(`Lives: ${lives}`, 10, 56);

      if (gameOver) {
        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
        ctx.fillStyle = '#ff4444';
        ctx.font = '48px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('GAME OVER', CANVAS_W / 2, CANVAS_H / 2);
        ctx.font = '24px monospace';
        ctx.fillText('Refresh to play again', CANVAS_W / 2, CANVAS_H / 2 + 40);
      }

      animationId = requestAnimationFrame(loop);
    };
    animationId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animationId);
  }, [lives, gameOver, score, wave]);

  return (
    <div className="relative mx-auto" style={{ width: '100%', maxWidth: `${CANVAS_W}px` }}>
      <canvas
        ref={canvasRef}
        width={CANVAS_W}
        height={CANVAS_H}
        style={{ width: '100%', height: 'auto', display: 'block', background: '#000' }}
      />
      {/* Mobile touch controls */}
      <div className="absolute inset-x-0 bottom-4 flex justify-center gap-4" style={{ pointerEvents: 'auto' }}>
        <button
          onTouchStart={() => touchMove('left')}
          className="px-4 py-2 bg-gray-800 text-white rounded opacity-80"
        >LEFT</button>
        <button
          onTouchStart={touchFire}
          className="px-4 py-2 bg-red-600 text-white rounded opacity-80"
        >FIRE</button>
        <button
          onTouchStart={() => touchMove('right')}
          className="px-4 py-2 bg-gray-800 text-white rounded opacity-80"
        >RIGHT</button>
      </div>
    </div>
  );
}

// Named export for dynamic import compatibility
export { InvadersGame };
