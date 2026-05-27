'use client'

import { useState } from 'react'
import { TrendingUp } from 'lucide-react'

interface Props {
  campaignId: string
  totalSpend: number
  estimatedReach: number
  revenueTarget: number | null
  revenueAttributed: number | null
  currency: string
}

export default function CampaignROI({ campaignId, totalSpend, estimatedReach, revenueTarget, revenueAttributed, currency }: Props) {
  const [target, setTarget] = useState(revenueTarget != null ? String(revenueTarget) : '')
  const [attributed, setAttributed] = useState(revenueAttributed != null ? String(revenueAttributed) : '')
  const [saving, setSaving] = useState(false)

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

      <div className="space-y-3">
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
    </div>
  )
}
