'use client'

import React from 'react'
import Link from 'next/link'
import { useParams, useSearchParams } from 'next/navigation'
import TicTacToe from '@/components/games/TicTacToe'
import MemoryCards from '@/components/games/MemoryCards'

export default function DedicatedPlayPage() {
  const params = useParams()
  const searchParams = useSearchParams()

  const gameId = params.id as string
  const mode = (searchParams.get('mode') as 'computer' | 'online') || 'computer'

  const VALID_GAMES = ['tic-tac-toe', 'memory-cards']

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Game Control Bar */}
      <header className="border-b border-slate-800 bg-slate-900/80 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-semibold text-indigo-400 uppercase tracking-wider">
            Playing: {gameId} ({mode} mode)
          </span>
        </div>
        <Link
          href={`/games/${gameId}`}
          className="text-xs px-3 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 transition-colors font-medium"
        >
          Exit to Game Details
        </Link>
      </header>

      {/* Dynamic Game View Container */}
      <main className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-3xl p-8 min-h-[500px] flex items-center justify-center">
          {/* Render active game component */}
          {gameId === 'tic-tac-toe' && <TicTacToe mode={mode} />}
          {gameId === 'memory-cards' && <MemoryCards />}

          {/* Show fallback message only if gameId doesn't match any registered game */}
          {!VALID_GAMES.includes(gameId) && (
            <div className="text-center text-slate-400">
              [ Game component for "{gameId}" not found ]
            </div>
          )}
        </div>
      </main>
    </div>
  )
}