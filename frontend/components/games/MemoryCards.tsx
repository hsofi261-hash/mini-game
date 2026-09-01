'use client'

import React, { useState, useEffect, useCallback } from 'react'

interface Card {
  id: number
  emoji: string
  isFlipped: boolean
  isMatched: boolean
}

const CARD_EMOJIS = ['🚀', '⚡', '🎮', '👾', '🔥', '💎', '🌟', '🎨']

export default function MemoryCards() {
  const [cards, setCards] = useState<Card[]>([])
  const [flippedCards, setFlippedCards] = useState<number[]>([])
  const [isChecking, setIsChecking] = useState<boolean>(false)
  const [moves, setMoves] = useState<number>(0)
  const [matches, setMatches] = useState<number>(0)

  // Initialize and shuffle deck
  const initializeGame = useCallback(() => {
    const deck: Card[] = [...CARD_EMOJIS, ...CARD_EMOJIS]
      .sort(() => Math.random() - 0.5)
      .map((emoji, index) => ({
        id: index,
        emoji,
        isFlipped: false,
        isMatched: false
      }))

    setCards(deck)
    setFlippedCards([])
    setIsChecking(false)
    setMoves(0)
    setMatches(0)
  }, [])

  useEffect(() => {
    initializeGame()
  }, [initializeGame])

  const handleCardClick = (index: number) => {
    if (
      isChecking ||
      cards[index].isFlipped ||
      cards[index].isMatched ||
      flippedCards.length === 2
    ) {
      return
    }

    const updatedCards = [...cards]
    updatedCards[index].isFlipped = true
    setCards(updatedCards)

    const nextFlipped = [...flippedCards, index]
    setFlippedCards(nextFlipped)

    if (nextFlipped.length === 2) {
      setIsChecking(true)
      setMoves((prev) => prev + 1)

      const [firstIdx, secondIdx] = nextFlipped

      if (updatedCards[firstIdx].emoji === updatedCards[secondIdx].emoji) {
        // Match found
        setTimeout(() => {
          setCards((prev) =>
            prev.map((card, i) =>
              i === firstIdx || i === secondIdx
                ? { ...card, isMatched: true }
                : card
            )
          )
          setMatches((prev) => prev + 1)
          setFlippedCards([])
          setIsChecking(false)
        }, 400)
      } else {
        // No match - flip back after delay
        setTimeout(() => {
          setCards((prev) =>
            prev.map((card, i) =>
              i === firstIdx || i === secondIdx
                ? { ...card, isFlipped: false }
                : card
            )
          )
          setFlippedCards([])
          setIsChecking(false)
        }, 1000)
      }
    }
  }

  const isGameOver = matches === CARD_EMOJIS.length

  return (
    <div className="w-full max-w-md mx-auto flex flex-col items-center gap-6">
      {/* Mode Indicator */}
      <div className="text-xs px-3.5 py-1 rounded-full bg-slate-800 text-slate-300 border border-slate-700/60 flex items-center gap-2">
        <span>🧠</span>
        <span>Memory Card Match</span>
      </div>

      {/* Scoreboard */}
      <div className="grid grid-cols-2 gap-4 w-full text-center">
        <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800 text-slate-400">
          <div className="text-xs uppercase font-semibold">Moves</div>
          <div className="text-2xl font-extrabold text-indigo-400 mt-0.5">{moves}</div>
        </div>

        <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800 text-slate-400">
          <div className="text-xs uppercase font-semibold font-mono">Pairs Found</div>
          <div className="text-2xl font-extrabold text-emerald-400 mt-0.5">
            {matches} / {CARD_EMOJIS.length}
          </div>
        </div>
      </div>

      {/* Game Status Banner */}
      <div className="h-8 flex items-center justify-center">
        {isGameOver ? (
          <div className="text-lg font-bold text-emerald-400 animate-bounce flex items-center gap-2">
            🎉 Complete! Completed in {moves} moves.
          </div>
        ) : (
          <div className="text-xs font-semibold text-slate-400">
            Find all matching emoji pairs
          </div>
        )}
      </div>

      {/* 4x4 Cards Grid */}
      <div className="grid grid-cols-4 gap-3 p-4 bg-slate-950/80 rounded-3xl border border-slate-800 shadow-2xl w-full aspect-square">
        {cards.map((card, idx) => (
          <button
            key={card.id}
            onClick={() => handleCardClick(idx)}
            disabled={card.isFlipped || card.isMatched || isChecking}
            className={`rounded-2xl text-3xl sm:text-4xl flex items-center justify-center transition-all duration-300 transform active:scale-95 border ${
              card.isMatched
                ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-400 opacity-60'
                : card.isFlipped
                ? 'bg-indigo-950/80 border-indigo-500/50 scale-105 shadow-lg shadow-indigo-500/20'
                : 'bg-slate-900 hover:bg-slate-800 border-slate-800 text-transparent'
            }`}
          >
            {card.isFlipped || card.isMatched ? card.emoji : '❓'}
          </button>
        ))}
      </div>

      {/* Control Button */}
      <div className="w-full">
        <button
          onClick={initializeGame}
          className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-xl transition-all shadow-md active:scale-95"
        >
          {isGameOver ? 'Play Again' : 'Reset Game'}
        </button>
      </div>
    </div>
  )
}