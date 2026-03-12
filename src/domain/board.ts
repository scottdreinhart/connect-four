/**
 * Board operations — pure functions for creating and manipulating game state.
 * No React, no DOM — purely functional transformations.
 */

import { COLS, ROWS, TOTAL_CELLS } from './constants'
import type { Board, Cell, Column, GameResult, GameState, Player } from './types'

/** Create an empty board (all zeros) */
export function createBoard(): Board {
  return new Array<Cell>(TOTAL_CELLS).fill(0)
}

/** Get cell value at (col, row). Row 0 = bottom. */
export function getCell(board: Board, col: number, row: number): Cell {
  return (board[col * ROWS + row] ?? 0) as Cell
}

/** Set cell value at (col, row). Returns a new board. */
export function setCell(board: Board, col: number, row: number, value: Cell): Board {
  const next = [...board] as Board
  next[col * ROWS + row] = value
  return next
}

/** Find the lowest empty row in a column, or -1 if full. */
export function getLowestEmptyRow(board: Board, col: number): number {
  for (let row = 0; row < ROWS; row++) {
    if (getCell(board, col, row) === 0) {
      return row
    }
  }
  return -1
}

/** Check if a column can accept another disc. */
export function isColumnPlayable(board: Board, col: number): boolean {
  return getLowestEmptyRow(board, col) !== -1
}

/** Get all columns that can still accept a disc. */
export function getPlayableColumns(board: Board): number[] {
  const cols: number[] = []
  for (let c = 0; c < COLS; c++) {
    if (isColumnPlayable(board, c)) {
      cols.push(c)
    }
  }
  return cols
}

/** Drop a disc into a column. Returns [newBoard, landingRow] or null if column is full. */
export function dropDisc(board: Board, col: number, player: Player): [Board, number] | null {
  const row = getLowestEmptyRow(board, col)
  if (row === -1) {
    return null
  }
  return [setCell(board, col, row, player), row]
}

/** Switch the current player. */
export function otherPlayer(player: Player): Player {
  return player === 1 ? 2 : 1
}

/** Create the initial game state. */
export function createInitialState(
  mode: GameState['mode'] = 'pvc',
  difficulty: GameState['difficulty'] = 'medium',
): GameState {
  return {
    board: createBoard(),
    currentPlayer: 1,
    result: { status: 'playing' },
    mode,
    difficulty,
    moveHistory: [],
  }
}

/** Apply a move and return the new game state, or null if the move is invalid. */
export function applyMove(
  state: GameState,
  col: Column,
  checkResult: (board: Board, col: number, row: number, player: Player) => GameResult,
): GameState | null {
  if (state.result.status !== 'playing') {
    return null
  }
  const drop = dropDisc(state.board, col, state.currentPlayer)
  if (!drop) {
    return null
  }

  const [newBoard, row] = drop
  const result = checkResult(newBoard, col, row, state.currentPlayer)

  return {
    ...state,
    board: newBoard,
    currentPlayer: otherPlayer(state.currentPlayer),
    result,
    moveHistory: [...state.moveHistory, col],
  }
}
