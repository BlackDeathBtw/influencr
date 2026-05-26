'use client'

import { useState } from 'react'
import { formatDistanceToNow } from 'date-fns'
import type { Subscription } from '@/types'

interface Props {
  subscription: Subscription | null
  userEmail: string
}

const statusLabels: Record<string, { label: string; color: string }> = {
  trialing: { label: 'Free trial', color: 'bg-blue-100 text-blue-700' },
  active: { label: 'Active', color: 'bg-green-100 text-green-700' },
  past_due: { label: 'Past due', color: 'bg-red-100 text-red-700' },
  canceled: { label: 'Canceled', color: 'bg-zinc-100 text-zinc-500' },
  incomplete: { label: 'Incomplete', color: 'bg-amber-100 text-amber-700' },
}

export default function BillingSection({ subscription, userEmail }: Props) {
  const [loading, setLoading] = useState(false)

  async function handleSubscribe() {
    setLoading(true)
    const res = await fetch('/api/stripe/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: userEmail }),
    })
    const { url } = await res.json()
    if (url) window.location.href = url
    setLoading(false)
  }

  async function handlePortal() {
    setLoading(true)
    const res = await fetch('/api/stripe/portal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    })
    const { url } = await res.json()
    if (url) window.location.href = url
    setLoading(false)
  }

  const status = subscription?.status ?? 'trialing'
  const statusInfo = statusLabels[status] ?? statusLabels.trialing
  const isActive = status === 'active' || status === 'trialing'

  return (
    <div className="bg-white border border-zinc-200 rounded-xl p-6">
      <h2 className="font-semibold text-zinc-900 mb-4">Billing</h2>

      <div className="flex items-center justify-between py-3 border-b border-zinc-100">
        <span className="text-sm text-zinc-600">Current plan</span>
        <span className="text-sm font-medium text-zinc-900">
          {isActive ? 'influencr — $19/mo' : 'No active plan'}
        </span>
      </div>

      <div className="flex items-center justify-between py-3 border-b border-zinc-100">
        <span className="text-sm text-zinc-600">Status</span>
        <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${statusInfo.color}`}>
          {statusInfo.label}
        </span>
      </div>

      {subscription?.current_period_end && (
        <div className="flex items-center justify-between py-3 border-b border-zinc-100">
          <span className="text-sm text-zinc-600">
            {status === 'trialing' ? 'Trial ends' : 'Renews'}
          </span>
          <span className="text-sm text-zinc-700">
            {new Date(subscription.current_period_end).toLocaleDateString('en-US', {
              month: 'long', day: 'numeric', year: 'numeric',
            })}
            {' '}
            <span className="text-zinc-400">
              ({formatDistanceToNow(new Date(subscription.current_period_end), { addSuffix: true })})
            </span>
          </span>
        </div>
      )}

      <div className="mt-5">
        {!subscription || status === 'canceled' || status === 'incomplete' ? (
          <button
            onClick={handleSubscribe}
            disabled={loading}
            className="w-full bg-zinc-900 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-zinc-700 transition-colors disabled:opacity-50"
          >
            {loading ? 'Loading…' : 'Subscribe — $19/mo'}
          </button>
        ) : (
          <button
            onClick={handlePortal}
            disabled={loading}
            className="w-full border border-zinc-200 text-zinc-700 py-2.5 rounded-lg text-sm font-medium hover:bg-zinc-50 transition-colors disabled:opacity-50"
          >
            {loading ? 'Loading…' : 'Manage billing'}
          </button>
        )}
        <p className="text-xs text-zinc-400 text-center mt-3">
          Secure payments via Stripe. Cancel anytime.
        </p>
      </div>
    </div>
  )
}
