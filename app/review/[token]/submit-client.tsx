'use client'

import { useState } from 'react'
import { ClipboardCheck, Check, ExternalLink } from 'lucide-react'

interface Review {
  id: string
  title: string
  brief: string | null
  review_token: string
  status: string
  feedback: string | null
  submission_url: string | null
}

export default function ReviewSubmitClient({ review: initial }: { review: Review }) {
  const [review, setReview] = useState(initial)
  const [url, setUrl] = useState('')
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const alreadySubmitted = review.status !== 'pending'

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!url.trim()) return
    setSubmitting(true)
    setError(null)
    const res = await fetch(`/api/content-reviews/${review.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'submit',
        review_token: review.review_token,
        submission_url: url.trim(),
        submission_notes: notes.trim() || null,
      }),
    })
    if (res.ok) {
      setReview(await res.json())
    } else {
      const d = await res.json()
      setError(d.error ?? 'Something went wrong')
    }
    setSubmitting(false)
  }

  const statusMsg: Record<string, { title: string; body: string; color: string }> = {
    submitted: { title: 'Submitted — awaiting review', body: 'Your content has been received. The brand will review it shortly.', color: 'text-amber-400' },
    approved: { title: 'Approved!', body: review.feedback ? `Feedback: "${review.feedback}"` : 'Your content has been approved. Go ahead and post it!', color: 'text-green-400' },
    changes_requested: { title: 'Changes requested', body: review.feedback ?? 'The brand has requested changes. Please revise and resubmit.', color: 'text-red-400' },
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-lg">
        <div className="flex items-center gap-2 mb-6">
          <ClipboardCheck size={20} className="text-brand" />
          <span className="font-bold text-foreground">influencr</span>
          <span className="text-muted-foreground/50 text-sm">· Content Review</span>
        </div>

        <div className="bg-card border border-border rounded-xl p-6">
          <h1 className="text-xl font-bold text-foreground mb-1">{review.title}</h1>

          {review.brief && (
            <div className="mt-4 p-4 bg-muted/50 rounded-lg">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Brief</p>
              <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap">{review.brief}</p>
            </div>
          )}

          {alreadySubmitted && statusMsg[review.status] ? (
            <div className="mt-5">
              <div className={`text-base font-semibold mb-1 ${statusMsg[review.status].color}`}>
                {statusMsg[review.status].title}
              </div>
              <p className="text-sm text-muted-foreground">{statusMsg[review.status].body}</p>
              {review.submission_url && (
                <a href={review.submission_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 mt-3 text-sm text-brand hover:underline">
                  <ExternalLink size={13} />
                  Your submitted link
                </a>
              )}
              {review.status === 'changes_requested' && (
                <button
                  className="mt-4 text-sm font-medium text-brand hover:underline"
                  onClick={() => setReview(r => ({ ...r, status: 'pending' }))}
                >
                  Submit a revised version →
                </button>
              )}
            </div>
          ) : (
            <form onSubmit={submit} className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Content URL <span className="text-red-400">*</span></label>
                <input
                  value={url}
                  onChange={e => setUrl(e.target.value)}
                  placeholder="https://drive.google.com/… or Dropbox, Frame.io, etc."
                  required
                  type="url"
                  className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-background text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-foreground/20"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Notes (optional)</label>
                <textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Any context for the brand reviewer…"
                  rows={3}
                  className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-background text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-foreground/20 resize-none"
                />
              </div>
              {error && <p className="text-sm text-red-400">{error}</p>}
              <button
                type="submit"
                disabled={submitting || !url.trim()}
                className="w-full py-2.5 bg-foreground/90 text-background rounded-lg text-sm font-medium hover:bg-foreground disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
              >
                {submitting ? 'Submitting…' : <><Check size={14} /> Submit for review</>}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
