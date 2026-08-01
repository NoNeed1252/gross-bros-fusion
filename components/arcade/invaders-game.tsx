'use client';

/**
 * Full-screen Space Invaders implementation for the Gross Bros Fusion arcade.
 * - Canvas size: 640x480 (virtual, scaled to fit container)
 * - Player ship and invaders drawn using 8‑bit pixel matrix sprites.
 * - On‑screen touch controls for mobile (LEFT, RIGHT, FIRE) with zinc style.
 * - No canvas shadows for performance.
 */

import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase';

// Types for leaderboard submission
interface LeaderboardEntry {
  wallet_address: string;
  score: number;
  wave: number;
}

// Player constants
const PLAYER_WIDTH = 72;
const PLAYER_HEIGHT = 24;
const PLAYER_SPEED = 5;

// Game constants
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
const ENEMY_FIRE_INTERVAL = 1500; // ms

// 8‑bit sprite definitions (1 = pixel on, 0 = off). Scale factor will be applied when drawing.
const alienSprite: number[][] = [
  [0,0,1,1,1,1,0,0],
  [0,1,1,1,1,1,1,0],
  [1,1,1,1,1,1,1,1],
  [1,0,1,1,1,1,0,1],
  [1,0,0,1,1,0,0,1],
  [0,1,0,0,0,0,1,0],
  [0,0,1,0,0,1,0,0],
  [0,0,0,1,1,0,0,0],
];

const playerSprite: number[][] = [
  [0,1,1,1,1,1,1,0],
  [1,1,1,1,1,1,1,1],
  [0,1,1,1,1,1,1,0],
  [0,0,1,1,1,1,0,0],
  [0,0,0,1,1,0,0,0],
];

/** Helper to draw a pixel matrix sprite */
function drawSprite(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  sprite: number[][],
  color: string,
  scale: number,
) {
  ctx.fillStyle = color;
  for (let py = 0; py < sprite.length; py++) {
    for (let px = 0; px < sprite[py].length; px++) {
      if (sprite[py][px]) {
        ctx.fillRect(x + px * scale, y + py * scale, scale, scale);
      }
    }
  }
}

export default function InvadersGame({ bro }: { bro?: any }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [wave, setWave] = useState(1);
  const [lives, setLives] = useState(3);
  const [gameOver, setGameOver] = useState(false);

  // Mutable refs – no React re‑renders each frame
  const playerRef = useRef({ x: CANVAS_W / 2 - PLAYER_WIDTH / 2, y: CANVAS_H - PLAYER_HEIGHT - 10 });
  const bulletsRef = useRef<Array<{ x: number; y: number }>>([]);
  const enemyBulletsRef = useRef<Array<{ x: number; y: number }>>([]);
  const invadersRef = useRef<Array<{ x: number; y: number; alive: boolean }>>([]);
  const lastEnemyFireRef = useRef(0);

  const keys = useRef<{ [k: string]: boolean }>({});

  // Initialise invader grid
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

  // Keyboard handling
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

  // Touch button handlers – shared with keyboard logic
  const moveLeft = () => {
    const p = playerRef.current;
    p.x = Math.max(0, p.x - PLAYER_SPEED);
  };
  const moveRight = () => {
    const p = playerRef.current;
    p.x = Math.min(CANVAS_W - PLAYER_WIDTH, p.x + PLAYER_SPEED);
  };
  const fire = () => {
    const p = playerRef.current;
    bulletsRef.current.push({ x: p.x + PLAYER_WIDTH / 2, y: p.y });
  };

  // Main loop
  useEffect(() => {
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    startWave();
    let animationId: number;
    const loop = (time: number) => {
      const p = playerRef.current;
      // Keyboard movement
      if (keys.current['ArrowLeft'] || keys.current['a'] || keys.current['A']) moveLeft();
      if (keys.current['ArrowRight'] || keys.current['d'] || keys.current['D']) moveRight();

      // Update bullets
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

      // Update enemy bullets
      enemyBulletsRef.current.forEach(b => (b.y += ENEMY_BULLET_SPEED));
      enemyBulletsRef.current = enemyBulletsRef.current.filter(b => b.y < CANVAS_H);

      // Collisions player bullet -> invader
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

      // Collisions enemy bullet -> player
      enemyBulletsRef.current.forEach(b => {
        if (
          b.x > p.x &&
          b.x < p.x + PLAYER_WIDTH &&
          b.y > p.y &&
          b.y < p.y + PLAYER_HEIGHT
        ) {
          b.y = CANVAS_H + 100;
          setLives(l => l - 1);
        }
      });
      enemyBulletsRef.current = enemyBulletsRef.current.filter(b => b.y < CANVAS_H);

      // Wave cleared
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

      // Draw player using sprite (scale to fit width)
      const playerScale = Math.floor(PLAYER_WIDTH / playerSprite[0].length);
      drawSprite(ctx, p.x, p.y, playerSprite, '#00ff00', playerScale);

      // Draw invaders using sprite (scale to fit width)
      const invaderScale = Math.floor(INVADER_WIDTH / alienSprite[0].length);
      invadersRef.current.forEach(inv => {
        if (inv.alive) {
          drawSprite(ctx, inv.x, inv.y, alienSprite, '#ff0000', invaderScale);
        }
      });

      // Draw bullets
      ctx.fillStyle = '#ffff00';
      bulletsRef.current.forEach(b => {
        ctx.fillRect(b.x - 2, b.y - 10, 4, 10);
      });

      // Draw enemy bullets
      ctx.fillStyle = '#ffffff';
      enemyBulletsRef.current.forEach(b => {
        ctx.fillRect(b.x - 2, b.y, 4, 10);
      });

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
      <div className="absolute inset-0 flex justify-between items-end p-4 pointer-events-none">
        <button
          className="bg-zinc-800 border border-zinc-700 text-white px-4 py-2 rounded pointer-events-auto active:bg-zinc-700"
          onTouchStart={e => { e.preventDefault(); moveLeft(); }}
        >LEFT</button>
        <button
          className="bg-zinc-800 border border-zinc-700 text-white px-4 py-2 rounded pointer-events-auto active:bg-zinc-700"
          onTouchStart={e => { e.preventDefault(); fire(); }}
        >FIRE</button>
        <button
          className="bg-zinc-800 border border-zinc-700 text-white px-4 py-2 rounded pointer-events-auto active:bg-zinc-700"
          onTouchStart={e => { e.preventDefault(); moveRight(); }}
        >RIGHT</button>
      </div>
    </div>
  );
}

export { InvadersGame };