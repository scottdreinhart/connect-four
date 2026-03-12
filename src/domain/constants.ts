/**
 * Game constants — magic numbers & config extracted to a single source of truth.
 */

import type { GameStats } from './types'

/** Number of columns on the board */

export const COLS = 7

/** Number of rows on the board */

export const ROWS = 6

/** Total cells on the board */

export const TOTAL_CELLS = COLS * ROWS

/** Number of consecutive pieces needed to win */

export const WIN_LENGTH = 4

/** Artificial delay before CPU plays (ms) */

export const CPU_DELAY_MS = 400

/** AI search depth per difficulty */

export const AI_DEPTH: Record<string, number> = {
  easy: 1,
  medium: 4,
  hard: 8,
}

export const DEFAULT_STATS: GameStats = {
  wins: 0,
  losses: 0,
  streak: 0,
  bestStreak: 0,
}
