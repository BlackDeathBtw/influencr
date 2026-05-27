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
  canceled: { label: 'Canceled', color: 'bg-muted text-muted-foreground' },
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
    <div className="bg-card border border-border rounded-xl p-6">
      <h2 className="font-semibold text-foreground mb-4">Billing</h2>

      <div className="flex items-center justify-between py-3 border-b border-border">
        <span className="text-sm text-muted-foreground">Current plan</span>
        <span className="text-sm font-medium text-foreground">
          {isActive ? 'influencr — $19/mo' : 'No active plan'}
        </span>
      </div>

      <div className="flex items-center justify-between py-3 border-b border-border">
        <span className="text-sm text-muted-foreground">Status</span>
        <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${statusInfo.color}`}>
          {statusInfo.label}
        </span>
      </div>

      {subscription?.current_period_end && (
        <div className="flex items-center justify-between py-3 border-b border-border">
          <span className="text-sm text-muted-foreground">
            {status === 'trialing' ? 'Trial ends' : 'Renews'}
          </span>
          <span className="text-sm text-foreground/80">
            {new Date(subscription.current_period_end).toLocaleDateString('en-US', {
              month: 'long', day: 'numeric', year: 'numeric',
            })}
            {' '}
            <span className="text-muted-foreground/70">
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
            className="w-full bg-foreground/90 text-background py-2.5 rounded-lg text-sm font-medium hover:bg-foreground transition-colors disabled:opacity-50"
          >
            {loading ? 'Loading…' : 'Subscribe — $19/mo'}
          </button>
        ) : (
          <button
            onClick={handlePortal}
            disabled={loading}
            className="w-full border border-border text-foreground/80 py-2.5 rounded-lg text-sm font-medium hover:bg-background transition-colors disabled:opacity-50"
          >
            {loading ? 'Loading…' : 'Manage billing'}
          </button>
        )}
        <p className="text-xs text-muted-foreground/70 text-center mt-3">
          Secure payments via Stripe. Cancel anytime.
        </p>
      </div>
    </div>
  )
}
