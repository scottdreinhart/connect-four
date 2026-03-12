// =======================================================================
// AI Engine for Connect Four — WebAssembly (AssemblyScript)
//
// Bitboard representation for maximum performance:
// - Two u64 bitboards (one per player)
// - Column-major layout: 7 columns × 7 bits (6 rows + 1 sentinel)
// - Total: 49 bits per bitboard
// - Win detection via 4 shift-AND operations (~10x faster than array scan)
//
// Board bit layout (column-major, row 0 = bottom):
//   Col 0: bits  0– 5 (data) + bit  6 (sentinel)
//   Col 1: bits  7–12 (data) + bit 13 (sentinel)
//   Col 2: bits 14–19 (data) + bit 20 (sentinel)
//   Col 3: bits 21–26 (data) + bit 27 (sentinel)
//   Col 4: bits 28–33 (data) + bit 34 (sentinel)
//   Col 5: bits 35–40 (data) + bit 41 (sentinel)
//   Col 6: bits 42–47 (data) + bit 48 (sentinel)
//
// Compile: pnpm wasm:build
// =======================================================================

// ── Constants ─────────────────────────────────────────────────────────────

const COLS: i32 = 7
const ROWS: i32 = 6
const TOTAL_CELLS: i32 = 42
const HEIGHT: i32 = 7 // ROWS + 1 sentinel bit per column

// Scoring
const SCORE_WIN: i32 = 1_000_000
const SCORE_THREE: i32 = 50
const SCORE_TWO: i32 = 10
const SCORE_CENTER: i32 = 3

// AI search depth per difficulty: 0=easy, 1=medium, 2=hard
const DEPTH_EASY: i32 = 2
const DEPTH_MEDIUM: i32 = 8
const DEPTH_HARD: i32 = 14

// ── Input board buffer ────────────────────────────────────────────────────

// Flat column-major board written by JS via typed array view
const board = new StaticArray<i32>(TOTAL_CELLS)

/** Return pointer to the board buffer for direct JS memory access */
export function getBoardPtr(): usize {
  return changetype<usize>(board)
}

// ── PRNG for easy mode ────────────────────────────────────────────────────

let rngState: u64 = 123456789

/** Seed the PRNG (called from JS with Date.now or similar) */
export function seed(s: u64): void {
  rngState = s | 1 // ensure nonzero
}

/** xorshift64 — returns a pseudo-random u64 */
function xorshift64(): u64 {
  let x = rngState
  x ^= x << 13
  x ^= x >> 7
  x ^= x << 17
  rngState = x
  return x
}

/** Random i32 in [0, max) */
function randomInt(max: i32): i32 {
  return <i32>(xorshift64() % <u64>max)
}

// ── Bitboard helpers ──────────────────────────────────────────────────────

/** Bottom bit of a column (bit at row 0) */
// @ts-ignore: decorator
@inline
function bottomBit(col: i32): u64 {
  return <u64>1 << <u64>(col * HEIGHT)
}

/** Top sentinel bit of a column (one above the highest valid row) */
// @ts-ignore: decorator
@inline
function topBit(col: i32): u64 {
  return <u64>1 << <u64>(col * HEIGHT + ROWS)
}

/** Mask of all valid cell positions in a column (rows 0–5) */
// @ts-ignore: decorator
@inline
function columnMask(col: i32): u64 {
  return ((<u64>1 << <u64>ROWS) - 1) << <u64>(col * HEIGHT)
}

/**
 * Check if a bitboard contains four-in-a-row.
 * Uses 4 directional shift-AND tests.
 */
// @ts-ignore: decorator
@inline
function hasWon(bb: u64): bool {
  // Vertical: shift by 1
  let t = bb & (bb >> 1)
  if ((t & (t >> 2)) != 0) return true

  // Horizontal: shift by HEIGHT (7)
  t = bb & (bb >> <u64>HEIGHT)
  if ((t & (t >> <u64>(HEIGHT * 2))) != 0) return true

  // Diagonal / (up-right): shift by HEIGHT+1 (8)
  t = bb & (bb >> <u64>(HEIGHT + 1))
  if ((t & (t >> <u64>((HEIGHT + 1) * 2))) != 0) return true

  // Diagonal \ (down-right): shift by HEIGHT-1 (6)
  t = bb & (bb >> <u64>(HEIGHT - 1))
  if ((t & (t >> <u64>((HEIGHT - 1) * 2))) != 0) return true

  return false
}

/** Check if column is playable (sentinel bit not set in mask) */
// @ts-ignore: decorator
@inline
function canPlay(mask: u64, col: i32): bool {
  return (mask & topBit(col)) == 0
}

/**
 * Get the landing bit for a disc dropped into a column.
 * The disc lands at the lowest empty position.
 */
// @ts-ignore: decorator
@inline
function landingBit(mask: u64, col: i32): u64 {
  return (mask + bottomBit(col)) & columnMask(col)
}

/** Count total moves on board */
// @ts-ignore: decorator
@inline
function moveCount(mask: u64): i32 {
  return <i32>popcnt(mask)
}

// ── Board conversion ──────────────────────────────────────────────────────

// Global for second player's bitboard (set during loadBitboards)
let gBb2: u64 = 0

/** Convert the flat input board to bitboards. Returns player 1's bitboard. */
function loadBitboards(): u64 {
  let b1: u64 = 0
  let b2: u64 = 0
  for (let col: i32 = 0; col < COLS; col++) {
    for (let row: i32 = 0; row < ROWS; row++) {
      const cell = unchecked(board[col * ROWS + row])
      if (cell != 0) {
        const bit: u64 = <u64>1 << <u64>(col * HEIGHT + row)
        if (cell == 1) b1 |= bit
        else b2 |= bit
      }
    }
  }
  gBb2 = b2
  return b1
}

// ── Evaluation ────────────────────────────────────────────────────────────

/** Score a window of 4 cells given player/opponent piece counts */
// @ts-ignore: decorator
@inline
function scoreWindow(pCount: i32, oCount: i32): i32 {
  const empty = 4 - pCount - oCount
  if (pCount == 4) return SCORE_WIN
  if (oCount == 4) return -SCORE_WIN
  if (pCount == 3 && empty == 1) return SCORE_THREE
  if (oCount == 3 && empty == 1) return -SCORE_THREE
  if (pCount == 2 && empty == 2) return SCORE_TWO
  if (oCount == 2 && empty == 2) return -SCORE_TWO
  return 0
}

/** Check if a bit is set in a bitboard (returns 0 or 1) */
// @ts-ignore: decorator
@inline
function hasBit(bb: u64, bit: u64): i32 {
  return <i32>((bb & bit) != 0)
}

/**
 * Heuristic board evaluation from the perspective of `playerBb`.
 * Scans all possible 4-cell windows in all 4 directions.
 */
function evaluateBoard(playerBb: u64, opponentBb: u64): i32 {
  let score: i32 = 0

  // Center column preference
  for (let row: i32 = 0; row < ROWS; row++) {
    const bit: u64 = <u64>1 << <u64>(3 * HEIGHT + row)
    if ((playerBb & bit) != 0) score += SCORE_CENTER
    if ((opponentBb & bit) != 0) score -= SCORE_CENTER
  }

  // Horizontal windows
  for (let row: i32 = 0; row < ROWS; row++) {
    for (let col: i32 = 0; col <= COLS - 4; col++) {
      let pC: i32 = 0
      let oC: i32 = 0
      for (let i: i32 = 0; i < 4; i++) {
        const bit: u64 = <u64>1 << <u64>((col + i) * HEIGHT + row)
        pC += hasBit(playerBb, bit)
        oC += hasBit(opponentBb, bit)
      }
      score += scoreWindow(pC, oC)
    }
  }

  // Vertical windows
  for (let col: i32 = 0; col < COLS; col++) {
    for (let row: i32 = 0; row <= ROWS - 4; row++) {
      let pC: i32 = 0
      let oC: i32 = 0
      for (let i: i32 = 0; i < 4; i++) {
        const bit: u64 = <u64>1 << <u64>(col * HEIGHT + row + i)
        pC += hasBit(playerBb, bit)
        oC += hasBit(opponentBb, bit)
      }
      score += scoreWindow(pC, oC)
    }
  }

  // Diagonal ↗ windows
  for (let col: i32 = 0; col <= COLS - 4; col++) {
    for (let row: i32 = 0; row <= ROWS - 4; row++) {
      let pC: i32 = 0
      let oC: i32 = 0
      for (let i: i32 = 0; i < 4; i++) {
        const bit: u64 = <u64>1 << <u64>((col + i) * HEIGHT + row + i)
        pC += hasBit(playerBb, bit)
        oC += hasBit(opponentBb, bit)
      }
      score += scoreWindow(pC, oC)
    }
  }

  // Diagonal ↘ windows
  for (let col: i32 = 0; col <= COLS - 4; col++) {
    for (let row: i32 = 3; row < ROWS; row++) {
      let pC: i32 = 0
      let oC: i32 = 0
      for (let i: i32 = 0; i < 4; i++) {
        const bit: u64 = <u64>1 << <u64>((col + i) * HEIGHT + row - i)
        pC += hasBit(playerBb, bit)
        oC += hasBit(opponentBb, bit)
      }
      score += scoreWindow(pC, oC)
    }
  }

  return score
}

// ── Column ordering ───────────────────────────────────────────────────────

/** Get column by center-first order index */
function getOrderedCol(i: i32): i32 {
  // Center-first: 3, 2, 4, 1, 5, 0, 6
  switch (i) {
    case 0: return 3
    case 1: return 2
    case 2: return 4
    case 3: return 1
    case 4: return 5
    case 5: return 0
    case 6: return 6
    default: return 0
  }
}

// ── Minimax with Alpha-Beta Pruning ───────────────────────────────────────

/**
 * Minimax with alpha-beta pruning.
 *
 * `playerBb` = bitboard of the player about to move.
 * `opponentBb` = bitboard of the other player.
 * The "maximizing" flag tracks whether this level maximizes or minimizes.
 */
function minimax(
  playerBb: u64,
  opponentBb: u64,
  depth: i32,
  alpha: i32,
  beta: i32,
  maximizing: bool,
): i32 {
  const mask = playerBb | opponentBb
  const moves = moveCount(mask)

  // The previous move was made by the opponent of the current player.
  // Check if that previous move won the game.
  if (hasWon(opponentBb)) {
    const winVal = SCORE_WIN * (TOTAL_CELLS + 1 - moves)
    return maximizing ? -winVal : winVal
  }

  // Draw
  if (moves >= TOTAL_CELLS) return 0

  // Depth limit — heuristic evaluation
  if (depth <= 0) {
    return maximizing
      ? evaluateBoard(playerBb, opponentBb)
      : evaluateBoard(opponentBb, playerBb)
  }

  if (maximizing) {
    let maxEval: i32 = -2_000_000_000
    for (let i: i32 = 0; i < COLS; i++) {
      const col = getOrderedCol(i)
      if (!canPlay(mask, col)) continue

      const moveBit = landingBit(mask, col)
      const newPlayerBb = playerBb | moveBit

      // Immediate win check
      if (hasWon(newPlayerBb)) {
        return SCORE_WIN * (TOTAL_CELLS - moves)
      }

      const evalScore = minimax(
        opponentBb, newPlayerBb,
        depth - 1, alpha, beta, false,
      )
      if (evalScore > maxEval) maxEval = evalScore
      if (evalScore > alpha) alpha = evalScore
      if (beta <= alpha) break
    }
    return maxEval
  } else {
    let minEval: i32 = 2_000_000_000
    for (let i: i32 = 0; i < COLS; i++) {
      const col = getOrderedCol(i)
      if (!canPlay(mask, col)) continue

      const moveBit = landingBit(mask, col)
      const newPlayerBb = playerBb | moveBit

      // Immediate win (bad for maximizer)
      if (hasWon(newPlayerBb)) {
        return -(SCORE_WIN * (TOTAL_CELLS - moves))
      }

      const evalScore = minimax(
        opponentBb, newPlayerBb,
        depth - 1, alpha, beta, true,
      )
      if (evalScore < minEval) minEval = evalScore
      if (evalScore < beta) beta = evalScore
      if (beta <= alpha) break
    }
    return minEval
  }
}

// ── Public API ────────────────────────────────────────────────────────────

/**
 * Select the best move for the given player at the given difficulty.
 *
 * @param player - 1 or 2
 * @param difficulty - 0=easy, 1=medium, 2=hard
 * @returns column index (0–6), or -1 if no valid move
 *
 * Call sequence from JS:
 *   1. Write board cells into getBoardPtr() typed array view
 *   2. Optionally call seed() with a timestamp for easy-mode randomness
 *   3. Call selectMove(player, difficulty) → column
 */
export function selectMove(player: i32, difficulty: i32): i32 {
  // Load board into bitboards
  const bb1 = loadBitboards()
  const bb2 = gBb2
  const playerBb = player == 1 ? bb1 : bb2
  const opponentBb = player == 1 ? bb2 : bb1
  const mask = bb1 | bb2

  // Find playable columns (center-first order)
  let playableCount: i32 = 0
  const playable = new StaticArray<i32>(COLS)
  for (let i: i32 = 0; i < COLS; i++) {
    const col = getOrderedCol(i)
    if (canPlay(mask, col)) {
      unchecked(playable[playableCount] = col)
      playableCount++
    }
  }
  if (playableCount == 0) return -1

  // Check for immediate winning move (all difficulties)
  for (let i: i32 = 0; i < playableCount; i++) {
    const col = unchecked(playable[i])
    const moveBit = landingBit(mask, col)
    if (hasWon(playerBb | moveBit)) return col
  }

  // Check for immediate opponent threat (all difficulties)
  for (let i: i32 = 0; i < playableCount; i++) {
    const col = unchecked(playable[i])
    const moveBit = landingBit(mask, col)
    if (hasWon(opponentBb | moveBit)) return col
  }

  // Easy mode: shallow search + 30% random moves
  if (difficulty == 0) {
    if (playableCount > 1 && randomInt(100) < 30) {
      return unchecked(playable[randomInt(playableCount)])
    }
    let bestScore: i32 = -2_000_000_000
    let bestCol: i32 = unchecked(playable[0])
    for (let i: i32 = 0; i < playableCount; i++) {
      const col = unchecked(playable[i])
      const moveBit = landingBit(mask, col)
      const newPlayerBb = playerBb | moveBit
      const score = minimax(
        opponentBb, newPlayerBb,
        DEPTH_EASY - 1, -2_000_000_000, 2_000_000_000, false,
      )
      if (score > bestScore) {
        bestScore = score
        bestCol = col
      }
    }
    return bestCol
  }

  // Medium and Hard: full minimax search
  const depth = difficulty == 2 ? DEPTH_HARD : DEPTH_MEDIUM

  let bestScore: i32 = -2_000_000_000
  let bestCol: i32 = unchecked(playable[0])
  for (let i: i32 = 0; i < playableCount; i++) {
    const col = unchecked(playable[i])
    const moveBit = landingBit(mask, col)
    const newPlayerBb = playerBb | moveBit
    const score = minimax(
      opponentBb, newPlayerBb,
      depth - 1, -2_000_000_000, 2_000_000_000, false,
    )
    if (score > bestScore) {
      bestScore = score
      bestCol = col
    }
  }
  return bestCol
}
