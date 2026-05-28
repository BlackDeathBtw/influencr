'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ClipboardList, Copy, Check, Trash2, ExternalLink } from 'lucide-react'

interface SimpleCampaign { id: string; name: string }

interface Brief {
  id: string
  title: string
  campaign_id: string | null
  share_token: string
  created_at: string
  campaign?: { name: string } | null
}

interface Props {
  campaigns: SimpleCampaign[]
  briefs: Brief[]
}

const APP_URL = 'https://influencr-five.vercel.app'

export default function BriefBuilderClient({ campaigns, briefs: initialBriefs }: Props) {
  const router = useRouter()
  const [briefs, setBriefs] = useState(initialBriefs)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [successToken, setSuccessToken] = useState<string | null>(null)
  const [form, setForm] = useState({
    title: '',
    campaign_id: '',
    objective: '',
    target_audience: '',
    key_messages: '',
    dos: '',
    donts: '',
    deliverables: '',
    deadline: '',
    compensation: '',
  })

  function set(field: string, value: string) {
    setForm(f => ({ ...f, [field]: value }))
  }

  function shareUrl(token: string) {
    return `${APP_URL}/brief/${token}`
  }

  function copyLink(token: string, id: string) {
    navigator.clipboard.writeText(shareUrl(token))
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  async function remove(id: string) {
    if (!confirm('Delete this brief?')) return
    await fetch(`/api/campaign-briefs/${id}`, { method: 'DELETE' })
    setBriefs(bs => bs.filter(b => b.id !== id))
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.title.trim()) return
    setSaving(true)
    setSuccessToken(null)

    const res = await fetch('/api/campaign-briefs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: form.title,
        campaign_id: form.campaign_id || null,
        objective: form.objective || null,
        target_audience: form.target_audience || null,
        key_messages: form.key_messages || null,
        dos: form.dos || null,
        donts: form.donts || null,
        deliverables: form.deliverables || null,
        deadline: form.deadline || null,
        compensation: form.compensation || null,
      }),
    })

    if (res.ok) {
      const created: Brief = await res.json()
      setBriefs(bs => [created, ...bs])
      setSuccessToken(created.share_token)
      setForm({
        title: '', campaign_id: '', objective: '', target_audience: '',
        key_messages: '', dos: '', donts: '', deliverables: '', deadline: '', compensation: '',
      })
      router.refresh()
    }

    setSaving(false)
  }

  return (
    <div className="p-8 max-w-3xl">
      {/* Existing Briefs */}
      <div className="mb-10">
        <h2 className="text-lg font-semibold text-foreground mb-4">Your Briefs</h2>
        {briefs.length === 0 ? (
          <div className="bg-card border border-border rounded-xl py-10 text-center">
            <ClipboardList size={24} className="mx-auto mb-2 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground/70">No briefs yet — create one below</p>
          </div>
        ) : (
          <div className="bg-card border border-border rounded-xl divide-y divide-border">
            {briefs.map(b => (
              <div key={b.id} className="flex items-center gap-4 px-5 py-4">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground text-sm truncate">{b.title}</p>
                  <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground/70">
                    {b.campaign?.name && <span>{b.campaign.name}</span>}
                    {b.campaign?.name && <span>·</span>}
                    <span>
                      {new Date(b.created_at).toLocaleDateString('en-US', {
                        month: 'short', day: 'numeric', year: 'numeric',
                      })}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <a
                    href={shareUrl(b.share_token)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 text-muted-foreground/70 hover:text-foreground/80 transition-colors"
                    title="Open brief"
                  >
                    <ExternalLink size={13} />
                  </a>
                  <button
                    onClick={() => copyLink(b.share_token, b.id)}
                    className="p-1.5 text-muted-foreground/70 hover:text-foreground/80 transition-colors"
                    title={copiedId === b.id ? 'Copied!' : 'Copy share link'}
                  >
                    {copiedId === b.id
                      ? <Check size={13} className="text-green-500" />
                      : <Copy size={13} />
                    }
                  </button>
                  <button
                    onClick={() => remove(b.id)}
                    className="p-1.5 text-muted-foreground/70 hover:text-red-500 transition-colors"
                    title="Delete"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create New Brief */}
      <div>
        <h2 className="text-lg font-semibold text-foreground mb-4">Create New Brief</h2>
        {successToken && (
          <div className="mb-5 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-xl p-4">
            <p className="text-sm font-medium text-green-700 dark:text-green-400 mb-2">Brief created!</p>
            <div className="flex items-center gap-2">
              <input
                readOnly
                value={shareUrl(successToken)}
                className="flex-1 text-xs bg-white dark:bg-background border border-green-300 dark:border-green-700 rounded-lg px-3 py-2 text-foreground/80 font-mono"
              />
              <button
                onClick={() => {
                  navigator.clipboard.writeText(shareUrl(successToken))
                  setCopiedId('success')
                  setTimeout(() => setCopiedId(null), 2000)
                }}
                className="flex items-center gap-1.5 text-xs bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700 transition-colors"
              >
                {copiedId === 'success' ? <Check size={12} /> : <Copy size={12} />}
                {copiedId === 'success' ? 'Copied!' : 'Copy'}
              </button>
            </div>
          </div>
        )}

        <form onSubmit={submit} className="bg-card border border-border rounded-xl p-6 space-y-5">
          {/* Title & Campaign */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                Title <span className="text-red-500">*</span>
              </label>
              <input
                required
                value={form.title}
                onChange={e => set('title', e.target.value)}
                placeholder="Spring Campaign Brief"
                className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-background text-foreground placeholder:text-muted-foreground/50"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                Campaign (optional)
              </label>
              <select
                value={form.campaign_id}
                onChange={e => set('campaign_id', e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-card text-foreground"
              >
                <option value="">— none —</option>
                {campaigns.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Objective */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Objective</label>
            <textarea
              value={form.objective}
              onChange={e => set('objective', e.target.value)}
              rows={3}
              placeholder="What is the goal of this campaign?"
              className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-background text-foreground placeholder:text-muted-foreground/50 resize-y"
            />
          </div>

          {/* Target Audience */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Target Audience</label>
            <textarea
              value={form.target_audience}
              onChange={e => set('target_audience', e.target.value)}
              rows={2}
              placeholder="Who are we trying to reach? Age, interests, demographics..."
              className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-background text-foreground placeholder:text-muted-foreground/50 resize-y"
            />
          </div>

          {/* Key Messages */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Key Messages</label>
            <textarea
              value={form.key_messages}
              onChange={e => set('key_messages', e.target.value)}
              rows={3}
              placeholder="What must the creator communicate? List your core talking points..."
              className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-background text-foreground placeholder:text-muted-foreground/50 resize-y"
            />
          </div>

          {/* Dos & Don'ts */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Dos</label>
              <textarea
                value={form.dos}
                onChange={e => set('dos', e.target.value)}
                rows={4}
                placeholder="- Show the product in natural light&#10;- Tag @brand in the post&#10;- Use #sponsored"
                className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-background text-foreground placeholder:text-muted-foreground/50 resize-y"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Don&apos;ts</label>
              <textarea
                value={form.donts}
                onChange={e => set('donts', e.target.value)}
                rows={4}
                placeholder="- Don't mention competitors&#10;- Avoid political topics&#10;- No unedited raw footage"
                className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-background text-foreground placeholder:text-muted-foreground/50 resize-y"
              />
            </div>
          </div>

          {/* Deliverables */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Deliverables</label>
            <textarea
              value={form.deliverables}
              onChange={e => set('deliverables', e.target.value)}
              rows={3}
              placeholder="1x Instagram Reel (60s), 3x Instagram Stories, 1x TikTok video..."
              className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-background text-foreground placeholder:text-muted-foreground/50 resize-y"
            />
          </div>

          {/* Deadline & Compensation */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Deadline</label>
              <input
                type="date"
                value={form.deadline}
                onChange={e => set('deadline', e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-background text-foreground"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Compensation</label>
              <input
                value={form.compensation}
                onChange={e => set('compensation', e.target.value)}
                placeholder="e.g. $500 flat fee + product gifting"
                className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-background text-foreground placeholder:text-muted-foreground/50"
              />
            </div>
          </div>

          <div className="pt-1">
            <button
              type="submit"
              disabled={!form.title.trim() || saving}
              className="bg-foreground/90 text-background px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-foreground transition-colors disabled:opacity-50"
            >
              {saving ? 'Creating…' : 'Create Brief'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
