'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { io, Socket } from 'socket.io-client'

type Player = 'X' | 'O'
type BoardState = (Player | null)[]

const SOCKET_SERVER_URL = 'http://localhost:5000/tictactoe'

const WINNING_COMBINATIONS = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  [0, 4, 8], [2, 4, 6]
]

interface TicTacToeProps {
  mode?: 'computer' | 'online'
}

export default function TicTacToe({ mode = 'computer' }: TicTacToeProps) {
  const [board, setBoard] = useState<BoardState>(Array(9).fill(null))
  const [xIsNext, setXIsNext] = useState<boolean>(true)
  const [isThinking, setIsThinking] = useState<boolean>(false)
  const [scores, setScores] = useState({ player: 0, opponent: 0, draws: 0 })

  // Matchmaking & Socket state
  const [socket, setSocket] = useState<Socket | null>(null)
  const [roomId, setRoomId] = useState<string | null>(null)
  const [isSearching, setIsSearching] = useState<boolean>(false)
  const [isGameReady, setIsGameReady] = useState<boolean>(false)
  const [playerSymbol, setPlayerSymbol] = useState<Player | null>(null)
  const [currentTurn, setCurrentTurn] = useState<Player>('X')
  const [opponentLeft, setOpponentLeft] = useState<boolean>(false)
  const [connectionError, setConnectionError] = useState<string | null>(null)

  // Calculate winner with array safety check
  const calculateWinner = useCallback((squares: BoardState) => {
    if (!squares || !Array.isArray(squares)) return null

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

  // -------------------------------------------------------------
  // SOCKET LISTENERS FOR MATCHMAKING & GAMEPLAY
  // -------------------------------------------------------------
  useEffect(() => {
    if (mode !== 'online') return

    const newSocket = io(SOCKET_SERVER_URL, {
      withCredentials: true,
      autoConnect: true,
    })

    setSocket(newSocket)

    // Backend queue events
    newSocket.on('waiting_for_opponent', () => {
      setIsSearching(true)
      setOpponentLeft(false)
      setConnectionError(null)
    })

    // Match found event
    newSocket.on('game_ready', ({ roomId, symbol, board: serverBoard, turn }) => {
      setRoomId(roomId)
      setPlayerSymbol(symbol)
      setBoard(serverBoard || Array(9).fill(null))
      setCurrentTurn(turn)
      setIsGameReady(true)
      setIsSearching(false)
      setOpponentLeft(false)
      setConnectionError(null)
    })

    // Move synchronized from server
    newSocket.on('move_made', ({ board: updatedBoard, turn }) => {
      if (updatedBoard) {
        setBoard(updatedBoard)
      }
      setCurrentTurn(turn)
    })

    // Opponent disconnected mid-game
    newSocket.on('opponent_left', () => {
      setOpponentLeft(true)
      setIsGameReady(false)
      setRoomId(null)
    })

    // Socket connection errors
    newSocket.on('connect_error', () => {
      setConnectionError('Failed to connect to matchmaking server.')
      setIsSearching(false)
    })

    return () => {
      newSocket.disconnect()
    }
  }, [mode])

  // Track scores on match conclusion
  useEffect(() => {
    if (!winner) return

    if (winner === 'Draw') {
      setScores((prev) => ({ ...prev, draws: prev.draws + 1 }))
    } else if (mode === 'computer') {
      if (winner === 'X') setScores((prev) => ({ ...prev, player: prev.player + 1 }))
      else setScores((prev) => ({ ...prev, opponent: prev.opponent + 1 }))
    } else if (mode === 'online') {
      if (winner === playerSymbol) setScores((prev) => ({ ...prev, player: prev.player + 1 }))
      else setScores((prev) => ({ ...prev, opponent: prev.opponent + 1 }))
    }
  }, [winner, mode, playerSymbol])

  // Trigger Matchmaking
  const handleFindMatch = () => {
    if (!socket) return
    setBoard(Array(9).fill(null))
    setIsGameReady(false)
    setOpponentLeft(false)
    setRoomId(null)
    setConnectionError(null)
    socket.emit('find_match')
  }

  // -------------------------------------------------------------
  // COMPUTER AI LOGIC
  // -------------------------------------------------------------
  const getComputerMove = useCallback((currentBoard: BoardState): number => {
    if (!currentBoard || !Array.isArray(currentBoard)) return -1

    // 1. Win if possible
    for (let i = 0; i < 9; i++) {
      if (!currentBoard[i]) {
        const tempBoard = [...currentBoard]
        tempBoard[i] = 'O'
        if (calculateWinner(tempBoard)?.winner === 'O') return i
      }
    }
    // 2. Block player win
    for (let i = 0; i < 9; i++) {
      if (!currentBoard[i]) {
        const tempBoard = [...currentBoard]
        tempBoard[i] = 'X'
        if (calculateWinner(tempBoard)?.winner === 'X') return i
      }
    }
    // 3. Take center
    if (!currentBoard[4]) return 4

    // 4. Take random corner
    const corners = [0, 2, 6, 8].filter((i) => !currentBoard[i])
    if (corners.length > 0) return corners[Math.floor(Math.random() * corners.length)]

    // 5. Take any open square
    const openSquares = currentBoard
      .map((val, idx) => (val === null ? idx : null))
      .filter((val): val is number => val !== null)

    return openSquares[Math.floor(Math.random() * openSquares.length)]
  }, [calculateWinner])

  useEffect(() => {
    if (mode !== 'computer' || xIsNext || isGameOver) return

    setIsThinking(true)
    const timer = setTimeout(() => {
      const moveIndex = getComputerMove(board)
      if (moveIndex !== undefined && moveIndex !== -1) {
        const nextBoard = [...board]
        nextBoard[moveIndex] = 'O'
        setBoard(nextBoard)
      }
      setXIsNext(true)
      setIsThinking(false)
    }, 500)

    return () => clearTimeout(timer)
  }, [mode, xIsNext, isGameOver, board, getComputerMove])

  // -------------------------------------------------------------
  // USER ACTIONS
  // -------------------------------------------------------------
  const handleSquareClick = (index: number) => {
    if (!board || board[index] || isGameOver) return

    if (mode === 'computer') {
      if (!xIsNext || isThinking) return
      const nextBoard = [...board]
      nextBoard[index] = 'X'
      setBoard(nextBoard)
      setXIsNext(false)
    } else if (mode === 'online') {
      if (currentTurn !== playerSymbol || !isGameReady || !roomId) return
      socket?.emit('make_move', { roomId, index })
    }
  }

  const handleResetMatch = () => {
    if (mode === 'computer') {
      setBoard(Array(9).fill(null))
      setXIsNext(true)
      setIsThinking(false)
    } else if (mode === 'online') {
      handleFindMatch()
    }
  }

  const handleResetScores = () => {
    setBoard(Array(9).fill(null))
    setScores({ player: 0, opponent: 0, draws: 0 })
    if (mode === 'computer') setXIsNext(true)
  }

  const isMyTurn = mode === 'computer' ? xIsNext : currentTurn === playerSymbol

  return (
    <div className="w-full max-w-lg mx-auto flex flex-col items-center gap-6">
      {/* Mode Indicator Banner */}
      <div className="text-xs px-3.5 py-1 rounded-full bg-slate-800 text-slate-300 border border-slate-700/60 flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        <span>
          {mode === 'computer' ? '🤖 Player vs Computer' : '🌐 Online Automatic Matchmaking'}
        </span>
      </div>

      {/* Online Lobby: Find Match & Connection Banner */}
      {mode === 'online' && !isGameReady && (
        <div className="w-full max-w-[340px] p-5 bg-slate-950/80 rounded-2xl border border-slate-800 flex flex-col items-center gap-3 text-center">
          {connectionError ? (
            <div className="text-rose-400 font-semibold text-sm">⚠️ {connectionError}</div>
          ) : opponentLeft ? (
            <div className="text-rose-400 font-semibold text-sm">⚠️ Opponent disconnected.</div>
          ) : isSearching ? (
            <div className="flex flex-col items-center gap-2">
              <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
              <span className="text-xs text-indigo-300 font-medium animate-pulse">
                Searching for an available opponent...
              </span>
            </div>
          ) : (
            <p className="text-xs text-slate-400">Click below to enter the global matchmaking queue.</p>
          )}

          <button
            onClick={handleFindMatch}
            disabled={isSearching}
            className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-950 text-white font-semibold text-sm rounded-xl transition-all shadow-md active:scale-95"
          >
            {isSearching ? 'Searching...' : 'Find Online Match'}
          </button>
        </div>
      )}

      {/* Main Game Interface */}
      {(mode === 'computer' || isGameReady) && (
        <>
          {/* Scoreboard */}
          <div className="grid grid-cols-3 gap-3 w-full text-center">
            <div
              className={`p-3 rounded-2xl border transition-all ${
                isMyTurn && !isGameOver
                  ? 'bg-indigo-950/60 border-indigo-500/50 text-indigo-300 ring-1 ring-indigo-500/30'
                  : 'bg-slate-950/60 border-slate-800 text-slate-400'
              }`}
            >
              <div className="text-xs uppercase font-semibold">
                {mode === 'online' ? `You (${playerSymbol || '?'})` : 'You (X)'}
              </div>
              <div className="text-2xl font-extrabold text-indigo-400 mt-0.5">{scores.player}</div>
            </div>

            <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800 text-slate-400">
              <div className="text-xs uppercase font-semibold">Draws</div>
              <div className="text-2xl font-extrabold text-slate-200 mt-0.5">{scores.draws}</div>
            </div>

            <div
              className={`p-3 rounded-2xl border transition-all ${
                !isMyTurn && !isGameOver
                  ? 'bg-rose-950/60 border-rose-500/50 text-rose-300 ring-1 ring-rose-500/30'
                  : 'bg-slate-950/60 border-slate-800 text-slate-400'
              }`}
            >
              <div className="text-xs uppercase font-semibold">
                {mode === 'online'
                  ? `Opponent (${playerSymbol === 'X' ? 'O' : 'X'})`
                  : 'Computer (O)'}
              </div>
              <div className="text-2xl font-extrabold text-rose-400 mt-0.5">{scores.opponent}</div>
            </div>
          </div>

          {/* Status Banner */}
          <div className="h-10 flex items-center justify-center">
            {winner ? (
              <div className="text-lg font-bold flex items-center gap-2 animate-bounce">
                {winner === 'Draw' ? (
                  <span className="text-amber-400">🤝 Match Ended in a Draw!</span>
                ) : (mode === 'computer' && winner === 'X') || winner === playerSymbol ? (
                  <span className="text-indigo-400">🎉 You Won the Match!</span>
                ) : (
                  <span className="text-rose-400">❌ Opponent Won!</span>
                )}
              </div>
            ) : (
              <div className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                Turn:
                {isMyTurn ? (
                  <span className="inline-block px-2.5 py-0.5 rounded-md font-bold text-xs bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                    Your Turn ({mode === 'online' ? playerSymbol : 'X'})
                  </span>
                ) : (
                  <span className="inline-block px-2.5 py-0.5 rounded-md font-bold text-xs bg-rose-500/20 text-rose-400 border border-rose-500/30 animate-pulse">
                    {mode === 'computer' ? 'Computer Thinking...' : "Opponent's Turn..."}
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
                  disabled={
                    Boolean(cell) ||
                    isGameOver ||
                    !isMyTurn ||
                    (mode === 'online' && !isGameReady)
                  }
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

          {/* Controls */}
          <div className="flex gap-3 mt-2 w-full max-w-[340px]">
            <button
              onClick={handleResetMatch}
              className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-xl transition-all shadow-md active:scale-95"
            >
              {mode === 'online' ? 'Find Next Match' : isGameOver ? 'Play Again' : 'Restart Match'}
            </button>
            <button
              onClick={handleResetScores}
              className="px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-semibold rounded-xl transition-all active:scale-95 border border-slate-700/50"
            >
              Reset All
            </button>
          </div>
        </>
      )}
    </div>
  )
}