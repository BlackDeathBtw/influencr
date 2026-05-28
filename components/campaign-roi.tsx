'use client'

import { useState } from 'react'
import { TrendingUp, Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react'

interface Influencer {
  id: string
  name: string
}

interface CampaignResult {
  id: string
  influencer_id: string | null
  influencer?: { name: string } | null
  views: number | null
  reach: number | null
  clicks: number | null
  conversions: number | null
  revenue_generated: number | null
  notes: string | null
  logged_at: string
}

interface Props {
  campaignId: string
  totalSpend: number
  estimatedReach: number
  revenueTarget: number | null
  revenueAttributed: number | null
  currency: string
  campaignInfluencers?: Influencer[]
  results?: CampaignResult[]
}

const emptyForm = {
  influencer_id: '',
  views: '',
  reach: '',
  clicks: '',
  conversions: '',
  revenue_generated: '',
  notes: '',
}

export default function CampaignROI({
  campaignId,
  totalSpend,
  estimatedReach,
  revenueTarget,
  revenueAttributed,
  currency,
  campaignInfluencers = [],
  results: initialResults = [],
}: Props) {
  const [target, setTarget] = useState(revenueTarget != null ? String(revenueTarget) : '')
  const [attributed, setAttributed] = useState(revenueAttributed != null ? String(revenueAttributed) : '')
  const [saving, setSaving] = useState(false)

  const [results, setResults] = useState<CampaignResult[]>(initialResults)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [submitting, setSubmitting] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [showResults, setShowResults] = useState(true)

  const attrNum = attributed !== '' ? Number(attributed) : null
  const roas = attrNum != null && totalSpend > 0 ? (attrNum / totalSpend).toFixed(2) : null
  const roi = attrNum != null && totalSpend > 0 ? (((attrNum - totalSpend) / totalSpend) * 100).toFixed(1) : null
  const cpr = estimatedReach > 0 && totalSpend > 0 ? (totalSpend / estimatedReach * 1000).toFixed(2) : null

  async function save() {
    setSaving(true)
    await fetch(`/api/campaigns/${campaignId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        revenue_target: target !== '' ? Number(target) : null,
        revenue_attributed: attributed !== '' ? Number(attributed) : null,
      }),
    })
    setSaving(false)
  }

  function setField(key: keyof typeof emptyForm, value: string) {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  async function submitResult() {
    setSubmitting(true)
    const payload: Record<string, unknown> = {
      campaign_id: campaignId,
      influencer_id: form.influencer_id || null,
      views: form.views !== '' ? Number(form.views) : null,
      reach: form.reach !== '' ? Number(form.reach) : null,
      clicks: form.clicks !== '' ? Number(form.clicks) : null,
      conversions: form.conversions !== '' ? Number(form.conversions) : null,
      revenue_generated: form.revenue_generated !== '' ? Number(form.revenue_generated) : null,
      notes: form.notes || null,
    }

    const res = await fetch('/api/campaign-results', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    if (res.ok) {
      const newRow: CampaignResult = await res.json()
      setResults(prev => [newRow, ...prev])
      setForm(emptyForm)
      setShowForm(false)
    }
    setSubmitting(false)
  }

  async function deleteResult(id: string) {
    setDeletingId(id)
    const res = await fetch(`/api/campaign-results?id=${id}`, { method: 'DELETE' })
    if (res.ok) {
      setResults(prev => prev.filter(r => r.id !== id))
    }
    setDeletingId(null)
    setConfirmDeleteId(null)
  }

  function fmt(n: number | null, prefix = '') {
    if (n == null) return '—'
    return `${prefix}${n.toLocaleString()}`
  }

  return (
    <div className="bg-card border border-border rounded-xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp size={15} className="text-brand" />
        <h2 className="font-semibold text-foreground">ROI & Performance</h2>
      </div>

      <div className="grid grid-cols-2 gap-2 mb-5">
        <div className="bg-muted rounded-lg p-3">
          <p className="text-xs text-muted-foreground mb-1">Total spend</p>
          <p className="text-sm font-bold text-foreground">{currency} {totalSpend.toLocaleString()}</p>
        </div>
        <div className="bg-muted rounded-lg p-3">
          <p className="text-xs text-muted-foreground mb-1">Est. reach</p>
          <p className="text-sm font-bold text-foreground">
            {estimatedReach > 0 ? `${(estimatedReach / 1000).toFixed(0)}K` : '—'}
          </p>
        </div>
        {cpr && (
          <div className="bg-muted rounded-lg p-3 col-span-2">
            <p className="text-xs text-muted-foreground mb-1">Cost per 1K reach</p>
            <p className="text-sm font-bold text-foreground">{currency} {cpr}</p>
          </div>
        )}
        {roas && (
          <div className="bg-brand/10 rounded-lg p-3">
            <p className="text-xs text-muted-foreground mb-1">ROAS</p>
            <p className="text-sm font-bold text-brand">{roas}×</p>
          </div>
        )}
        {roi && (
          <div className={`rounded-lg p-3 ${Number(roi) >= 0 ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
            <p className="text-xs text-muted-foreground mb-1">ROI</p>
            <p className={`text-sm font-bold ${Number(roi) >= 0 ? 'text-green-400' : 'text-red-400'}`}>{roi}%</p>
          </div>
        )}
      </div>

      <div className="space-y-3 mb-6">
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">Revenue target ({currency})</label>
          <input
            type="number"
            value={target}
            onChange={e => setTarget(e.target.value)}
            onBlur={save}
            placeholder="e.g. 10000"
            className="w-full px-3 py-2 bg-muted border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-brand/50"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">
            Revenue attributed ({currency})
            <span className="ml-1 text-muted-foreground/50 font-normal">— actual revenue from this campaign</span>
          </label>
          <input
            type="number"
            value={attributed}
            onChange={e => setAttributed(e.target.value)}
            onBlur={save}
            placeholder="Track via promo codes or UTMs"
            className="w-full px-3 py-2 bg-muted border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-brand/50"
          />
        </div>
        {saving && <p className="text-xs text-muted-foreground/50">Saving…</p>}
      </div>

      <div className="border-t border-border pt-4">
        <div className="flex items-center justify-between mb-3">
          <button
            onClick={() => setShowResults(v => !v)}
            className="flex items-center gap-1.5 text-sm font-semibold text-foreground"
          >
            Results
            {showResults ? <ChevronUp size={13} className="text-muted-foreground" /> : <ChevronDown size={13} className="text-muted-foreground" />}
          </button>
          <button
            onClick={() => { setShowForm(v => !v); setForm(emptyForm) }}
            className="flex items-center gap-1 text-xs px-2.5 py-1.5 bg-foreground/90 text-background rounded-lg font-medium"
          >
            <Plus size={11} />
            Log results
          </button>
        </div>

        {showForm && (
          <div className="bg-muted border border-border rounded-xl p-4 mb-3 space-y-3">
            {campaignInfluencers.length > 0 && (
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Influencer (optional)</label>
                <select
                  value={form.influencer_id}
                  onChange={e => setField('influencer_id', e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-muted text-foreground focus:outline-none focus:ring-1 focus:ring-brand/50"
                >
                  <option value="">Overall / no specific influencer</option>
                  {campaignInfluencers.map(inf => (
                    <option key={inf.id} value={inf.id}>{inf.name}</option>
                  ))}
                </select>
              </div>
            )}

            <div className="grid grid-cols-2 gap-2">
              {(['views', 'reach', 'clicks', 'conversions'] as const).map(field => (
                <div key={field}>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block capitalize">{field}</label>
                  <input
                    type="number"
                    value={form[field]}
                    onChange={e => setField(field, e.target.value)}
                    placeholder="—"
                    className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-muted text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-brand/50"
                  />
                </div>
              ))}
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Revenue generated ({currency})</label>
              <input
                type="number"
                value={form.revenue_generated}
                onChange={e => setField('revenue_generated', e.target.value)}
                placeholder="—"
                className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-muted text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-brand/50"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Notes</label>
              <textarea
                value={form.notes}
                onChange={e => setField('notes', e.target.value)}
                rows={2}
                placeholder="Optional notes…"
                className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-muted text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-brand/50 resize-none"
              />
            </div>

            <div className="flex gap-2 pt-1">
              <button
                onClick={submitResult}
                disabled={submitting}
                className="px-3 py-1.5 bg-foreground/90 text-background text-xs font-medium rounded-lg disabled:opacity-50"
              >
                {submitting ? 'Saving…' : 'Save'}
              </button>
              <button
                onClick={() => { setShowForm(false); setForm(emptyForm) }}
                className="px-3 py-1.5 bg-muted text-muted-foreground text-xs font-medium rounded-lg border border-border"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {showResults && (
          <div className="space-y-2">
            {results.length === 0 && (
              <p className="text-xs text-muted-foreground/60 py-2">No results logged yet.</p>
            )}
            {results.map(r => (
              <div key={r.id} className="bg-muted border border-border rounded-lg p-3">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <span className="text-xs font-semibold text-foreground">
                    {r.influencer?.name ?? 'Overall'}
                  </span>
                  <div className="flex items-center gap-1 shrink-0">
                    <span className="text-xs text-muted-foreground/50">
                      {new Date(r.logged_at).toLocaleDateString()}
                    </span>
                    {confirmDeleteId === r.id ? (
                      <>
                        <button
                          onClick={() => deleteResult(r.id)}
                          disabled={deletingId === r.id}
                          className="text-xs px-2 py-0.5 bg-red-500/20 text-red-400 rounded font-medium disabled:opacity-50"
                        >
                          {deletingId === r.id ? '…' : 'Confirm'}
                        </button>
                        <button
                          onClick={() => setConfirmDeleteId(null)}
                          className="text-xs px-2 py-0.5 bg-muted text-muted-foreground rounded border border-border"
                        >
                          No
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => setConfirmDeleteId(r.id)}
                        className="p-1 text-muted-foreground/40 hover:text-muted-foreground rounded"
                      >
                        <Trash2 size={11} />
                      </button>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-x-3 gap-y-1">
                  {r.views != null && (
                    <span className="text-xs text-muted-foreground">Views: <span className="text-foreground font-medium">{r.views.toLocaleString()}</span></span>
                  )}
                  {r.reach != null && (
                    <span className="text-xs text-muted-foreground">Reach: <span className="text-foreground font-medium">{r.reach.toLocaleString()}</span></span>
                  )}
                  {r.clicks != null && (
                    <span className="text-xs text-muted-foreground">Clicks: <span className="text-foreground font-medium">{r.clicks.toLocaleString()}</span></span>
                  )}
                  {r.conversions != null && (
                    <span className="text-xs text-muted-foreground">Conversions: <span className="text-foreground font-medium">{r.conversions.toLocaleString()}</span></span>
                  )}
                  {r.revenue_generated != null && (
                    <span className="text-xs text-muted-foreground col-span-2">Revenue: <span className="text-green-400 font-medium">{currency} {Number(r.revenue_generated).toLocaleString()}</span></span>
                  )}
                </div>
                {r.notes && (
                  <p className="text-xs text-muted-foreground/70 mt-1.5 leading-relaxed">{r.notes}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
