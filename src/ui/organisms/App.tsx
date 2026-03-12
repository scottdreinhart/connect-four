import { useCallback, useEffect, useRef, useState } from 'react'

import { vibrate } from '@/app/haptics'
import { applyMove, createInitialState, getCell, isColumnPlayable } from '@/domain/board'
import { COLS, CPU_DELAY_MS, ROWS } from '@/domain/constants'
import { checkGameResult } from '@/domain/rules'
import type { Column, Difficulty, GameMode, GameState, Player } from '@/domain/types'

/** Map player number to display label */
const PLAYER_LABEL: Record<Player, string> = { 1: 'Red', 2: 'Yellow' }

/** Map difficulty to display label */
const DIFFICULTY_LABEL: Record<Difficulty, string> = {
  easy: 'Easy',
  medium: 'Medium',
  hard: 'Hard',
}

export default function App() {
  const [game, setGame] = useState<GameState>(() => createInitialState('pvc', 'medium'))
  const [hoveredCol, setHoveredCol] = useState<number | null>(null)
  const [isThinking, setIsThinking] = useState(false)
  const [animatingCell, setAnimatingCell] = useState<{ col: number; row: number } | null>(null)
  const thinkingRef = useRef(false)
  const workerRef = useRef<Worker | null>(null)

  // ── Web Worker lifecycle ─────────────────────────────
  useEffect(() => {
    const worker = new Worker(new URL('../../workers/ai.worker.ts', import.meta.url), {
      type: 'module',
    })
    workerRef.current = worker
    return () => {
      worker.terminate()
      workerRef.current = null
    }
  }, [])

  const isGameOver = game.result.status !== 'playing'
  const isCpuTurn = game.mode === 'pvc' && game.currentPlayer === 2 && !isGameOver

  // ── Handle human move ────────────────────────────────
  const handleColumnClick = useCallback(
    (col: number) => {
      if (isGameOver || isThinking || isCpuTurn) {
        return
      }
      if (!isColumnPlayable(game.board, col)) {
        return
      }

      const next = applyMove(game, col as Column, checkGameResult)
      if (!next) {
        return
      }

      vibrate(15)

      // Find the row where the disc landed
      for (let row = 0; row < ROWS; row++) {
        if (getCell(next.board, col, row) !== getCell(game.board, col, row)) {
          setAnimatingCell({ col, row })
          setTimeout(() => setAnimatingCell(null), 350)
          break
        }
      }

      setGame(next)
    },
    [game, isGameOver, isThinking, isCpuTurn],
  )

  // ── CPU move (via Web Worker) ────────────────────────
  useEffect(() => {
    if (!isCpuTurn || thinkingRef.current) {
      return
    }
    const worker = workerRef.current
    if (!worker) {
      return
    }

    thinkingRef.current = true
    setIsThinking(true)

    // Add a small delay before starting computation for UX
    const timer = setTimeout(() => {
      const handler = (e: MessageEvent<{ move: number }>) => {
        const col = e.data.move
        if (col === -1) {
          setIsThinking(false)
          thinkingRef.current = false
          return
        }
        const next = applyMove(game, col as Column, checkGameResult)
        if (next) {
          for (let row = 0; row < ROWS; row++) {
            if (getCell(next.board, col, row) !== getCell(game.board, col, row)) {
              setAnimatingCell({ col, row })
              setTimeout(() => setAnimatingCell(null), 350)
              break
            }
          }
          setGame(next)
        }
        setIsThinking(false)
        thinkingRef.current = false
      }

      worker.addEventListener('message', handler, { once: true })
      worker.postMessage({
        board: game.board,
        player: 2,
        difficulty: game.difficulty,
      })
    }, CPU_DELAY_MS)

    return () => {
      clearTimeout(timer)
      thinkingRef.current = false
    }
  }, [isCpuTurn, game])

  // ── New Game ─────────────────────────────────────────
  const handleNewGame = useCallback(() => {
    setGame(createInitialState(game.mode, game.difficulty))
    setIsThinking(false)
    thinkingRef.current = false
    setAnimatingCell(null)
  }, [game.mode, game.difficulty])

  // ── Mode / Difficulty changes ────────────────────────
  const handleModeChange = useCallback((mode: GameMode) => {
    setGame(createInitialState(mode, 'medium'))
    setIsThinking(false)
    thinkingRef.current = false
  }, [])

  const handleDifficultyChange = useCallback(
    (diff: Difficulty) => {
      setGame(createInitialState(game.mode, diff))
      setIsThinking(false)
      thinkingRef.current = false
    },
    [game.mode],
  )

  // ── Undo last move ──────────────────────────────────
  const handleUndo = useCallback(() => {
    if (game.moveHistory.length === 0) {
      return
    }
    // In PvC, undo removes the last two moves (player + CPU)
    const stepsBack = game.mode === 'pvc' && game.moveHistory.length >= 2 ? 2 : 1
    let state = createInitialState(game.mode, game.difficulty)
    const moves = game.moveHistory.slice(0, -stepsBack)
    for (const col of moves) {
      const next = applyMove(state, col, checkGameResult)
      if (next) {
        state = next
      }
    }
    setGame(state)
    setIsThinking(false)
    thinkingRef.current = false
  }, [game])

  // ── Status text ──────────────────────────────────────
  const statusText = (() => {
    if (game.result.status === 'win') {
      const winner = PLAYER_LABEL[game.result.winner]
      return `${winner} wins! 🎉`
    }
    if (game.result.status === 'draw') {
      return "It's a draw!"
    }
    if (isThinking) {
      return 'CPU is thinking…'
    }
    const current = PLAYER_LABEL[game.currentPlayer]
    return `${current}'s turn`
  })()

  // ── Win line cells for highlighting ──────────────────
  const winCells = new Set<string>()
  if (game.result.status === 'win') {
    for (const pos of game.result.line) {
      winCells.add(`${pos.col},${pos.row}`)
    }
  }

  // ── Render ───────────────────────────────────────────
  return (
    <div className="app">
      <h1>Connect Four</h1>

      {/* Controls */}
      <div className="controls">
        <div className="control-group">
          <span className="control-label">Mode:</span>
          <button
            className={game.mode === 'pvc' ? 'active' : ''}
            onClick={() => handleModeChange('pvc')}
          >
            vs CPU
          </button>
          <button
            className={game.mode === 'pvp' ? 'active' : ''}
            onClick={() => handleModeChange('pvp')}
          >
            2 Player
          </button>
        </div>

        {game.mode === 'pvc' && (
          <div className="control-group">
            <span className="control-label">Difficulty:</span>
            {(['easy', 'medium', 'hard'] as Difficulty[]).map((d) => (
              <button
                key={d}
                className={game.difficulty === d ? 'active' : ''}
                onClick={() => handleDifficultyChange(d)}
              >
                {DIFFICULTY_LABEL[d]}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Status */}
      <div className={`status ${isGameOver ? 'game-over' : ''}`}>
        <span className={`status-indicator player-${game.currentPlayer}`} />
        {statusText}
      </div>

      {/* Board */}
      <div className="board-container">
        {/* Column hover indicators */}
        <div className="column-indicators">
          {Array.from({ length: COLS }, (_, col) => (
            <div
              key={col}
              className={`column-indicator ${
                hoveredCol === col && !isGameOver && !isThinking && !isCpuTurn
                  ? `visible player-${game.currentPlayer}`
                  : ''
              }`}
            />
          ))}
        </div>

        {/* Grid */}
        <div className="board" onMouseLeave={() => setHoveredCol(null)}>
          {Array.from({ length: COLS }, (_, col) => (
            <div
              key={col}
              className={`column ${isColumnPlayable(game.board, col) && !isGameOver ? 'playable' : ''}`}
              role="button"
              tabIndex={isColumnPlayable(game.board, col) && !isGameOver ? 0 : -1}
              onClick={() => handleColumnClick(col)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  handleColumnClick(col)
                }
              }}
              onMouseEnter={() => setHoveredCol(col)}
            >
              {/* Render rows top-to-bottom (row 5 at top, row 0 at bottom) */}
              {Array.from({ length: ROWS }, (_, rowIdx) => {
                const row = ROWS - 1 - rowIdx
                const cell = getCell(game.board, col, row)
                const isWinCell = winCells.has(`${col},${row}`)
                const isAnimating = animatingCell?.col === col && animatingCell?.row === row

                return (
                  <div
                    key={row}
                    className={`cell ${
                      cell === 1 ? 'player-1' : cell === 2 ? 'player-2' : 'empty'
                    } ${isWinCell ? 'win-cell' : ''} ${isAnimating ? 'drop-anim' : ''}`}
                  >
                    <div className="disc" />
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Action buttons */}
      <div className="actions">
        <button className="btn-primary" onClick={handleNewGame}>
          New Game
        </button>
        <button
          className="btn-secondary"
          onClick={handleUndo}
          disabled={game.moveHistory.length === 0 || isThinking}
        >
          Undo
        </button>
      </div>

      {/* Move counter */}
      <div className="move-counter">Move {game.moveHistory.length}</div>
    </div>
  )
}
