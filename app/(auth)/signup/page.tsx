'use client'

import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

type AccountType = 'brand' | 'creator'

function SignupForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [accountType, setAccountType] = useState<AccountType>('brand')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    const type = searchParams.get('type')
    if (type === 'creator') setAccountType('creator')
  }, [searchParams])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const supabase = createClient()
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${location.origin}/auth/callback`,
        data: { account_type: accountType },
      },
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    setSuccess(true)
    setLoading(false)
  }

  if (success) {
    return (
      <div className="w-full max-w-sm">
        <div className="bg-card rounded-2xl p-8 shadow-xl shadow-black/20 text-center">
          <div className="w-12 h-12 bg-brand/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-brand" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="font-display text-xl font-bold text-foreground mb-2">Check your email</h2>
          <p className="text-sm text-muted-foreground">
            We sent a confirmation link to <strong>{email}</strong>. Click it to activate your account.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-sm">
      <div className="bg-card rounded-2xl p-8 shadow-xl shadow-black/20">
        {/* Account type toggle */}
        <div className="flex rounded-xl border border-border p-1 mb-7">
          <button
            type="button"
            onClick={() => setAccountType('brand')}
            className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${
              accountType === 'brand'
                ? 'bg-brand text-brand-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Brand · $19/mo
          </button>
          <button
            type="button"
            onClick={() => setAccountType('creator')}
            className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${
              accountType === 'creator'
                ? 'bg-foreground text-background shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Creator · Free
          </button>
        </div>

        <h1 className="font-display text-2xl font-bold text-foreground mb-1">
          {accountType === 'brand' ? 'Start your free trial' : 'Create your profile'}
        </h1>
        <p className="text-sm text-muted-foreground mb-7">
          {accountType === 'brand'
            ? '14-day free trial. No credit card required.'
            : 'Free forever. No credit card needed.'}
        </p>

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
              minLength={6}
              placeholder="Min. 6 characters"
              autoComplete="new-password"
              className="w-full px-3 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent transition-shadow"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className={`w-full py-2.5 rounded-lg text-sm font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
              accountType === 'brand'
                ? 'bg-brand text-brand-foreground hover:brightness-110'
                : 'bg-foreground text-background hover:bg-foreground/90'
            }`}
          >
            {loading ? 'Creating account...' : 'Create account'}
          </button>
        </form>

        <p className="mt-4 text-xs text-muted-foreground text-center">
          By signing up you agree to our Terms of Service.
        </p>

        <p className="mt-4 text-center text-sm text-muted-foreground">
          Already have an account?{' '}
          <Link href="/login" className="font-semibold text-foreground hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}

export default function SignupPage() {
  return (
    <Suspense
      fallback={
        <div className="w-full max-w-sm">
          <div className="bg-card rounded-2xl p-8 shadow-xl shadow-black/20 animate-pulse">
            <div className="h-10 bg-muted rounded-xl mb-7" />
            <div className="h-8 bg-muted rounded mb-2 w-48" />
            <div className="h-4 bg-muted rounded mb-7 w-64" />
            <div className="space-y-4">
              <div className="h-10 bg-muted rounded-lg" />
              <div className="h-10 bg-muted rounded-lg" />
              <div className="h-10 bg-muted rounded-lg" />
            </div>
          </div>
        </div>
      }
    >
      <SignupForm />
    </Suspense>
  )
}
