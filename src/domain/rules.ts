/**
 * Game rules — win/loss/draw detection.
 * Pure functions operating on domain types only.
 */

import { getCell } from './board'
import { COLS, ROWS, WIN_LENGTH } from './constants'
import type { Board, GameResult, Player, Position, WinLine } from './types'

/** Direction vectors for checking four-in-a-row: right, up, up-right, up-left */
const DIRECTIONS: readonly [number, number][] = [
  [1, 0], // horizontal →
  [0, 1], // vertical ↑
  [1, 1], // diagonal ↗
  [1, -1], // diagonal ↘
]

/**
 * Check if placing a disc at (col, row) by `player` creates a win.
 * Only checks lines passing through the given cell for efficiency.
 */
export function checkWinAt(board: Board, col: number, row: number, player: Player): WinLine | null {
  for (const [dc, dr] of DIRECTIONS) {
    const positions: Position[] = [{ col, row }]

    // Count in the positive direction
    for (let i = 1; i < WIN_LENGTH; i++) {
      const c = col + dc * i
      const r = row + dr * i
      if (c < 0 || c >= COLS || r < 0 || r >= ROWS) {
        break
      }
      if (getCell(board, c, r) !== player) {
        break
      }
      positions.push({ col: c, row: r })
    }

    // Count in the negative direction
    for (let i = 1; i < WIN_LENGTH; i++) {
      const c = col - dc * i
      const r = row - dr * i
      if (c < 0 || c >= COLS || r < 0 || r >= ROWS) {
        break
      }
      if (getCell(board, c, r) !== player) {
        break
      }
      positions.push({ col: c, row: r })
    }

    if (positions.length >= WIN_LENGTH) {
      // Sort positions so the line is ordered
      positions.sort((a, b) => a.col - b.col || a.row - b.row)
      return [positions[0], positions[1], positions[2], positions[3]] as WinLine
    }
  }
  return null
}

/** Check if the board is completely full. */
export function isBoardFull(board: Board): boolean {
  return board.every((cell) => cell !== 0)
}

/** Count how many cells are occupied. */
export function countMoves(board: Board): number {
  return board.filter((c) => c !== 0).length
}

/**
 * Determine the game result after the latest move at (col, row) by `player`.
 */
export function checkGameResult(
  board: Board,
  col: number,
  row: number,
  player: Player,
): GameResult {
  const winLine = checkWinAt(board, col, row, player)
  if (winLine) {
    return { status: 'win', winner: player, line: winLine }
  }
  if (isBoardFull(board)) {
    return { status: 'draw' }
  }
  return { status: 'playing' }
}

/**
 * Full board scan for a win by any player. Used when we don't know the last move.
 */
export function scanForWin(board: Board): GameResult {
  for (let col = 0; col < COLS; col++) {
    for (let row = 0; row < ROWS; row++) {
      const cell = getCell(board, col, row)
      if (cell === 0) {
        continue
      }
      const winLine = checkWinAt(board, col, row, cell)
      if (winLine) {
        return { status: 'win', winner: cell, line: winLine }
      }
    }
  }
  if (isBoardFull(board)) {
    return { status: 'draw' }
  }
  return { status: 'playing' }
}
