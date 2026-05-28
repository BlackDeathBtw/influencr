'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ClipboardCheck, Plus, ExternalLink, Check, MessageSquare, Clock, X, Copy } from 'lucide-react'

interface Review {
  id: string
  title: string
  brief: string | null
  submission_url: string | null
  submission_notes: string | null
  review_token: string
  status: string
  feedback: string | null
  submitted_at: string | null
  reviewed_at: string | null
  created_at: string
  influencer?: { name: string } | null
  campaign?: { name: string } | null
}

interface Campaign { id: string; name: string }
interface Influencer { id: string; name: string }

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  pending: { label: 'Awaiting submission', color: 'bg-muted text-muted-foreground' },
  submitted: { label: 'Submitted — review needed', color: 'bg-amber-500/15 text-amber-400' },
  approved: { label: 'Approved', color: 'bg-green-500/15 text-green-400' },
  changes_requested: { label: 'Changes requested', color: 'bg-red-500/15 text-red-400' },
}

function ReviewCard({ review, onAction }: {
  review: Review
  onAction: (id: string, action: 'approve' | 'request_changes', feedback?: string) => Promise<void>
}) {
  const [expanded, setExpanded] = useState(false)
  const [feedback, setFeedback] = useState('')
  const [acting, setActing] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const link = `${typeof window !== 'undefined' ? window.location.origin : ''}/review/${review.review_token}`

  function copyLink() {
    navigator.clipboard.writeText(link)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  async function act(action: 'approve' | 'request_changes') {
    setActing(action)
    await onAction(review.id, action, feedback || undefined)
    setActing(null)
    setExpanded(false)
    setFeedback('')
  }

  const cfg = STATUS_CONFIG[review.status] ?? STATUS_CONFIG.pending

  return (
    <div className="bg-card border border-border rounded-xl p-5">
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-foreground truncate">{review.title}</h3>
          <div className="flex flex-wrap items-center gap-2 mt-1">
            {review.campaign && <span className="text-xs text-muted-foreground">{review.campaign.name}</span>}
            {review.influencer && <span className="text-xs text-muted-foreground">· {review.influencer.name}</span>}
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${cfg.color}`}>{cfg.label}</span>
          </div>
        </div>
        <button
          onClick={copyLink}
          className="flex items-center gap-1.5 text-xs px-3 py-1.5 border border-border rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors shrink-0"
        >
          {copied ? <Check size={12} /> : <Copy size={12} />}
          {copied ? 'Copied' : 'Copy link'}
        </button>
      </div>

      {review.brief && (
        <p className="text-sm text-foreground/70 leading-relaxed mb-3 whitespace-pre-wrap border-l-2 border-border pl-3">{review.brief}</p>
      )}

      {review.submission_url && (
        <div className="bg-muted/50 rounded-lg p-3 mb-3">
          <p className="text-xs font-medium text-muted-foreground mb-1">Creator submission</p>
          <a
            href={review.submission_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-sm text-brand hover:underline"
          >
            <ExternalLink size={13} />
            View content
          </a>
          {review.submission_notes && (
            <p className="text-xs text-muted-foreground mt-2 leading-relaxed">{review.submission_notes}</p>
          )}
        </div>
      )}

      {review.feedback && (
        <div className="bg-muted/30 rounded-lg p-3 mb-3">
          <p className="text-xs font-medium text-muted-foreground mb-1">Feedback</p>
          <p className="text-sm text-foreground/80">{review.feedback}</p>
        </div>
      )}

      {review.status === 'submitted' && (
        <div>
          {expanded ? (
            <div className="space-y-2">
              <textarea
                value={feedback}
                onChange={e => setFeedback(e.target.value)}
                placeholder="Optional feedback or notes…"
                rows={2}
                className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-background text-foreground placeholder:text-muted-foreground/50 focus:outline-none resize-none"
              />
              <div className="flex items-center gap-2">
                <button
                  onClick={() => act('approve')}
                  disabled={acting !== null}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-green-500/15 text-green-400 hover:bg-green-500/25 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                >
                  <Check size={13} />
                  {acting === 'approve' ? 'Approving…' : 'Approve'}
                </button>
                <button
                  onClick={() => act('request_changes')}
                  disabled={acting !== null}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/15 text-red-400 hover:bg-red-500/25 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                >
                  <MessageSquare size={13} />
                  {acting === 'request_changes' ? 'Sending…' : 'Request changes'}
                </button>
                <button onClick={() => setExpanded(false)} className="px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground">
                  <X size={13} />
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setExpanded(true)}
              className="text-sm font-medium text-brand hover:underline"
            >
              Review submission →
            </button>
          )}
        </div>
      )}
    </div>
  )
}

export default function ContentReviewsClient({ reviews: initial, campaigns, influencers }: {
  reviews: Review[]
  campaigns: Campaign[]
  influencers: Influencer[]
}) {
  const router = useRouter()
  const [reviews, setReviews] = useState<Review[]>(initial)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ title: '', brief: '', campaign_id: '', influencer_id: '' })
  const [creating, setCreating] = useState(false)

  async function create(e: React.FormEvent) {
    e.preventDefault()
    if (!form.title.trim()) return
    setCreating(true)
    const res = await fetch('/api/content-reviews', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    if (res.ok) {
      const newReview = await res.json()
      setReviews(prev => [newReview, ...prev])
      setForm({ title: '', brief: '', campaign_id: '', influencer_id: '' })
      setShowForm(false)
    }
    setCreating(false)
  }

  async function handleAction(id: string, action: 'approve' | 'request_changes', feedback?: string) {
    const res = await fetch(`/api/content-reviews/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, feedback }),
    })
    if (res.ok) {
      const updated = await res.json()
      setReviews(prev => prev.map(r => r.id === id ? { ...r, ...updated } : r))
    }
  }

  return (
    <div className="p-8 max-w-3xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <ClipboardCheck size={22} className="text-brand" />
            Content Reviews
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Share a link with creators to collect and review content drafts</p>
        </div>
        <button
          onClick={() => setShowForm(v => !v)}
          className="flex items-center gap-2 bg-foreground/90 text-background px-4 py-2 rounded-lg text-sm font-medium hover:bg-foreground transition-colors"
        >
          <Plus size={15} />
          New review
        </button>
      </div>

      {showForm && (
        <form onSubmit={create} className="bg-card border border-border rounded-xl p-5 mb-6 space-y-4">
          <h2 className="font-semibold text-foreground">New content review</h2>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Title</label>
            <input
              value={form.title}
              onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
              placeholder="e.g. Nike Summer Reel Draft"
              required
              className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-background text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-foreground/20"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Brief / Instructions (optional)</label>
            <textarea
              value={form.brief}
              onChange={e => setForm(p => ({ ...p, brief: e.target.value }))}
              placeholder="What should the creator include? Any dos/don'ts, required mentions, etc."
              rows={3}
              className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-background text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-foreground/20 resize-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Campaign (optional)</label>
              <select
                value={form.campaign_id}
                onChange={e => setForm(p => ({ ...p, campaign_id: e.target.value }))}
                className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-foreground/20"
              >
                <option value="">None</option>
                {campaigns.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Creator (optional)</label>
              <select
                value={form.influencer_id}
                onChange={e => setForm(p => ({ ...p, influencer_id: e.target.value }))}
                className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-foreground/20"
              >
                <option value="">None</option>
                {influencers.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
              </select>
            </div>
          </div>
          <div className="flex gap-2 pt-1">
            <button type="submit" disabled={creating} className="px-4 py-2 bg-foreground/90 text-background rounded-lg text-sm font-medium hover:bg-foreground disabled:opacity-50 transition-colors">
              {creating ? 'Creating…' : 'Create & get link'}
            </button>
            <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 border border-border rounded-lg text-sm text-muted-foreground hover:bg-muted transition-colors">
              Cancel
            </button>
          </div>
        </form>
      )}

      {reviews.length === 0 ? (
        <div className="text-center py-16 bg-card border border-border rounded-xl">
          <ClipboardCheck size={32} className="text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground/70 text-sm">No content reviews yet</p>
          <p className="text-xs text-muted-foreground/50 mt-1">Create one and share the link with a creator</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map(r => (
            <ReviewCard key={r.id} review={r} onAction={handleAction} />
          ))}
        </div>
      )}
    </div>
  )
}
