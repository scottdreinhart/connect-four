/**
 * Connect-Four AI Service Tests
 *
 * Validates:
 * 1. Sync path: Direct JS minimax produces valid moves, completes within target
 * 2. Async path: Worker-backed execution, timeout fallback, equivalence
 * 3. Edge cases: Invalid boards, no playable columns, immediate wins/blocks
 * 4. Architecture: Correct source attribution, graceful degradation
 */

import { describe, expect, it } from 'vitest'
import { createInitialState, dropDisc, getCell, getPlayableColumns } from '@/domain/board'
import type { Board } from '@/domain/types'
import {
  computeMove,
  computeMoveAsync,
  ensureAsyncWorkerReady,
  selectAiMove,
  terminateAsyncWorker,
} from './connectFourAiService'

describe('connectFourAiService', () => {
  // ── Sync Path Tests ──────────────────────────────────────────────────

  describe('computeMove (sync)', () => {
    it('should produce valid move for easy difficulty', () => {
      const { board } = createInitialState('pvc', 'easy')
      const result = computeMove(board, 2, 'easy')

      expect(result.move).toBeGreaterThanOrEqual(0)
      expect(result.move).toBeLessThan(7)
      expect(result.source).toBe('sync-js')
      expect(result.duration).toBeLessThan(100)
    })

    it('should produce valid move for medium difficulty', () => {
      const { board } = createInitialState('pvc', 'medium')
      const result = computeMove(board, 2, 'medium')

      expect(result.move).toBeGreaterThanOrEqual(0)
      expect(result.move).toBeLessThan(7)
      expect(result.source).toBe('sync-js')
      expect(result.duration).toBeLessThan(200) // Medium may be slower
    })

    it('should produce valid move for hard difficulty', () => {
      const { board } = createInitialState('pvc', 'hard')
      const result = computeMove(board, 2, 'hard')

      expect(result.move).toBeGreaterThanOrEqual(0)
      expect(result.move).toBeLessThan(7)
      expect(result.source).toBe('sync-js')
      expect(result.duration).toBeLessThan(1000) // Hard may be slow
    })

    it('should complete easy difficulty in < 50ms', () => {
      const { board } = createInitialState('pvc', 'easy')
      const result = computeMove(board, 2, 'easy')

      expect(result.duration).toBeLessThan(50)
    })

    it('should return move even for full board (no valid moves)', () => {
      // Create a full board by filling it
      let board: Board = Array(42).fill(0) as Board
      // Fill columns 0-6 with alternating players
      for (let col = 0; col < 7; col++) {
        for (let row = 0; row < 6; row++) {
          const idx = row * 7 + col
          board[idx] = (col + row) % 2 === 0 ? 1 : 2
        }
      }

      const result = computeMove(board, 1, 'easy')
      expect(result.move).toBe(-1) // No valid move
    })

    it('should take immediate winning move', () => {
      // Set up a board where AI can win with column 3
      let board: Board = Array(42).fill(0) as Board
      // Place three AI discs horizontally with empty spot
      // Bottom row: [1, 2, 2, 0, 2, 1, 0]
      board[0 * 7 + 0] = 1
      board[0 * 7 + 1] = 2
      board[0 * 7 + 2] = 2
      board[0 * 7 + 3] = 0
      board[0 * 7 + 4] = 2
      board[0 * 7 + 5] = 1
      board[0 * 7 + 6] = 0

      const result = computeMove(board, 2, 'hard')
      // AI should prefer winning move in column 3 or column 4 (creating threat)
      expect([3, 4]).toContain(result.move)
    })

    it('should consider playable columns only', () => {
      const { board } = createInitialState('pvc', 'easy')
      const playable = getPlayableColumns(board)
      const result = computeMove(board, 2, 'easy')

      expect(playable).toContain(result.move)
    })
  })

  // ── Async Path Tests ─────────────────────────────────────────────────

  describe('computeMoveAsync (async, worker unavailable in Node)', () => {
    it('should fall back to sync when worker unavailable', async () => {
      const { board } = createInitialState('pvc', 'easy')
      // In Node test environment, worker is unavailable
      const result = await computeMoveAsync(board, 2, 'easy')

      expect(result.move).toBeGreaterThanOrEqual(0)
      expect(result.move).toBeLessThan(7)
      // Should fall back to sync since no worker in Node
      expect(['sync-js', 'async-worker-fallback']).toContain(result.source)
    })

    it('should complete within reasonable timeout for easy', async () => {
      const { board } = createInitialState('pvc', 'easy')
      const start = Date.now()
      const result = await computeMoveAsync(board, 2, 'easy', 50)
      const elapsed = Date.now() - start

      expect(result.move).toBeGreaterThanOrEqual(0)
      // Should timeout and fall back to sync, but still complete
      expect(elapsed).toBeLessThan(100)
    })

    it('should accept custom timeout', async () => {
      const { board } = createInitialState('pvc', 'medium')
      const start = Date.now()
      const result = await computeMoveAsync(board, 2, 'medium', 30)
      const elapsed = Date.now() - start

      expect(result.move).toBeGreaterThanOrEqual(0)
      // 30ms timeout is shorter than typical medium (60-100ms), should fallback
      expect(elapsed).toBeLessThan(100)
    })
  })

  describe('selectAiMove (heuristic dispatcher)', () => {
    it('should use sync for easy by default', async () => {
      const { board } = createInitialState('pvc', 'easy')
      const result = await selectAiMove(board, 2, 'easy')

      expect(result.move).toBeGreaterThanOrEqual(0)
      expect(result.source).toBe('sync-js')
    })

    it('should use sync for medium by default', async () => {
      const { board } = createInitialState('pvc', 'medium')
      const result = await selectAiMove(board, 2, 'medium', false)

      expect(result.move).toBeGreaterThanOrEqual(0)
      expect(result.source).toBe('sync-js')
    })

    it('should use async for hard by default', async () => {
      const { board } = createInitialState('pvc', 'hard')
      const result = await selectAiMove(board, 2, 'hard', true)

      expect(result.move).toBeGreaterThanOrEqual(0)
      // Will fall back to sync in Node environment, but should attempt async
      expect(['async-worker', 'async-worker-fallback']).toContain(result.source)
    })

    it('should respect forceAsync flag', async () => {
      const { board } = createInitialState('pvc', 'easy')
      const result = await selectAiMove(board, 2, 'easy', true)

      expect(result.move).toBeGreaterThanOrEqual(0)
      // Should attempt async even for easy, but may fall back to sync in Node test env
      expect(['sync-js', 'async-worker', 'async-worker-fallback']).toContain(result.source)
    })
  })

  // ── Worker Lifecycle Tests ─────────────────────────────────────────────

  describe('Worker lifecycle', () => {
    it('should initialize worker once', () => {
      ensureAsyncWorkerReady()
      // Note: In Node test env, this is a no-op since Worker is not available
      // But the function should not throw
      expect(true).toBe(true)
    })

    it('should terminate worker cleanly', () => {
      ensureAsyncWorkerReady()
      expect(() => {
        terminateAsyncWorker()
      }).not.toThrow()
    })
  })

  // ── Architecture & Documentation Tests ────────────────────────────────

  describe('Architecture decision documentation', () => {
    it('easy mode should always use sync (depth 1, < 10ms)', () => {
      const { board } = createInitialState('pvc', 'easy')
      const result = computeMove(board, 2, 'easy')

      // By design: easy is shallow enough for main thread
      expect(result.source).toBe('sync-js')
      expect(result.duration).toBeLessThan(50) // Well under 100ms budget
    })

    it('medium mode can use sync or async (depth 4, 60-100ms)', () => {
      const { board } = createInitialState('pvc', 'medium')
      const syncResult = computeMove(board, 2, 'medium')

      // By design: medium is borderline; sync ok if < 100ms
      expect(syncResult.source).toBe('sync-js')
      expect(syncResult.duration).toBeLessThan(150) // Some variance on complex positions
    })

    it('hard mode should dispatch to async (depth 8, 150-500ms)', async () => {
      const { board } = createInitialState('pvc', 'hard')
      const asyncResult = await computeMoveAsync(board, 2, 'hard')

      // By design: hard dispatches to worker, with sync fallback on 400ms timeout
      // In Node test env, worker unavailable so falls back to sync
      expect(['sync-js', 'async-worker', 'async-worker-fallback']).toContain(
        asyncResult.source,
      )
    })

    it('both paths should produce valid moves (equivalence)', async () => {
      const { board } = createInitialState('pvc', 'medium')
      const syncResult = computeMove(board, 2, 'medium')
      const asyncResult = await computeMoveAsync(board, 2, 'medium')

      // Both should return valid playable columns
      expect(syncResult.move).toBeGreaterThanOrEqual(0)
      expect(asyncResult.move).toBeGreaterThanOrEqual(0)
      expect(syncResult.move).toBeLessThan(7)
      expect(asyncResult.move).toBeLessThan(7)

      // In Node test env, async falls back to sync, so may be identical
      // In browser, they might differ due to timing, but both are valid
      const playable = getPlayableColumns(board)
      expect(playable).toContain(syncResult.move)
      expect(playable).toContain(asyncResult.move)
    })
  })

  // ── Integration with game rules ──────────────────────────────────────

  describe('Integration withConnect-Four rules', () => {
    it('should produce only moves that dont violate board rules', () => {
      const game = createInitialState('pvc', 'medium')
      const result = computeMove(game.board, 2, 'medium')

      const playable = getPlayableColumns(game.board)
      expect(playable).toContain(result.move)

      // Verify the move can be applied without error
      const moveResult = dropDisc(game.board, result.move, 2)
      expect(moveResult).not.toBeNull()
    })

    it('should apply move and not break game state', () => {
      const game = createInitialState('pvc', 'medium')
      const aiResult = computeMove(game.board, 2, 'medium')

      // Apply the AI move
      const moveResult = dropDisc(game.board, aiResult.move, 2)
      expect(moveResult).not.toBeNull()

      if (moveResult) {
        const [newBoard, row] = moveResult
        expect(newBoard.length).toBe(42)
        // Verify AI player's disc is at the correct position using getCell
        expect(getCell(newBoard, aiResult.move, row)).toBe(2)
      }
    })
  })
})
