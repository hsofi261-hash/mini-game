'use client'

import React, { useState, useEffect, useCallback } from 'react'

type Player = 'X' | 'O'
type BoardState = (Player | null)[]

const WINNING_COMBINATIONS = [
  [0, 1, 2], // Top row
  [3, 4, 5], // Middle row
  [6, 7, 8], // Bottom row
  [0, 3, 6], // Left column
  [1, 4, 7], // Middle column
  [2, 5, 8], // Right column
  [0, 4, 8], // Diagonal top-left to bottom-right
  [2, 4, 6]  // Diagonal top-right to bottom-left
]

interface TicTacToeProps {
  mode?: 'computer' | 'online'
}

export default function TicTacToe({ mode = 'computer' }: TicTacToeProps) {
  const [board, setBoard] = useState<BoardState>(Array(9).fill(null))
  const [xIsNext, setXIsNext] = useState<boolean>(true) // Player is X, Computer is O
  const [isThinking, setIsThinking] = useState<boolean>(false)
  const [scores, setScores] = useState({ player: 0, computer: 0, draws: 0 })

  // Calculate winner and winning combination
  const calculateWinner = useCallback((squares: BoardState) => {
    for (const [a, b, c] of WINNING_COMBINATIONS) {
      if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
        return { winner: squares[a] as Player, line: [a, b, c] }
      }
    }
    if (squares.every((square) => square !== null)) {
      return { winner: 'Draw' as const, line: null }
    }
    return null
  }, [])

  const winInfo = calculateWinner(board)
  const winner = winInfo?.winner
  const winningLine = winInfo?.line || []
  const isGameOver = Boolean(winner)

  // Computer decision-making strategy (Win -> Block -> Center -> Corner -> Random)
  const getComputerMove = useCallback((currentBoard: BoardState): number => {
    // 1. Check if Computer (O) can win on this turn
    for (let i = 0; i < 9; i++) {
      if (!currentBoard[i]) {
        const tempBoard = [...currentBoard]
        tempBoard[i] = 'O'
        if (calculateWinner(tempBoard)?.winner === 'O') return i
      }
    }

    // 2. Check if Player (X) is about to win and block them
    for (let i = 0; i < 9; i++) {
      if (!currentBoard[i]) {
        const tempBoard = [...currentBoard]
        tempBoard[i] = 'X'
        if (calculateWinner(tempBoard)?.winner === 'X') return i
      }
    }

    // 3. Take the center square if open
    if (!currentBoard[4]) return 4

    // 4. Take available corners
    const corners = [0, 2, 6, 8].filter((i) => !currentBoard[i])
    if (corners.length > 0) {
      return corners[Math.floor(Math.random() * corners.length)]
    }

    // 5. Take any remaining square
    const openSquares = currentBoard
      .map((val, idx) => (val === null ? idx : null))
      .filter((val): val is number => val !== null)

    return openSquares[Math.floor(Math.random() * openSquares.length)]
  }, [calculateWinner])

  // Automatic Computer Turn execution
  useEffect(() => {
    if (!xIsNext && !isGameOver) {
      setIsThinking(true)

      const timer = setTimeout(() => {
        const moveIndex = getComputerMove(board)
        if (moveIndex !== undefined && moveIndex !== -1) {
          const nextBoard = [...board]
          nextBoard[moveIndex] = 'O'
          setBoard(nextBoard)

          const result = calculateWinner(nextBoard)
          if (result) {
            if (result.winner === 'O') {
              setScores((prev) => ({ ...prev, computer: prev.computer + 1 }))
            } else if (result.winner === 'Draw') {
              setScores((prev) => ({ ...prev, draws: prev.draws + 1 }))
            }
          }
        }
        setXIsNext(true)
        setIsThinking(false)
      }, 500) // 500ms delay to simulate human-like response delay

      return () => clearTimeout(timer)
    }
  }, [xIsNext, isGameOver, board, getComputerMove, calculateWinner])

  // User click action
  const handleSquareClick = (index: number) => {
    if (board[index] || isGameOver || !xIsNext || isThinking) return

    const nextBoard = [...board]
    nextBoard[index] = 'X'
    setBoard(nextBoard)

    const result = calculateWinner(nextBoard)
    if (result) {
      if (result.winner === 'X') {
        setScores((prev) => ({ ...prev, player: prev.player + 1 }))
      } else if (result.winner === 'Draw') {
        setScores((prev) => ({ ...prev, draws: prev.draws + 1 }))
      }
    }
    setXIsNext(false)
  }

  const handleResetMatch = () => {
    setBoard(Array(9).fill(null))
    setXIsNext(true)
    setIsThinking(false)
  }

  const handleResetScores = () => {
    handleResetMatch()
    setScores({ player: 0, computer: 0, draws: 0 })
  }

  return (
    <div className="w-full max-w-lg mx-auto flex flex-col items-center gap-6">
      {/* Mode Indicator Notice */}
      <div className="text-xs px-3.5 py-1 rounded-full bg-slate-800 text-slate-300 border border-slate-700/60 flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        <span>🤖 Player vs Computer Mode</span>
      </div>

      {/* Scoreboard */}
      <div className="grid grid-cols-3 gap-3 w-full text-center">
        <div className={`p-3 rounded-2xl border transition-all ${
          xIsNext && !isGameOver 
            ? 'bg-indigo-950/60 border-indigo-500/50 text-indigo-300 ring-1 ring-indigo-500/30' 
            : 'bg-slate-950/60 border-slate-800 text-slate-400'
        }`}>
          <div className="text-xs uppercase font-semibold">You (X)</div>
          <div className="text-2xl font-extrabold text-indigo-400 mt-0.5">{scores.player}</div>
        </div>

        <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800 text-slate-400">
          <div className="text-xs uppercase font-semibold">Draws</div>
          <div className="text-2xl font-extrabold text-slate-200 mt-0.5">{scores.draws}</div>
        </div>

        <div className={`p-3 rounded-2xl border transition-all ${
          !xIsNext && !isGameOver 
            ? 'bg-rose-950/60 border-rose-500/50 text-rose-300 ring-1 ring-rose-500/30' 
            : 'bg-slate-950/60 border-slate-800 text-slate-400'
        }`}>
          <div className="text-xs uppercase font-semibold">Computer (O)</div>
          <div className="text-2xl font-extrabold text-rose-400 mt-0.5">{scores.computer}</div>
        </div>
      </div>

      {/* Game Status Banner */}
      <div className="h-10 flex items-center justify-center">
        {winner ? (
          <div className="text-lg font-bold flex items-center gap-2 animate-bounce">
            {winner === 'Draw' ? (
              <span className="text-amber-400">🤝 Match Ended in a Draw!</span>
            ) : winner === 'X' ? (
              <span className="text-indigo-400">🎉 You Defeated the Computer!</span>
            ) : (
              <span className="text-rose-400">🤖 Computer Wins the Match!</span>
            )}
          </div>
        ) : (
          <div className="text-sm font-semibold text-slate-300 flex items-center gap-2">
            Turn:
            {xIsNext ? (
              <span className="inline-block px-2.5 py-0.5 rounded-md font-bold text-xs bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                Your Turn (X)
              </span>
            ) : (
              <span className="inline-block px-2.5 py-0.5 rounded-md font-bold text-xs bg-rose-500/20 text-rose-400 border border-rose-500/30 animate-pulse">
                Computer Thinking...
              </span>
            )}
          </div>
        )}
      </div>

      {/* 3x3 Grid */}
      <div className="grid grid-cols-3 gap-3 p-4 bg-slate-950/80 rounded-3xl border border-slate-800 shadow-2xl w-full max-w-[340px] aspect-square">
        {board.map((cell, idx) => {
          const isWinningSquare = winningLine.includes(idx)
          return (
            <button
              key={idx}
              onClick={() => handleSquareClick(idx)}
              disabled={Boolean(cell) || isGameOver || !xIsNext || isThinking}
              className={`rounded-2xl font-extrabold text-4xl sm:text-5xl flex items-center justify-center transition-all transform active:scale-95 ${
                isWinningSquare
                  ? cell === 'X'
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/50 scale-105 border-2 border-indigo-300'
                    : 'bg-rose-600 text-white shadow-lg shadow-rose-500/50 scale-105 border-2 border-rose-300'
                  : cell === 'X'
                  ? 'bg-indigo-950/40 text-indigo-400 border border-indigo-800/50'
                  : cell === 'O'
                  ? 'bg-rose-950/40 text-rose-400 border border-rose-800/50'
                  : 'bg-slate-900 hover:bg-slate-800 border border-slate-800 text-transparent'
              }`}
            >
              {cell}
            </button>
          )
        })}
      </div>

      {/* Control Buttons */}
      <div className="flex gap-3 mt-2 w-full max-w-[340px]">
        <button
          onClick={handleResetMatch}
          className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-xl transition-all shadow-md active:scale-95"
        >
          {isGameOver ? 'Play Again' : 'Restart Match'}
        </button>
        <button
          onClick={handleResetScores}
          className="px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-semibold rounded-xl transition-all active:scale-95 border border-slate-700/50"
        >
          Reset All
        </button>
      </div>
    </div>
  )
}