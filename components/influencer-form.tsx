'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { RefreshCw } from 'lucide-react'
import type { Influencer } from '@/types'

interface Props {
  influencer?: Influencer
}

const PLATFORMS = ['instagram', 'tiktok', 'youtube', 'twitter', 'linkedin', 'other']
const STATUSES = ['prospect', 'active', 'inactive']

export default function InfluencerForm({ influencer }: Props) {
  const router = useRouter()
  const isNew = !influencer

  const [form, setForm] = useState({
    name: influencer?.name ?? '',
    handle: influencer?.handle ?? '',
    platform: influencer?.platform ?? '',
    niche: influencer?.niche ?? '',
    followers: influencer?.followers?.toString() ?? '',
    engagement_rate: influencer?.engagement_rate?.toString() ?? '',
    contact_email: influencer?.contact_email ?? '',
    contact_name: influencer?.contact_name ?? '',
    notes: influencer?.notes ?? '',
    status: influencer?.status ?? 'prospect',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [syncing, setSyncing] = useState(false)
  const [syncMsg, setSyncMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)

  async function syncStats() {
    if (!form.handle) return
    setSyncing(true)
    setSyncMsg(null)
    try {
      let res: Response
      if (form.platform === 'youtube') {
        res = await fetch(`/api/integrations/youtube?handle=${encodeURIComponent(form.handle)}`)
      } else if (form.platform === 'instagram' || form.platform === 'tiktok') {
        res = await fetch(`/api/integrations/social-stats?platform=${form.platform}&handle=${encodeURIComponent(form.handle)}`)
      } else {
        setSyncMsg({ type: 'err', text: 'Stats sync supports YouTube, Instagram, and TikTok' })
        return
      }
      const data = await res.json()
      if (!res.ok) {
        setSyncMsg({ type: 'err', text: data.error ?? 'Sync failed' })
        return
      }
      setForm(f => ({
        ...f,
        followers: data.followers ? String(data.followers) : f.followers,
        name: data.name && !f.name ? data.name : f.name,
      }))
      setSyncMsg({ type: 'ok', text: `Synced: ${Number(data.followers).toLocaleString()} followers` })
    } finally {
      setSyncing(false)
    }
  }

  function set(key: string, value: string) {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const body = {
      ...form,
      followers: form.followers ? parseInt(form.followers) : null,
      engagement_rate: form.engagement_rate ? parseFloat(form.engagement_rate) : null,
      platform: form.platform || null,
      handle: form.handle || null,
      niche: form.niche || null,
      contact_email: form.contact_email || null,
      contact_name: form.contact_name || null,
      notes: form.notes || null,
    }

    const url = isNew ? '/api/influencers' : `/api/influencers/${influencer!.id}`
    const method = isNew ? 'POST' : 'PATCH'

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    if (!res.ok) {
      const { error } = await res.json()
      setError(error ?? 'Something went wrong')
      setLoading(false)
      return
    }

    router.push('/influencers')
    router.refresh()
  }

  async function handleDelete() {
    if (!confirm('Delete this influencer? This cannot be undone.')) return
    setLoading(true)
    await fetch(`/api/influencers/${influencer!.id}`, { method: 'DELETE' })
    router.push('/influencers')
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
      {error && (
        <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-600">{error}</div>
      )}

      <div className="bg-card border border-border rounded-xl p-6 space-y-4">
        <h2 className="font-semibold text-foreground">Basic info</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-foreground/80 mb-1.5">Name *</label>
            <input
              value={form.name}
              onChange={e => set('name', e.target.value)}
              required
              placeholder="Jane Doe"
              className="w-full px-3 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground/80 mb-1.5">Handle</label>
            <input
              value={form.handle}
              onChange={e => set('handle', e.target.value)}
              placeholder="@janedoe"
              className="w-full px-3 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground/80 mb-1.5">Platform</label>
            <select
              value={form.platform}
              onChange={e => set('platform', e.target.value)}
              className="w-full px-3 py-2.5 border border-border rounded-lg text-sm bg-card focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">Select platform</option>
              {PLATFORMS.map(p => (
                <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground/80 mb-1.5">Niche / Category</label>
            <input
              value={form.niche}
              onChange={e => set('niche', e.target.value)}
              placeholder="Fitness, Beauty, Tech…"
              className="w-full px-3 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-sm font-medium text-foreground/80">Followers</label>
              {(form.platform === 'youtube' || form.platform === 'instagram' || form.platform === 'tiktok') && form.handle && (
                <button
                  type="button"
                  onClick={syncStats}
                  disabled={syncing}
                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-brand transition-colors disabled:opacity-50"
                >
                  <RefreshCw size={11} className={syncing ? 'animate-spin' : ''} />
                  {syncing ? 'Syncing…' : 'Sync stats'}
                </button>
              )}
            </div>
            <input
              type="number"
              value={form.followers}
              onChange={e => set('followers', e.target.value)}
              placeholder="150000"
              min="0"
              className="w-full px-3 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
            {syncMsg && (
              <p className={`text-xs mt-1 ${syncMsg.type === 'ok' ? 'text-green-400' : 'text-red-400'}`}>{syncMsg.text}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground/80 mb-1.5">Engagement rate (%)</label>
            <input
              type="number"
              value={form.engagement_rate}
              onChange={e => set('engagement_rate', e.target.value)}
              placeholder="3.5"
              step="0.01"
              min="0"
              max="100"
              className="w-full px-3 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl p-6 space-y-4">
        <h2 className="font-semibold text-foreground">Contact</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-foreground/80 mb-1.5">Contact email</label>
            <input
              type="email"
              value={form.contact_email}
              onChange={e => set('contact_email', e.target.value)}
              placeholder="manager@example.com"
              className="w-full px-3 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground/80 mb-1.5">Contact name</label>
            <input
              value={form.contact_name}
              onChange={e => set('contact_name', e.target.value)}
              placeholder="Agent / manager name"
              className="w-full px-3 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl p-6 space-y-4">
        <h2 className="font-semibold text-foreground">Status & notes</h2>
        <div>
          <label className="block text-sm font-medium text-foreground/80 mb-1.5">Status</label>
          <select
            value={form.status}
            onChange={e => set('status', e.target.value)}
            className="w-full px-3 py-2.5 border border-border rounded-lg text-sm bg-card focus:outline-none focus:ring-2 focus:ring-ring"
          >
            {STATUSES.map(s => (
              <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground/80 mb-1.5">Notes</label>
          <textarea
            value={form.notes}
            onChange={e => set('notes', e.target.value)}
            rows={3}
            placeholder="Any notes about this influencer…"
            className="w-full px-3 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
          />
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex gap-3">
          <button
            type="submit"
            disabled={loading}
            className="bg-foreground/90 text-background px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-foreground transition-colors disabled:opacity-50"
          >
            {loading ? 'Saving…' : isNew ? 'Add influencer' : 'Save changes'}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="border border-border text-muted-foreground px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-background transition-colors"
          >
            Cancel
          </button>
        </div>
        {!isNew && (
          <button
            type="button"
            onClick={handleDelete}
            disabled={loading}
            className="text-sm text-red-500 hover:text-red-700 font-medium"
          >
            Delete influencer
          </button>
        )}
      </div>
    </form>
  )
}
