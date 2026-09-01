'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import { useGetGamesQuery } from '@/lib/service/gameApi'

const CATEGORIES = ['All', 'Strategy', 'Puzzle', 'Arcade', 'Reflex', 'Word']

// Palette of available default gradient combinations
const DEFAULT_GRADIENT_PALETTE = [
  'from-indigo-600 to-purple-700',
  'from-purple-600 to-pink-700',
  'from-emerald-600 to-teal-700',
  'from-teal-600 to-cyan-700',
  'from-rose-600 to-red-700',
  'from-red-600 to-orange-700',
  'from-amber-500 to-orange-600',
  'from-orange-500 to-amber-700',
  'from-cyan-600 to-blue-700',
  'from-blue-600 to-indigo-700',
  'from-violet-600 to-purple-800',
  'from-fuchsia-600 to-pink-600',
  'from-sky-500 to-indigo-600',
  'from-lime-500 to-emerald-700',
  'from-pink-600 to-rose-700',
]

// Map explicit color keys to static Tailwind classes for compiler optimization
const COLOR_MAP: Record<string, string> = {
  indigo: 'from-indigo-600 to-purple-700',
  purple: 'from-purple-600 to-pink-700',
  emerald: 'from-emerald-600 to-teal-700',
  teal: 'from-teal-600 to-cyan-700',
  rose: 'from-rose-600 to-red-700',
  red: 'from-red-600 to-orange-700',
  amber: 'from-amber-500 to-orange-600',
  orange: 'from-orange-500 to-amber-700',
  cyan: 'from-cyan-600 to-blue-700',
  blue: 'from-blue-600 to-indigo-700',
  violet: 'from-violet-600 to-purple-800',
  fuchsia: 'from-fuchsia-600 to-pink-600',
  sky: 'from-sky-500 to-indigo-600',
  lime: 'from-lime-500 to-emerald-700',
  pink: 'from-pink-600 to-rose-700',
  slate: 'from-slate-700 to-slate-900',
}

// Generates a consistent pseudo-random gradient index from a seed (e.g. game ID) to prevent React hydration mismatch errors
const getRandomGradient = (seed: string | number = 0): string => {
  const strSeed = String(seed)
  let hash = 0
  for (let i = 0; i < strSeed.length; i++) {
    hash = strSeed.charCodeAt(i) + ((hash << 5) - hash)
  }
  const index = Math.abs(hash) % DEFAULT_GRADIENT_PALETTE.length
  return DEFAULT_GRADIENT_PALETTE[index]
}

// Safely match backend color key to Tailwind gradient, or fallback to a deterministic random gradient
const getGradientClass = (colorKey?: string, gameId?: string | number): string => {
  if (!colorKey) return getRandomGradient(gameId)
  const normalizedKey = colorKey.toLowerCase().trim()
  return COLOR_MAP[normalizedKey] || getRandomGradient(gameId)
}

export default function HomePage() {
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [searchQuery, setSearchQuery] = useState('')
  const [page, setPage] = useState(1)

  const router = useRouter()

  // Execute RTK Query with dynamic pagination & search parameters
  const { data, isLoading, isFetching, isError, refetch } = useGetGamesQuery({
    page,
    limit: 9,
    search: searchQuery,
  })

  const games = data?.data || []
  const pagination = data?.pagination

  // Filter by category client-side if a category filter is selected
  const filteredGames = games.filter((game) => {
    if (selectedCategory === 'All') return true
    return game.category.toLowerCase() === selectedCategory.toLowerCase()
  })

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value)
    setPage(1) // Reset pagination on new search query
  }

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category)
    setPage(1) // Reset pagination on category change
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Navbar */}
      <Navbar />

      {/* Hero & Search Header */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 text-center">
        <h1 className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight">
          Play Free <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-pink-400">Mini Games</span> Instantly
        </h1>
        <p className="mt-3 text-slate-400 max-w-xl mx-auto text-base sm:text-lg">
          No installs required. Jump straight into quick arcade games, puzzles, and brain teasers.
        </p>

        {/* Search Input */}
        <div className="mt-6 max-w-md mx-auto">
          <input
            type="text"
            placeholder="Search games..."
            value={searchQuery}
            onChange={handleSearchChange}
            className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
          />
        </div>

        {/* Category Filters */}
        <div className="flex flex-wrap justify-center gap-2 mt-6">
          {CATEGORIES.map((category) => (
            <button
              key={category}
              onClick={() => handleCategoryChange(category)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                selectedCategory === category
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </section>

      {/* Game Grid */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        {isLoading || isFetching ? (
          <div className="text-center py-16 text-slate-400">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-indigo-500 border-t-transparent mb-4"></div>
            <p className="text-sm font-medium">Loading games...</p>
          </div>
        ) : isError ? (
          <div className="text-center py-12 text-rose-400">
            <p className="mb-4">Failed to load games. Please check your backend connection.</p>
            <button
              onClick={() => refetch()}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-sm font-medium border border-slate-700 transition-colors"
            >
              Retry
            </button>
          </div>
        ) : filteredGames.length === 0 ? (
          <div className="text-center py-12 text-slate-500">
            No games found matching your search.
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredGames.map((game) => (
                <div
                  key={game.id}
                  className="group relative bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden hover:border-slate-700 hover:shadow-xl hover:shadow-indigo-500/10 transition-all duration-300 flex flex-col justify-between"
                >
                  {/* Banner Thumbnail with Lookup/Random Gradient */}
                  <div className={`h-40 bg-gradient-to-br ${getGradientClass(game.color, game.id)} p-6 flex items-center justify-center relative`}>
                    <span className="text-6xl drop-shadow-md group-hover:scale-110 transition-transform duration-300">
                      {game.icon || '🎮'}
                    </span>
                    {game.difficulty && (
                      <span className="absolute top-3 right-3 bg-slate-950/60 backdrop-blur text-xs px-2.5 py-1 rounded-full text-slate-300 font-medium">
                        {game.difficulty}
                      </span>
                    )}
                  </div>

                  {/* Info Container */}
                  <div className="p-5 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="text-xl font-bold text-white group-hover:text-indigo-400 transition-colors">
                          {game.title}
                        </h3>
                        <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-indigo-300 border border-slate-700 font-medium">
                          {game.category}
                        </span>
                      </div>
                      <p className="text-sm text-slate-400 line-clamp-2 mb-4">
                        {game.description}
                      </p>
                    </div>

                    {/* Card Metadata & CTA */}
                    <div>
                      <div className="flex items-center justify-between text-xs text-slate-400 border-t border-slate-800/80 pt-3 mb-4">
                        <span>⭐ {game.rating}</span>
                        <span>🎮 {game.plays} plays</span>
                      </div>

                      <button
                        onClick={() => router.push(`/games/${game.id}`)}
                        className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl text-sm transition-colors shadow-md shadow-indigo-600/20"
                      >
                        Play Now
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination Controls */}
            {pagination && pagination.totalPages > 1 && (
              <div className="flex justify-center items-center gap-4 mt-10">
                <button
                  disabled={!pagination.hasPrevPage}
                  onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                  className="px-4 py-2 bg-slate-900 border border-slate-800 text-sm font-medium rounded-lg text-slate-300 hover:text-white hover:border-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                >
                  Previous
                </button>
                <span className="text-xs text-slate-400">
                  Page <strong className="text-slate-200">{pagination.currentPage}</strong> of{' '}
                  <strong className="text-slate-200">{pagination.totalPages}</strong>
                </span>
                <button
                  disabled={!pagination.hasNextPage}
                  onClick={() => setPage((prev) => prev + 1)}
                  className="px-4 py-2 bg-slate-900 border border-slate-800 text-sm font-medium rounded-lg text-slate-300 hover:text-white hover:border-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}