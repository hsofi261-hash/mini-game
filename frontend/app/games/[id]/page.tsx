'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import {
  useGetGameDetailQuery,
  Review,
  LeaderboardEntry,
  GameRule,
} from '@/lib/service/gameApi' // Adjust import path to match your folder structure

export default function GameDetailsPage() {
  const params = useParams()
  const rawGameId = (params?.id as string) || 'tic-tac-toe'

  // RTK Query API Hook
  const { data, isLoading, isError } = useGetGameDetailQuery(rawGameId)
  const game = data?.data

  const [activeTab, setActiveTab] = useState<'overview' | 'how-to-play' | 'leaderboard' | 'reviews'>('overview')
  const [reviewsList, setReviewsList] = useState<Review[]>([])
  const [userRating, setUserRating] = useState<number>(5)
  const [userComment, setUserComment] = useState<string>('')
  const [reviewSubmitted, setReviewSubmitted] = useState<boolean>(false)

  // Synchronize local review state whenever API data loads/updates
  useEffect(() => {
    if (game) {
      const initialReviews = game.Reviews || (game as any).reviews || []
      setReviewsList(initialReviews)
    }
  }, [game])

  // Normalizing nested API attributes (handles PascalCase API vs camelCase fallbacks)
  const rules: GameRule[] = game?.GameRules || (game as any)?.rules || []
  const leaderboard: LeaderboardEntry[] = game?.LeaderboardEntries || (game as any)?.leaderboard || []
  const onlinePlayersCount = game?.onlinePlayers ?? (game as any)?.stats?.onlinePlayers ?? 0

  const handleAddReview = (e: React.FormEvent) => {
    e.preventDefault()
    if (!userComment.trim()) return

    const newRev: Review = {
      id: Date.now().toString(),
      user: 'You (Player)',
      avatar: '😎',
      rating: userRating,
      date: 'Just now',
      comment: userComment,
    }

    setReviewsList((prev) => [newRev, ...prev])
    setUserComment('')
    setReviewSubmitted(true)
    setTimeout(() => setReviewSubmitted(false), 4000)
  }

  // Loading State
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center font-sans">
        <div className="text-center space-y-3">
          <div className="text-4xl animate-bounce">🎮</div>
          <p className="text-sm text-slate-400 font-medium">Loading game details...</p>
        </div>
      </div>
    )
  }

  // Error / Not Found State
  if (isError || !game) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center font-sans">
        <div className="text-center space-y-4">
          <div className="text-4xl">⚠️</div>
          <p className="text-base text-slate-300 font-semibold">Failed to load game details</p>
          <p className="text-xs text-slate-500 max-w-sm">The game may not exist or the server could be unavailable.</p>
          <Link
            href="/games"
            className="inline-block mt-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold transition-colors"
          >
            ← Back to Games
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/games" className="text-slate-400 hover:text-white text-sm font-medium transition-colors">
            ← Back to Games
          </Link>
          <div className="flex items-center gap-2 font-bold text-lg text-indigo-400">
            <span>{game.icon || '🎮'}</span> {game.title}
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto px-4 py-8 w-full">
        {/* Top Hero & Play Mode Launch Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
          {/* Hero Banner */}
          <div
            className={`lg:col-span-2 rounded-3xl bg-gradient-to-br ${
              game.color || 'from-indigo-600 to-purple-800'
            } p-8 sm:p-12 flex flex-col justify-between relative overflow-hidden min-h-[280px] shadow-xl border border-white/10`}
          >
            <div className="flex justify-between items-start z-10">
              <span className="bg-slate-950/60 backdrop-blur text-xs px-3.5 py-1.5 rounded-full text-slate-200 font-semibold border border-white/10">
                {game.category}
              </span>
              <span className="bg-slate-950/60 backdrop-blur text-xs px-3.5 py-1.5 rounded-full text-amber-300 font-semibold border border-white/10 flex items-center gap-1">
                ⭐ {game.rating} <span className="text-slate-400 font-normal">({game.totalReviews} reviews)</span>
              </span>
            </div>
            <div className="z-10 mt-6">
              <div className="text-5xl mb-3">{game.icon || '🎮'}</div>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">{game.title}</h1>
              <p className="mt-2 text-white/90 text-sm sm:text-base leading-relaxed max-w-xl">{game.tagline}</p>
            </div>
          </div>

          {/* Dedicated Launch Panel */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 flex flex-col justify-between shadow-lg">
            <div>
              <h3 className="text-lg font-bold text-white mb-1">Choose Play Mode</h3>
              <p className="text-xs text-slate-400 mb-6">Select your opponent to start playing.</p>

              <div className="space-y-3">
                <Link
                  href={`/games/${game.id}/play?mode=computer`}
                  className="w-full py-3.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl text-sm flex items-center justify-between transition-all transform active:scale-95 shadow-md hover:shadow-indigo-500/25"
                >
                  <span className="flex items-center gap-2">🤖 Play vs Computer</span>
                  <span>→</span>
                </Link>

                <Link
                  href={`/games/${game.id}/play?mode=online`}
                  className="w-full py-3.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700 font-semibold rounded-xl text-sm flex items-center justify-between transition-all transform active:scale-95"
                >
                  <span className="flex items-center gap-2">🌐 Play Online</span>
                  <span className="text-xs bg-emerald-500/20 text-emerald-400 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                    {onlinePlayersCount} active
                  </span>
                </Link>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-6 border-t border-slate-800 text-center mt-6">
              <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
                <div className="text-xs text-slate-400">Difficulty</div>
                <div className="text-sm font-semibold text-slate-200 mt-0.5">{game.difficulty || 'Medium'}</div>
              </div>
              <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
                <div className="text-xs text-slate-400">Total Plays</div>
                <div className="text-sm font-semibold text-slate-200 mt-0.5">{game.plays?.toLocaleString() || 0}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Details Card Section */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl">
          {/* Navigation Tabs Header */}
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4 mb-8">
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setActiveTab('overview')}
                className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  activeTab === 'overview'
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                    : 'bg-slate-800/60 text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                📖 Overview
              </button>
              <button
                onClick={() => setActiveTab('how-to-play')}
                className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  activeTab === 'how-to-play'
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                    : 'bg-slate-800/60 text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                🎮 How to Play
              </button>
              <button
                onClick={() => setActiveTab('leaderboard')}
                className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  activeTab === 'leaderboard'
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                    : 'bg-slate-800/60 text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                🏆 Leaderboard
              </button>
              <button
                onClick={() => setActiveTab('reviews')}
                className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  activeTab === 'reviews'
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                    : 'bg-slate-800/60 text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                ⭐ Ratings & Reviews ({reviewsList.length})
              </button>
            </div>
          </div>

          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-white mb-3">About the Game</h2>
                <p className="text-slate-300 text-base leading-relaxed">
                  {game.description || 'No description available for this game.'}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
                <div className="bg-slate-950/50 p-5 rounded-2xl border border-slate-800">
                  <div className="text-indigo-400 font-bold text-lg mb-1">⚡ Fast Matches</div>
                  <p className="text-xs text-slate-400 leading-normal">
                    Quick 1 to 3 minute rounds perfect for fast-paced gameplay sessions.
                  </p>
                </div>
                <div className="bg-slate-950/50 p-5 rounded-2xl border border-slate-800">
                  <div className="text-indigo-400 font-bold text-lg mb-1">🤖 Adaptive AI</div>
                  <p className="text-xs text-slate-400 leading-normal">
                    Features multiple difficulty levels designed for beginners to masters.
                  </p>
                </div>
                <div className="bg-slate-950/50 p-5 rounded-2xl border border-slate-800">
                  <div className="text-indigo-400 font-bold text-lg mb-1">🌐 Real-Time Multiplayer</div>
                  <p className="text-xs text-slate-400 leading-normal">
                    Match up instantly with opponents worldwide with ranked scoring.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: HOW TO PLAY */}
          {activeTab === 'how-to-play' && (
            <div className="space-y-8">
              <div>
                <h2 className="text-xl font-bold text-white mb-2">Game Rules & Setup</h2>
                <p className="text-sm text-slate-400">Master the basics to outsmart your opponents every round.</p>
              </div>

              {rules.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {rules.map((rule) => (
                    <div
                      key={rule.id || rule.step}
                      className="bg-slate-950/60 p-5 rounded-2xl border border-slate-800 flex gap-4 items-start"
                    >
                      <span className="flex-shrink-0 w-9 h-9 bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 rounded-xl flex items-center justify-center font-extrabold text-sm">
                        {rule.step}
                      </span>
                      <div>
                        <h4 className="text-base font-semibold text-slate-100 mb-1">{rule.title}</h4>
                        <p className="text-xs text-slate-400 leading-relaxed">{rule.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-500">No specific rules listed for this game yet.</p>
              )}

              {game.tips && game.tips.length > 0 && (
                <div className="bg-indigo-950/30 border border-indigo-800/40 rounded-2xl p-6">
                  <h3 className="text-base font-bold text-indigo-300 mb-3 flex items-center gap-2">
                    💡 Winning Strategies & Pro Tips
                  </h3>
                  <ul className="space-y-2.5">
                    {game.tips.map((tip, idx) => (
                      <li key={idx} className="flex items-start gap-2.5 text-sm text-indigo-100/90">
                        <span className="text-indigo-400 mt-0.5">•</span>
                        <span>{tip}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: LEADERBOARD */}
          {activeTab === 'leaderboard' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-white mb-1">Global Rankings</h2>
                  <p className="text-xs text-slate-400">Top players sorted by global MMR and total victories.</p>
                </div>
              </div>

              {leaderboard.length > 0 ? (
                <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950/40">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-950 text-xs uppercase text-slate-400 border-b border-slate-800">
                      <tr>
                        <th className="py-3.5 px-4 font-semibold">Rank</th>
                        <th className="py-3.5 px-4 font-semibold">Player</th>
                        <th className="py-3.5 px-4 font-semibold text-center">Win Rate</th>
                        <th className="py-3.5 px-4 font-semibold text-center">Wins</th>
                        <th className="py-3.5 px-4 font-semibold text-right">Score (MMR)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {leaderboard.map((entry) => (
                        <tr key={entry.id || entry.rank} className="hover:bg-slate-800/30 transition-colors">
                          <td className="py-3.5 px-4 font-bold">
                            {entry.rank === 1 && <span className="text-xl">🥇</span>}
                            {entry.rank === 2 && <span className="text-xl">🥈</span>}
                            {entry.rank === 3 && <span className="text-xl">🥉</span>}
                            {entry.rank > 3 && <span className="text-slate-400 pl-2">#{entry.rank}</span>}
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-3">
                              <span className="text-2xl">{entry.avatar || '👤'}</span>
                              <div>
                                <div className="font-semibold text-slate-200 flex items-center gap-2">
                                  {entry.user}
                                  {entry.badge && (
                                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                                      {entry.badge}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 text-center font-medium text-emerald-400">
                            {entry.winRate || 'N/A'}
                          </td>
                          <td className="py-3.5 px-4 text-center text-slate-300 font-medium">{entry.wins}</td>
                          <td className="py-3.5 px-4 text-right font-extrabold text-indigo-400">
                            {entry.score.toLocaleString()} pts
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-xs text-slate-500 text-center py-8">No leaderboard data recorded yet.</p>
              )}
            </div>
          )}

          {/* TAB 4: RATINGS & REVIEWS */}
          {activeTab === 'reviews' && (
            <div className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-slate-950/50 p-6 rounded-2xl border border-slate-800 items-center">
                <div className="text-center md:border-r border-slate-800 pr-4">
                  <div className="text-5xl font-extrabold text-white mb-1">{game.rating}</div>
                  <div className="text-amber-400 text-lg mb-1">⭐⭐⭐⭐⭐</div>
                  <div className="text-xs text-slate-400">Based on {game.totalReviews} ratings</div>
                </div>

                <div className="md:col-span-2 space-y-2">
                  {[
                    { stars: 5, pct: '85%' },
                    { stars: 4, pct: '10%' },
                    { stars: 3, pct: '3%' },
                    { stars: 2, pct: '1%' },
                    { stars: 1, pct: '1%' },
                  ].map((row) => (
                    <div key={row.stars} className="flex items-center gap-3 text-xs text-slate-400">
                      <span className="w-12">{row.stars} Stars</span>
                      <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full bg-amber-400 rounded-full" style={{ width: row.pct }}></div>
                      </div>
                      <span className="w-10 text-right">{row.pct}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Add Review Form */}
              <div className="bg-slate-950/80 p-6 rounded-2xl border border-slate-800">
                <h3 className="text-base font-bold text-white mb-4">Leave a Rating & Review</h3>

                {reviewSubmitted && (
                  <div className="mb-4 p-3 rounded-xl bg-emerald-500/20 text-emerald-300 text-xs font-semibold border border-emerald-500/30">
                    🎉 Thank you! Your review has been added.
                  </div>
                )}

                <form onSubmit={handleAddReview} className="space-y-4">
                  <div>
                    <label className="block text-xs text-slate-400 mb-1.5 font-medium">Your Rating</label>
                    <div className="flex gap-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setUserRating(star)}
                          className={`text-2xl transition-transform transform active:scale-125 ${
                            star <= userRating ? 'opacity-100 scale-105' : 'opacity-30 grayscale'
                          }`}
                        >
                          ⭐
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs text-slate-400 mb-1.5 font-medium">Your Feedback</label>
                    <textarea
                      rows={3}
                      value={userComment}
                      onChange={(e) => setUserComment(e.target.value)}
                      placeholder="Share your experience with other players..."
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl text-sm transition-all shadow-md hover:shadow-indigo-500/25 active:scale-95"
                  >
                    Submit Review
                  </button>
                </form>
              </div>

              {/* Reviews Feed List */}
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-white">Community Reviews</h3>
                <div className="space-y-3">
                  {reviewsList.map((rev) => (
                    <div
                      key={rev.id}
                      className="bg-slate-950/40 p-5 rounded-2xl border border-slate-800/80 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <span className="text-xl">{rev.avatar || '😎'}</span>
                          <span className="font-semibold text-sm text-slate-200">{rev.user}</span>
                        </div>
                        <span className="text-xs text-slate-500">{rev.date || 'Recently'}</span>
                      </div>
                      <div className="text-xs text-amber-400">{'⭐'.repeat(rev.rating)}</div>
                      <p className="text-sm text-slate-300 leading-relaxed">{rev.comment}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}