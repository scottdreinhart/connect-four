/**
 * Connect-Four AI Service
 *
 * Scale-aware orchestration for minimax AI:
 * - Sync path: Direct JS minimax (< 100ms for shallow depths)
 * - Async path: Worker-backed with timeout fallback (up to 500ms)
 *
 * Decision tree:
 *   easy (depth 1): Sync only, always < 10ms
 *   medium (depth 4): Optional async, typically 60-100ms; worker if needed
 *   hard (depth 8): Async required, typically 150-500ms; timeout to sync fallback
 *
 * WASM-first: Worker prefers WASM bitboard (~10x faster), falls back to JS minimax.
 */

import { selectMove as selectMoveJS } from '@/domain/ai'
import type { Board, Difficulty, Player } from '@/domain/types'

export interface AiResult {
  move: number
  difficulty: Difficulty
  duration: number
  source: 'sync-js' | 'async-worker' | 'async-worker-fallback'
}

interface WorkerRequest {
  board: Board
  player: Player
  difficulty: Difficulty
}

// ── Worker lifecycle ────────────────────────────────────────────────────

let asyncWorker: Worker | null = null

/**
 * Initialize the async worker once per session.
 * On error, worker remains null and async paths fall back to sync.
 */
export function ensureAsyncWorkerReady(): void {
  if (asyncWorker) {
    return
  }
  try {
    asyncWorker = new Worker(new URL('../workers/ai.worker.ts', import.meta.url), {
      type: 'module',
    })
  } catch {
    // Worker load failed; async paths will use sync fallback
    asyncWorker = null
  }
}

/**
 * Terminate the async worker.
 * Call on app unmount to clean up resources.
 */
export function terminateAsyncWorker(): void {
  if (asyncWorker) {
    asyncWorker.terminate()
    asyncWorker = null
  }
}

// ── Sync path (main thread) ────────────────────────────────────────────

/**
 * Synchronous AI move computation (main thread).
 *
 * Uses JS minimax directly. Suitable for:
 *   - Easy difficulty (depth 1, always < 10ms)
 *   - Fallback when worker is unavailable
 *   - Testing and development
 *
 * @param board 42-cell flattened board state
 * @param player AI player (1 or 2)
 * @param difficulty 'easy' | 'medium' | 'hard'
 * @returns AiResult with move, timing, and source
 */
export function computeMove(
  board: Board,
  player: Player,
  difficulty: Difficulty,
): AiResult {
  const startTime = performance.now()
  const move = selectMoveJS(board, player, difficulty)
  const duration = performance.now() - startTime

  return {
    move,
    difficulty,
    duration,
    source: 'sync-js',
  }
}

// ── Async path (worker-backed) ────────────────────────────────────────

/**
 * Asynchronous AI move computation (worker-backed with fallback).
 *
 * Strategy:
 *   1. Dispatch to worker (WASM-first, JS fallback)
 *   2. Cap at 80% of expected max duration for that difficulty
 *   3. If timeout, fall back to sync JS on main thread
 *   4. If worker unavailable, use sync directly
 *
 * Suitable for:
 *   - Medium/hard difficulty where deep minimax may block UI
 *   - Ensuring UI responsiveness even during complex AI searches
 *   - Graceful degradation when workers fail
 *
 * Performance targets:
 *   - Easy: 10-20ms (worker overkill; use sync)
 *   - Medium: 80-100ms (worker helpful for concurrent requests)
 *   - Hard: 150-500ms (worker essential, timeout fallback safe)
 *
 * @param board Board state
 * @param player AI player
 * @param difficulty Game difficulty
 * @param timeoutMs Maximum time to wait for worker (defaults per difficulty)
 * @returns Promise<AiResult> with move, timing, and source
 */
export async function computeMoveAsync(
  board: Board,
  player: Player,
  difficulty: Difficulty,
  timeoutMs?: number,
): Promise<AiResult> {
  ensureAsyncWorkerReady()

  // Determine timeout based on difficulty
  const timeout = timeoutMs ?? {
    easy: 50,
    medium: 120,
    hard: 400,
  }[difficulty]

  // If no worker available, fall back to sync
  if (!asyncWorker) {
    return computeMove(board, player, difficulty)
  }

  const startTime = performance.now()

  return new Promise((resolve) => {
    let resolved = false
    let timeoutId: ReturnType<typeof setTimeout> | null = null

    const timeoutHandle = setTimeout(() => {
      timeoutId = null
      if (!resolved) {
        resolved = true
        // Timeout: fall back to sync JS
        const result = computeMove(board, player, difficulty)
        resolve({
          ...result,
          duration: performance.now() - startTime,
          source: 'async-worker-fallback',
        })
      }
    }, timeout)

    const handler = (e: MessageEvent<{ move: number }>) => {
      if (timeoutId !== null) {
        clearTimeout(timeoutHandle)
        timeoutId = null
      }
      if (!resolved) {
        resolved = true
        const move = e.data.move
        resolve({
          move,
          difficulty,
          duration: performance.now() - startTime,
          source: 'async-worker',
        })
      }
    }

    asyncWorker!.addEventListener('message', handler, { once: true })
    asyncWorker!.postMessage({
      board,
      player,
      difficulty,
    } as WorkerRequest)
  })
}

/**
 * Make AI move decision, choosing sync or async based on difficulty.
 *
 * Heuristic:
 *   - easy: Always sync (< 10ms)
 *   - medium: Sync, but async available if needed
 *   - hard: Async default, with sync fallback on timeout
 *
 * @param board Board state
 * @param player AI player
 * @param difficulty Game difficulty
 * @param forceAsync Force async path (for hard mode)
 * @returns Promise<AiResult> (awaitable; sync returns resolved promise)
 */
export async function selectAiMove(
  board: Board,
  player: Player,
  difficulty: Difficulty,
  forceAsync: boolean = difficulty === 'hard',
): Promise<AiResult> {
  if (forceAsync) {
    return computeMoveAsync(board, player, difficulty)
  }
  return Promise.resolve(computeMove(board, player, difficulty))
}
