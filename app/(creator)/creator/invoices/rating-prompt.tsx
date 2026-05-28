'use client'

import { useState, useCallback } from 'react'
import type { CreatorInvoice } from './page'

export function RatingPrompt({ invoice, onDone }: { invoice: CreatorInvoice; onDone: () => void }) {
  const [rating, setRating] = useState<number | null>(null)
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)

  const handleSave = useCallback(async () => {
    setSaving(true)
    try {
      await fetch(`/api/creator-invoices/${invoice.pay_token}/notes`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brand_rating: rating, brand_notes: notes }),
      })
    } finally {
      setSaving(false)
      onDone()
    }
  }, [invoice.pay_token, rating, notes, onDone])

  return (
    <tr>
      <td colSpan={6} className="px-5 py-4 bg-muted/40 border-b border-border">
        <div className="space-y-3">
          <p className="text-sm font-medium text-foreground">
            How was working with {invoice.brand_name}? Rate them:
          </p>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map(star => (
              <button
                key={star}
                onClick={() => setRating(star)}
                className={`text-xl transition-colors ${rating !== null && star <= rating ? 'text-amber-400' : 'text-muted-foreground/30 hover:text-amber-300'}`}
              >
                ★
              </button>
            ))}
          </div>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Fast payer, great brief…"
            rows={2}
            className="w-full max-w-md text-sm border border-border rounded-lg px-3 py-2 bg-background resize-none focus:outline-none focus:ring-2 focus:ring-foreground/20"
          />
          <div className="flex items-center gap-4">
            <button
              onClick={handleSave}
              disabled={saving}
              className="text-sm font-semibold bg-foreground/90 text-background px-4 py-1.5 rounded-lg hover:bg-foreground transition-colors disabled:opacity-50"
            >
              {saving ? 'Saving…' : 'Save notes'}
            </button>
            <button
              onClick={onDone}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Skip
            </button>
          </div>
        </div>
      </td>
    </tr>
  )
}
