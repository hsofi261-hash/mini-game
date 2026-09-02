'use client'

import { useSearchParams } from 'next/navigation'
import React, { useState, useEffect, useCallback } from 'react'
import { io, Socket } from 'socket.io-client'

const SOCKET_SERVER_URL = 'http://localhost:5000/memory'
const CARD_SYMBOLS = ['🍎', '🍌', '🍇', '🍒', '🍕', '🍔', '🍩', '🥊']

interface Card {
  id: number
  value?: string
  isFlipped: boolean
  isMatched: boolean
}

interface MemoryCardsProps {
  mode?: 'computer' | 'online'
}

export default function MemoryCards() {
  const searchParams = useSearchParams()
  const mode = (searchParams.get('mode') as 'computer' | 'online') || 'computer'
  console.log(mode)

  const isOffline = mode === 'computer'

  // Socket State
  const [socket, setSocket] = useState<Socket | null>(null)

  // Game State
  const [board, setBoard] = useState<Card[]>([])
  const [flippedIndices, setFlippedIndices] = useState<number[]>([])
  const [isProcessing, setIsProcessing] = useState<boolean>(false)
  const [currentTurn, setCurrentTurn] = useState<string>('player')
  const [scores, setScores] = useState<{ [key: string]: number }>({ player: 0, opponent: 0 })
  const [isGameOver, setIsGameOver] = useState<boolean>(false)
  const [winner, setWinner] = useState<string | null>(null)

  // Online Matchmaking State
  const [roomId, setRoomId] = useState<string | null>(null)
  const [isSearching, setIsSearching] = useState<boolean>(false)
  const [isGameReady, setIsGameReady] = useState<boolean>(false)
  const [opponentLeft, setOpponentLeft] = useState<boolean>(false)

  // -------------------------------------------------------------
  // OFFLINE GAME INITIALIZATION
  // -------------------------------------------------------------
  const initOfflineGame = useCallback(() => {
    const deckValues = [...CARD_SYMBOLS, ...CARD_SYMBOLS].sort(() => Math.random() - 0.5)
    const initialDeck: Card[] = deckValues.map((val, idx) => ({
      id: idx,
      value: val,
      isFlipped: false,
      isMatched: false,
    }))

    setBoard(initialDeck)
    setFlippedIndices([])
    setIsProcessing(false)
    setCurrentTurn('player')
    setScores({ player: 0, opponent: 0 })
    setIsGameOver(false)
    setWinner(null)
  }, [])

  useEffect(() => {
    if (isOffline) {
      initOfflineGame()
    }
  }, [isOffline, initOfflineGame])

  // -------------------------------------------------------------
  // OFFLINE MATCH EVALUATION LOGIC
  // -------------------------------------------------------------
  useEffect(() => {
    if (!isOffline || flippedIndices.length !== 2) return

    setIsProcessing(true)
    const [firstIdx, secondIdx] = flippedIndices
    const card1 = board[firstIdx]
    const card2 = board[secondIdx]

    setScores((prev) => ({ ...prev, opponent: prev.opponent + 1 }))

    if (card1.value === card2.value) {
      setBoard((prev) =>
        prev.map((card, idx) =>
          idx === firstIdx || idx === secondIdx ? { ...card, isMatched: true } : card
        )
      )

      setScores((prev) => {
        const updatedPlayerScore = prev.player + 1
        if (updatedPlayerScore === CARD_SYMBOLS.length) {
          setIsGameOver(true)
          setWinner('player')
        }
        return { ...prev, player: updatedPlayerScore }
      })

      setFlippedIndices([])
      setIsProcessing(false)
    } else {
      setTimeout(() => {
        setBoard((prev) =>
          prev.map((card, idx) =>
            idx === firstIdx || idx === secondIdx ? { ...card, isFlipped: false } : card
          )
        )
        setFlippedIndices([])
        setIsProcessing(false)
      }, 1000)
    }
  }, [flippedIndices, isOffline, board])

  // -------------------------------------------------------------
  // ONLINE SOCKET LISTENERS & MATCHMAKING
  // -------------------------------------------------------------
  useEffect(() => {
    if (isOffline) return

    const newSocket = io(SOCKET_SERVER_URL, {
      withCredentials: true,
      autoConnect: true,
    })

    setSocket(newSocket)

    newSocket.on('waiting_for_opponent', () => {
      setIsSearching(true)
      setOpponentLeft(false)
    })

    // Match found: transition from searching UI to full game board
    newSocket.on('game_ready', ({ roomId, boardSize, turn, players }) => {
      setRoomId(roomId)
      setCurrentTurn(turn)
      setIsSearching(false)
      setIsGameReady(true) // Gates the game board display
      setOpponentLeft(false)
      setIsGameOver(false)
      setWinner(null)

      const initialDeck: Card[] = Array.from({ length: boardSize }, (_, id) => ({
        id,
        isFlipped: false,
        isMatched: false,
      }))
      setBoard(initialDeck)

      const initialScores: { [key: string]: number } = {}
      players.forEach((pId: string) => (initialScores[pId] = 0))
      setScores(initialScores)
    })

    newSocket.on('card_flipped', ({ cardIndex, value }) => {
      setBoard((prev) =>
        prev.map((card, idx) =>
          idx === cardIndex ? { ...card, value, isFlipped: true } : card
        )
      )
    })

    newSocket.on('match_result', ({ matchedIndices, unflipIndices, scores: updatedScores, turn, isGameOver: gameOver, winner: gameWinner }) => {
      setScores(updatedScores)
      setCurrentTurn(turn)

      if (matchedIndices) {
        setBoard((prev) =>
          prev.map((card, idx) =>
            matchedIndices.includes(idx) ? { ...card, isMatched: true } : card
          )
        )
      }

      if (unflipIndices) {
        setBoard((prev) =>
          prev.map((card, idx) =>
            unflipIndices.includes(idx) ? { ...card, isFlipped: false, value: undefined } : card
          )
        )
      }

      if (gameOver) {
        setIsGameOver(true)
        setWinner(gameWinner)
      }
    })

    newSocket.on('opponent_left', () => {
      setOpponentLeft(true)
      setIsGameReady(false)
      setRoomId(null)
      setIsSearching(false)
    })

    return () => {
      newSocket.disconnect()
    }
  }, [isOffline])

  // -------------------------------------------------------------
  // USER ACTIONS
  // -------------------------------------------------------------
  const handleCardClick = (cardIndex: number) => {
    if (isProcessing || board[cardIndex].isFlipped || board[cardIndex].isMatched || isGameOver) return

    if (isOffline) {
      if (flippedIndices.length >= 2) return

      setBoard((prev) =>
        prev.map((card, idx) => (idx === cardIndex ? { ...card, isFlipped: true } : card))
      )
      setFlippedIndices((prev) => [...prev, cardIndex])
    } else {
      if (isGameReady && roomId && currentTurn === socket?.id) {
        socket.emit('flip_card', { roomId, cardIndex })
      }
    }
  }

  const handleFindMatch = () => {
    if (isOffline) {
      initOfflineGame()
    } else if (socket) {
      setIsSearching(true)
      setIsGameReady(false)
      setOpponentLeft(false)
      setRoomId(null)
      setIsGameOver(false)
      socket.emit('find_match')
    }
  }

  const handleCancelSearch = () => {
    if (socket) {
      socket.emit('cancel_search')
      setIsSearching(false)
    }
  }

  const handleLeaveToLobby = () => {
    if (socket && roomId) {
      socket.emit('leave_room', { roomId })
    }
    setIsGameReady(false)
    setIsSearching(false)
    setRoomId(null)
  }

  const isMyTurn = isOffline ? true : socket?.id ? currentTurn === socket.id : false
  const myScore = isOffline ? scores.player : socket?.id ? (scores[socket.id] ?? 0) : 0
  const opponentId = isOffline ? 'opponent' : Object.keys(scores).find((id) => id !== socket?.id)
  const opponentScore = opponentId ? (scores[opponentId] ?? 0) : 0

  return (
    <div className="w-full max-w-lg mx-auto flex flex-col items-center gap-6">
      {/* Mode Indicator Banner */}
      <div className="text-xs px-3.5 py-1 rounded-full bg-slate-800 text-slate-300 border border-slate-700/60 flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        <span>
          {isOffline ? '🖥️ Computer Mode' : '🌐 Online Memory Matchmaking'}
        </span>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* ONLINE LOBBY OVERLAY (Shown before match is found)           */}
      {/* ------------------------------------------------------------- */}
      {!isOffline && !isGameReady && (
        <div className="w-full max-w-[340px] p-6 bg-slate-950/90 rounded-3xl border border-slate-800 flex flex-col items-center gap-4 text-center shadow-2xl">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-2xl">
            🎮
          </div>

          <div>
            <h3 className="text-base font-bold text-slate-100">Online Matchmaking</h3>
            <p className="text-xs text-slate-400 mt-1">
              Find a random opponent to test your memory in real-time.
            </p>
          </div>

          {opponentLeft && (
            <div className="w-full p-2.5 rounded-xl bg-rose-950/50 border border-rose-800/50 text-rose-400 font-medium text-xs">
              ⚠️ Opponent disconnected or left the game.
            </div>
          )}

          {isSearching ? (
            <div className="w-full flex flex-col items-center gap-3 py-2">
              <div className="w-8 h-8 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin" />
              <span className="text-xs text-indigo-300 font-medium animate-pulse">
                Searching for an available player...
              </span>
              <button
                onClick={handleCancelSearch}
                className="mt-1 text-xs text-slate-400 hover:text-slate-200 underline transition-colors"
              >
                Cancel Search
              </button>
            </div>
          ) : (
            <button
              onClick={handleFindMatch}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm rounded-xl transition-all shadow-lg active:scale-95"
            >
              Find User
            </button>
          )}
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MAIN GAME BOARD (Only active when matched or in offline mode) */}
      {/* ------------------------------------------------------------- */}
      {(isOffline || isGameReady) && (
        <>
          {/* Scoreboard */}
          <div className="grid grid-cols-2 gap-3 w-full max-w-[340px] text-center">
            <div
              className={`p-3 rounded-2xl border transition-all ${
                isMyTurn && !isGameOver
                  ? 'bg-indigo-950/60 border-indigo-500/50 text-indigo-300 ring-1 ring-indigo-500/30'
                  : 'bg-slate-950/60 border-slate-800 text-slate-400'
              }`}
            >
              <div className="text-xs uppercase font-semibold">You</div>
              <div className="text-2xl font-extrabold text-indigo-400 mt-0.5">{myScore}</div>
            </div>

            <div
              className={`p-3 rounded-2xl border transition-all ${
                !isMyTurn && !isGameOver
                  ? 'bg-rose-950/60 border-rose-500/50 text-rose-300 ring-1 ring-rose-500/30'
                  : 'bg-slate-950/60 border-slate-800 text-slate-400'
              }`}
            >
              <div className="text-xs uppercase font-semibold">{isOffline ? 'Attempts' : 'Opponent'}</div>
              <div className="text-2xl font-extrabold text-rose-400 mt-0.5">{opponentScore}</div>
            </div>
          </div>

          {/* Turn / Game Over Status */}
          <div className="h-10 flex items-center justify-center">
            {isGameOver ? (
              <div className="text-lg font-bold flex items-center gap-2 animate-bounce">
                {winner === 'Draw' ? (
                  <span className="text-amber-400">🤝 Match Ended in a Draw!</span>
                ) : (winner === 'player' || winner === socket?.id) ? (
                  <span className="text-indigo-400">🎉 You Won!</span>
                ) : (
                  <span className="text-rose-400">❌ Opponent Won!</span>
                )}
              </div>
            ) : (
              <div className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                Turn:
                {isMyTurn ? (
                  <span className="inline-block px-2.5 py-0.5 rounded-md font-bold text-xs bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                    {isOffline ? 'Keep Matching!' : 'Your Turn'}
                  </span>
                ) : (
                  <span className="inline-block px-2.5 py-0.5 rounded-md font-bold text-xs bg-rose-500/20 text-rose-400 border border-rose-500/30 animate-pulse">
                    Opponent's Turn...
                  </span>
                )}
              </div>
            )}
          </div>

          {/* 4x4 Card Grid */}
          <div className="grid grid-cols-4 gap-3 p-4 bg-slate-950/80 rounded-3xl border border-slate-800 shadow-2xl w-full max-w-[340px] aspect-square">
            {board.map((card, idx) => (
              <button
                key={card.id}
                onClick={() => handleCardClick(idx)}
                disabled={!isMyTurn || card.isFlipped || card.isMatched || isGameOver || isProcessing}
                className={`rounded-2xl font-extrabold text-2xl flex items-center justify-center transition-all transform active:scale-95 ${
                  card.isMatched
                    ? 'bg-emerald-950/40 border border-emerald-800/50 opacity-40 cursor-default'
                    : card.isFlipped
                    ? 'bg-indigo-600 text-white shadow-lg border-2 border-indigo-300'
                    : 'bg-slate-900 hover:bg-slate-800 border border-slate-800 text-transparent'
                }`}
              >
                {card.isFlipped || card.isMatched ? card.value : '?'}
              </button>
            ))}
          </div>

          {/* Match Actions */}
          <div className="w-full max-w-[340px] mt-2 flex gap-3">
            <button
              onClick={handleFindMatch}
              className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-xl transition-all shadow-md active:scale-95"
            >
              {isOffline ? 'Play Again' : isGameOver ? 'Find Next Match' : 'Re-queue Match'}
            </button>
            {!isOffline && (
              <button
                onClick={handleLeaveToLobby}
                className="py-3 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-semibold rounded-xl transition-all active:scale-95 border border-slate-700"
              >
                Lobby
              </button>
            )}
          </div>
        </>
      )}
    </div>
  )
}