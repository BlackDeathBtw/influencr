'use client'

import { useState } from 'react'

interface PayButtonProps {
  token: string
  isPaid: boolean
}

export default function PayButton({ token, isPaid }: PayButtonProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (isPaid) {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1 rounded-full bg-green-100 text-green-700">
        <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
        Paid
      </span>
    )
  }

  async function handlePay() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/creator-invoices/${token}/checkout`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Something went wrong')
        return
      }
      window.location.href = data.url
    } catch {
      setError('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <button
        onClick={handlePay}
        disabled={loading}
        className="inline-flex items-center px-4 py-2 rounded-lg bg-foreground text-background text-sm font-semibold disabled:opacity-60"
      >
        {loading ? 'Redirecting…' : 'Pay now'}
      </button>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
}
