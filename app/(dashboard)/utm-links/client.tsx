'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Copy, Check, Plus, Trash2 } from 'lucide-react'
import type { UTMLink } from '@/types/utm'

interface Props {
  links: UTMLink[]
  influencers: { id: string; name: string }[]
  campaigns: { id: string; name: string }[]
}

export default function UTMLinksClient({ links, influencers, campaigns }: Props) {
  const router = useRouter()
  const [showForm, setShowForm] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const [form, setForm] = useState({
    influencer_id: '',
    campaign_id: '',
    destination: '',
    promo_code: '',
  })

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.influencer_id || !form.destination) return
    setSubmitting(true)
    try {
      const res = await fetch('/api/utm-links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          influencer_id: form.influencer_id,
          campaign_id: form.campaign_id || null,
          destination: form.destination,
          promo_code: form.promo_code || null,
        }),
      })
      if (res.ok) {
        setForm({ influencer_id: '', campaign_id: '', destination: '', promo_code: '' })
        setShowForm(false)
        router.refresh()
      }
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm('Delete this link? This cannot be undone.')) return
    await fetch(`/api/utm-links/${id}`, { method: 'DELETE' })
    router.refresh()
  }

  function handleCopy(slug: string, id: string) {
    navigator.clipboard.writeText(`https://app.influencr.co/r/${slug}`)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">UTM Links</h1>
          <p className="text-sm text-muted-foreground mt-1">Track clicks per creator</p>
        </div>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 bg-foreground/90 text-background px-4 py-2 rounded-lg text-sm font-medium hover:bg-foreground transition-colors"
          >
            <Plus size={15} /> New link
          </button>
        )}
      </div>

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="bg-card border border-border rounded-xl p-5 mb-6"
        >
          <h2 className="text-sm font-semibold text-foreground mb-4">Generate new link</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                Creator <span className="text-red-400">*</span>
              </label>
              <select
                name="influencer_id"
                value={form.influencer_id}
                onChange={handleChange}
                required
                className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-foreground/30"
              >
                <option value="">Select creator…</option>
                {influencers.map(inf => (
                  <option key={inf.id} value={inf.id}>{inf.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                Campaign
              </label>
              <select
                name="campaign_id"
                value={form.campaign_id}
                onChange={handleChange}
                className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-foreground/30"
              >
                <option value="">No campaign</option>
                {campaigns.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                Destination URL <span className="text-red-400">*</span>
              </label>
              <input
                type="url"
                name="destination"
                value={form.destination}
                onChange={handleChange}
                required
                placeholder="https://yoursite.com/product"
                className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-foreground/30"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                Promo Code
              </label>
              <input
                type="text"
                name="promo_code"
                value={form.promo_code}
                onChange={handleChange}
                placeholder="CREATOR10"
                className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-foreground/30"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="submit"
              disabled={submitting}
              className="bg-foreground/90 text-background px-4 py-2 rounded-lg text-sm font-medium hover:bg-foreground transition-colors disabled:opacity-50"
            >
              {submitting ? 'Generating…' : 'Generate link'}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowForm(false)
                setForm({ influencer_id: '', campaign_id: '', destination: '', promo_code: '' })
              }}
              className="px-4 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        {links.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-muted-foreground/70 text-sm mb-4">No links yet. Generate your first link to start tracking clicks.</p>
            {!showForm && (
              <button
                onClick={() => setShowForm(true)}
                className="inline-flex items-center gap-2 bg-foreground/90 text-background px-4 py-2 rounded-lg text-sm font-medium hover:bg-foreground transition-colors"
              >
                <Plus size={15} /> New link
              </button>
            )}
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b border-border">
              <tr>
                {['Creator', 'Campaign', 'Short URL', 'Promo Code', 'Clicks', 'Created', ''].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {links.map(link => (
                <tr key={link.id} className="hover:bg-muted/30">
                  <td className="px-4 py-3">
                    <p className="font-medium text-foreground">{link.influencer?.name ?? '—'}</p>
                    {link.influencer?.handle && (
                      <p className="text-xs text-muted-foreground/70">@{link.influencer.handle}</p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {link.campaign?.name ?? <span className="text-muted-foreground/50">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="text-foreground/80 font-mono text-xs">/r/{link.slug}</span>
                      <button
                        onClick={() => handleCopy(link.slug, link.id)}
                        className="text-muted-foreground hover:text-foreground transition-colors"
                        title="Copy link"
                      >
                        {copiedId === link.id ? (
                          <Check size={13} className="text-green-400" />
                        ) : (
                          <Copy size={13} />
                        )}
                      </button>
                      {copiedId === link.id && (
                        <span className="text-xs text-green-400">Copied!</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {link.promo_code ? (
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-amber-500/15 text-amber-400">
                        {link.promo_code}
                      </span>
                    ) : (
                      <span className="text-muted-foreground/50">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-foreground/80 font-medium">{link.clicks.toLocaleString()}</span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {new Date(link.created_at).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => handleDelete(link.id)}
                      className="text-muted-foreground/50 hover:text-red-400 transition-colors"
                      title="Delete link"
                    >
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
