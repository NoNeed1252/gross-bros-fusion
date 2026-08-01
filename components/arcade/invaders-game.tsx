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

const GAME_W = 640
... (rest of original file unchanged) ...
export default InvadersGame;

function clamp(v: number, min: number, max: number) { return Math.max(min, Math.min(max, v)) }