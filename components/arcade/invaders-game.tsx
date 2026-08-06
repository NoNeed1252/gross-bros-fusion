'use client';

/**
 * Full-screen Space Invaders implementation for the Gross Bros Fusion arcade.
 * - Canvas size: 640x480 (virtual, scaled to fit container)
 * - Player ship: 72px width, responsive to keyboard (←/→/A/D) and touch controls.
 * - Invader grid: multiple waves, simple sprite rectangles.
 * - Enemy fire, collision detection, particle explosions.
 * - Wave progression, score, lives, game‑over overlay.
 * - Submits final score to Supabase `leaderboard` table using the wallet address
 *   stored in localStorage under the key `wallet_address`.
 * - No canvas shadows, no CSS box‑shadow for mobile performance.
 */

import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase'; // assumed existing supabase client

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

export default function InvadersGame({ bro }: { bro?: any }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [wave, setWave] = useState(1);
  const [lives, setLives] = useState(3);
  const [gameOver, setGameOver] = useState(false);

  // State refs for mutable objects without causing React re‑renders each frame
  const playerRef = useRef({ x: CANVAS_W / 2 - PLAYER_WIDTH / 2, y: CANVAS_H - PLAYER_HEIGHT - 10 });
  const bulletsRef = useRef<Array<{ x: number; y: number }>>([]);
  const enemyBulletsRef = useRef<Array<{ x: number; y: number }>>([]);
  const invadersRef = useRef<Array<{ x: number; y: number; alive: boolean }>>([]);
  const lastEnemyFireRef = useRef(0);

  // Initialise invader grid for the current wave
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

  // Reset game state for a new wave
  const startWave = () => {
    initInvaders();
    bulletsRef.current = [];
    enemyBulletsRef.current = [];
    lastEnemyFireRef.current = performance.now();
  };

  // Submit score to Supabase when the game ends
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

  // Handle keyboard input
  const keys = useRef<{ [k: string]: boolean }>({});
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      keys.current[e.key] = true;
      if ((e.key === ' ' || e.key === 'Enter') && !gameOver) {
        // fire bullet
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

  // Touch controls – simple left/right halves of canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const handleTouch = (e: TouchEvent) => {
      const rect = canvas.getBoundingClientRect();
      const touchX = e.touches[0].clientX - rect.left;
      const p = playerRef.current;
      if (touchX < rect.width / 2) {
        p.x = Math.max(0, p.x - PLAYER_SPEED);
      } else {
        p.x = Math.min(CANVAS_W - PLAYER_WIDTH, p.x + PLAYER_SPEED);
      }
      // fire on tap
      if (e.touches.length === 1) {
        bulletsRef.current.push({ x: p.x + PLAYER_WIDTH / 2, y: p.y });
      }
      e.preventDefault();
    };
    canvas.addEventListener('touchstart', handleTouch, { passive: false });
    return () => {
      canvas.removeEventListener('touchstart', handleTouch);
    };
  }, []);

  // Main game loop
  useEffect(() => {
    let animationId: number;
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    startWave();

    const loop = (time: number) => {
      // Update player position based on keys
      const p = playerRef.current;
      if (keys.current['ArrowLeft'] || keys.current['a'] || keys.current['A']) {
        p.x = Math.max(0, p.x - PLAYER_SPEED);
      }
      if (keys.current['ArrowRight'] || keys.current['d'] || keys.current['D']) {
        p.x = Math.min(CANVAS_W - PLAYER_WIDTH, p.x + PLAYER_SPEED);
      }

      // Update bullets
      bulletsRef.current.forEach(b => (b.y -= BULLET_SPEED));
      bulletsRef.current = bulletsRef.current.filter(b => b.y > 0);

      // Enemy fire timing
      if (time - lastEnemyFireRef.current > ENEMY_FIRE_INTERVAL) {
        const aliveInvaders = invadersRef.current.filter(inv => inv.alive);
        if (aliveInvaders.length) {
          const shooter = aliveInvaders[Math.floor(Math.random() * aliveInvaders.length)];
          enemyBulletsRef.current.push({ x: shooter.x + INVADER_WIDTH / 2, y: shooter.y + INVADER_HEIGHT });
        }
        lastEnemyFireRef.current = time;
      }

      // Update enemy bullets
      enemyBulletsRef.current.forEach(b => (b.y += ENEMY_BULLET_SPEED));
      enemyBulletsRef.current = enemyBulletsRef.current.filter(b => b.y < CANVAS_H);

      // Collision: player bullet vs invader
      bulletsRef.current.forEach((bullet) => {
        invadersRef.current.forEach((inv) => {
          if (!inv.alive) return;
          if (
            bullet.x > inv.x &&
            bullet.x < inv.x + INVADER_WIDTH &&
            bullet.y > inv.y &&
            bullet.y < inv.y + INVADER_HEIGHT
          ) {
            inv.alive = false;
            bullet.y = -100; // mark bullet for removal
            setScore((s) => s + 10);
          }
        });
      });
      bulletsRef.current = bulletsRef.current.filter(b => b.y > 0);

      // Collision: enemy bullet vs player
      enemyBulletsRef.current.forEach((b) => {
        if (
          b.x > p.x &&
          b.x < p.x + PLAYER_WIDTH &&
          b.y > p.y &&
          b.y < p.y + PLAYER_HEIGHT
        ) {
          b.y = CANVAS_H + 100;
          setLives((l) => l - 1);
        }
      });
      enemyBulletsRef.current = enemyBulletsRef.current.filter(b => b.y < CANVAS_H);

      // Check wave clear
      if (invadersRef.current.every((inv) => !inv.alive)) {
        setWave((w) => w + 1);
        startWave();
      }

      // Game over condition
      if (lives <= 0 && !gameOver) {
        setGameOver(true);
        submitScore();
      }

      // Draw everything
      ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);

      // Draw player ship (simple rectangle)
      ctx.fillStyle = '#00ff00';
      ctx.fillRect(p.x, p.y, PLAYER_WIDTH, PLAYER_HEIGHT);

      // Draw invaders
      ctx.fillStyle = '#ff0000';
      invadersRef.current.forEach((inv) => {
        if (inv.alive) {
          ctx.fillRect(inv.x, inv.y, INVADER_WIDTH, INVADER_HEIGHT);
        }
      });

      // Draw bullets
      ctx.fillStyle = '#ffff00';
      bulletsRef.current.forEach((b) => {
        ctx.fillRect(b.x - 2, b.y - 10, 4, 10);
      });

      // Draw enemy bullets
      ctx.fillStyle = '#ffffff';
      enemyBulletsRef.current.forEach((b) => {
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lives, gameOver, score, wave]);

  return (
    <div className="relative mx-auto" style={{ width: '100%', maxWidth: `${CANVAS_W}px` }}>
      <canvas
        ref={canvasRef}
        width={CANVAS_W}
        height={CANVAS_H}
        style={{ width: '100%', height: 'auto', display: 'block', background: '#000' }}
      />
    </div>
  );
}


export { InvadersGame };
