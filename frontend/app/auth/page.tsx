'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useDispatch } from 'react-redux'
import { useLoginMutation, useRegisterMutation } from '@/lib/service/authApi'
import { setCredentials } from '@/lib/features/authSlice'

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true)
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  })
  const [error, setError] = useState('')

  const router = useRouter()
  const dispatch = useDispatch()

  // RTK Query Mutation Hooks
  const [login, { isLoading: isLoginLoading }] = useLoginMutation()
  const [register, { isLoading: isRegisterLoading }] = useRegisterMutation()

  const isLoading = isLoginLoading || isRegisterLoading

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
    setError('')
  }

  const toggleAuthMode = (mode: boolean) => {
    setIsLogin(mode)
    setError('')
    setFormData({
      username: '',
      email: '',
      password: '',
      confirmPassword: ''
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // Front-end password validation for registration
    if (!isLogin && formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      return
    }

    try {
      let accessToken: string | undefined

      if (isLogin) {
        const res = await login({
          email: formData.email,
          password: formData.password,
        }).unwrap()
        accessToken = res?.accessToken
      } else {
        const res = await register({
          username: formData.username,
          email: formData.email,
          password: formData.password,
        }).unwrap()
        accessToken = res?.accessToken
      }

      // If token is returned (either from Login or Auto-Login Register)
      if (accessToken) {
        dispatch(setCredentials({ accessToken }))
      }

      // Redirect to homepage
      router.push('/')
    } catch (err: any) {
      console.error('Authentication Error:', err)

      // Dynamic error parsing for standard API errors and validation arrays
      const errorMessage =
        err?.data?.message ||
        err?.data?.error ||
        (Array.isArray(err?.data?.errors) ? err.data.errors[0]?.msg || err.data.errors[0]?.message : null) ||
        'An error occurred. Please check your credentials and try again.'

      setError(errorMessage)
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-bold text-xl tracking-tight text-indigo-400">
            <span className="text-2xl">🎮</span> Mini Arcade
          </Link>
          <Link 
            href="/"
            className="text-xs text-slate-400 hover:text-white transition-colors"
          >
            ← Back to Games
          </Link>
        </div>
      </header>

      {/* Auth Card Container */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-xl shadow-indigo-500/5 p-6 sm:p-8">
          
          {/* Header Title & Subtitle */}
          <div className="text-center mb-6">
            <h1 className="text-3xl font-extrabold text-white tracking-tight">
              {isLogin ? (
                <>Welcome <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-pink-400">Back</span></>
              ) : (
                <>Join <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-pink-400">Mini Arcade</span></>
              )}
            </h1>
            <p className="mt-2 text-sm text-slate-400">
              {isLogin
                ? 'Sign in to access your high scores and saved progress.'
                : 'Create an account to start tracking your achievements.'}
            </p>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="grid grid-cols-2 bg-slate-950 p-1 rounded-xl border border-slate-800 mb-6">
            <button
              type="button"
              onClick={() => toggleAuthMode(true)}
              className={`py-2 text-sm font-medium rounded-lg transition-all ${
                isLogin
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => toggleAuthMode(false)}
              className={`py-2 text-sm font-medium rounded-lg transition-all ${
                !isLogin
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Register
            </button>
          </div>

          {/* Error Message Display */}
          {error && (
            <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl text-xs text-center">
              {error}
            </div>
          )}

          {/* Auth Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Username
                </label>
                <input
                  type="text"
                  name="username"
                  required
                  placeholder="GamerTag99"
                  value={formData.username}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-sm"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Email Address
              </label>
              <input
                type="email"
                name="email"
                required
                placeholder="player@example.com"
                value={formData.email}
                onChange={handleInputChange}
                className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Password
              </label>
              <input
                type="password"
                name="password"
                required
                placeholder="••••••••"
                value={formData.password}
                onChange={handleInputChange}
                className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-sm"
              />
            </div>

            {!isLogin && (
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Confirm Password
                </label>
                <input
                  type="password"
                  name="confirmPassword"
                  required
                  placeholder="••••••••"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-sm"
                />
              </div>
            )}

            {isLogin && (
              <div className="flex justify-end">
                <a href="#" className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors">
                  Forgot Password?
                </a>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl text-sm transition-colors shadow-md shadow-indigo-600/20 disabled:opacity-50 disabled:cursor-not-allowed mt-2"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></span>
                  Processing...
                </span>
              ) : isLogin ? (
                'Sign In'
              ) : (
                'Create Account'
              )}
            </button>
          </form>

          {/* Toggle Helper Footer */}
          <div className="mt-6 text-center text-xs text-slate-400">
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <button
              type="button"
              onClick={() => toggleAuthMode(!isLogin)}
              className="text-indigo-400 font-semibold hover:underline"
            >
              {isLogin ? 'Register now' : 'Sign in'}
            </button>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-4 border-t border-slate-800 text-center text-xs text-slate-500">
        © {new Date().getFullYear()} Mini Arcade. All rights reserved.
      </footer>
    </div>
  )
}