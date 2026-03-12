/**
 * AI Web Worker — off-main-thread computation for CPU moves.
 *
 * Strategy:
 *   1. On startup, attempt to load the WASM AI engine (bitboard-based, ~10x faster)
 *   2. If WASM is available, use it for all move computations
 *   3. If WASM fails (empty base64, compilation error), fall back to JS minimax
 *
 * Keeps UI at 60 FPS during deep AI searches.
 */

import { selectMove as selectMoveJS } from '@/domain/ai'
import type { Board, Difficulty, Player } from '@/domain/types'
import { AI_WASM_BASE64 } from '@/wasm/ai-wasm'

interface AIRequest {
  board: Board
  player: Player
  difficulty: Difficulty
}

// ── WASM interface ────────────────────────────────────────────────────────

interface WasmExports {
  memory: WebAssembly.Memory
  getBoardPtr(): number
  seed(s: bigint): void
  selectMove(player: number, difficulty: number): number
}

let wasmExports: WasmExports | null = null

/** Difficulty string → integer for WASM */
function difficultyToInt(d: Difficulty): number {
  if (d === 'easy') {
    return 0
  }
  if (d === 'medium') {
    return 1
  }
  return 2 // hard
}

/** Attempt to compile and instantiate the WASM AI module */
async function initWasm(): Promise<boolean> {
  if (!AI_WASM_BASE64) {
    return false
  }
  try {
    const binaryStr = atob(AI_WASM_BASE64)
    const bytes = new Uint8Array(binaryStr.length)
    for (let i = 0; i < binaryStr.length; i++) {
      bytes[i] = binaryStr.charCodeAt(i)
    }
    const module = await WebAssembly.compile(bytes)
    const instance = await WebAssembly.instantiate(module, {
      env: {
        abort: () => {
          /* AssemblyScript abort handler — no-op in production */
        },
      },
    })
    wasmExports = instance.exports as unknown as WasmExports
    // Seed the PRNG with current time
    wasmExports.seed(BigInt(Date.now()))
    return true
  } catch {
    return false
  }
}

/** Use WASM to select a move: copies board into WASM memory, calls selectMove */
function selectMoveWasm(board: Board, player: Player, difficulty: Difficulty): number {
  if (!wasmExports) {
    throw new Error('WASM not initialized')
  }
  const exports = wasmExports
  const ptr = exports.getBoardPtr()
  const view = new Int32Array(exports.memory.buffer, ptr, 42)
  for (let i = 0; i < 42; i++) {
    view[i] = board[i] ?? 0
  }
  return exports.selectMove(player, difficultyToInt(difficulty))
}

// ── Initialization ────────────────────────────────────────────────────────

const wasmReady = initWasm()

// ── Message handler ───────────────────────────────────────────────────────

self.onmessage = async (e: MessageEvent<AIRequest>) => {
  await wasmReady
  const { board, player, difficulty } = e.data
  const move = wasmExports
    ? selectMoveWasm(board, player, difficulty)
    : selectMoveJS(board, player, difficulty)
  self.postMessage({ move })
}

export {}
