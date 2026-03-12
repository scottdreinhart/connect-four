/**
 * Central type definitions — pure domain types, no framework dependencies.
 */

/** Player representation: 1 = Red (human), 2 = Yellow (CPU/player 2) */
export type Player = 1 | 2

/** A single cell on the board: empty (0) or occupied by a player */
export type Cell = 0 | Player

/** 7-column × 6-row board represented as a flat array (column-major) */
export type Board = Cell[]

/** Column index (0–6) */
export type Column = 0 | 1 | 2 | 3 | 4 | 5 | 6

/** Row index (0–5), 0 = bottom */
export type Row = 0 | 1 | 2 | 3 | 4 | 5

/** A position on the board */
export interface Position {
  readonly col: number
  readonly row: number
}

/** Four positions forming a winning line */
export type WinLine = readonly [Position, Position, Position, Position]

/** Result of checking the board state */
export type GameResult =
  | { readonly status: 'playing' }
  | { readonly status: 'win'; readonly winner: Player; readonly line: WinLine }
  | { readonly status: 'draw' }

/** Difficulty levels for AI */
export type Difficulty = 'easy' | 'medium' | 'hard'

/** Game mode */
export type GameMode = 'pvp' | 'pvc'

/** Complete game state */
export interface GameState {
  readonly board: Board
  readonly currentPlayer: Player
  readonly result: GameResult
  readonly mode: GameMode
  readonly difficulty: Difficulty
  readonly moveHistory: readonly Column[]
}

/** Shared theme types — identical across all games */

export interface ColorTheme {
  readonly id: string
  readonly label: string
  readonly accent: string
}

export interface ColorblindMode {
  readonly id: string
  readonly label: string
  readonly description?: string
}

export interface ThemeSettings {
  colorTheme: string
  mode: string
  colorblind: string
}

export interface GameStats {
  wins: number
  losses: number
  streak: number
  bestStreak: number
}
