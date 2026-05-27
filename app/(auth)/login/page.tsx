'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div className="w-full max-w-sm">
      <div className="bg-card rounded-2xl p-8 shadow-xl shadow-black/20">
        <h1 className="font-display text-2xl font-bold text-foreground mb-1">Welcome back</h1>
        <p className="text-sm text-muted-foreground mb-7">Sign in to your account</p>

        {error && (
          <div className="mb-5 p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-600">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-foreground/80 mb-1.5">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="you@example.com"
              autoComplete="email"
              className="w-full px-3 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent transition-shadow"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-foreground/80 mb-1.5">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              autoComplete="current-password"
              className="w-full px-3 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent transition-shadow"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-brand text-brand-foreground py-2.5 rounded-lg text-sm font-bold hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        <div className="mt-6 pt-6 border-t border-border">
          <Link
            href="/api/demo"
            className="block w-full text-center py-2.5 rounded-lg text-sm font-medium border border-border text-foreground/60 hover:bg-muted transition-colors"
          >
            Try demo — no account needed
          </Link>
        </div>

        <p className="mt-5 text-center text-sm text-muted-foreground">
          No account?{' '}
          <Link href="/signup" className="font-semibold text-foreground hover:underline">
            Sign up free
          </Link>
        </p>
      </div>
    </div>
  )
}
