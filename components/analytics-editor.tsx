'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { CreatorAnalyticsRow } from '@/types/analytics'

interface Props {
  campaignId: string
  creators: CreatorAnalyticsRow[]
}

type FieldKey = 'impressions' | 'clicks' | 'conversions' | 'spend' | 'notes'

interface RowState {
  impressions: string
  clicks: string
  conversions: string
  spend: string
  notes: string
}

function initRows(creators: CreatorAnalyticsRow[]): Record<string, RowState> {
  return Object.fromEntries(
    creators.map((c) => [
      c.influencer_id,
      {
        impressions: c.impressions > 0 ? String(c.impressions) : '',
        clicks: c.clicks > 0 ? String(c.clicks) : '',
        conversions: c.conversions > 0 ? String(c.conversions) : '',
        spend: c.spend > 0 ? String(c.spend) : '',
        notes: c.notes ?? '',
      },
    ])
  )
}

export default function AnalyticsEditor({ campaignId, creators }: Props) {
  const router = useRouter()
  const [rows, setRows] = useState<Record<string, RowState>>(() => initRows(creators))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  function updateField(influencerId: string, field: FieldKey, value: string) {
    setRows((prev) => ({
      ...prev,
      [influencerId]: { ...prev[influencerId], [field]: value },
    }))
    setSaved(false)
  }

  async function handleSave() {
    setSaving(true)
    setError(null)
    setSaved(false)

    const creatorUpdates = creators.map((c) => {
      const row = rows[c.influencer_id]
      return {
        influencer_id: c.influencer_id,
        impressions: parseInt(row.impressions || '0', 10) || 0,
        clicks: parseInt(row.clicks || '0', 10) || 0,
        conversions: parseInt(row.conversions || '0', 10) || 0,
        spend: parseFloat(row.spend || '0') || 0,
        notes: row.notes.trim() || null,
      }
    })

    try {
      const res = await fetch(`/api/campaigns/${campaignId}/analytics`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ creator_updates: creatorUpdates }),
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error ?? 'Failed to save metrics')
        return
      }

      setSaved(true)
      router.refresh()
    } catch {
      setError('An unexpected error occurred')
    } finally {
      setSaving(false)
    }
  }

  if (creators.length === 0) {
    return (
      <div className="bg-card border border-border rounded-xl p-8 text-center">
        <p className="text-sm text-muted-foreground">
          No creators attached to this campaign yet. Add creators on the campaign page first.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left px-4 py-3 text-xs text-muted-foreground font-medium">Creator</th>
                <th className="text-left px-4 py-3 text-xs text-muted-foreground font-medium">Platform</th>
                <th className="px-4 py-3 text-xs text-muted-foreground font-medium">Impressions</th>
                <th className="px-4 py-3 text-xs text-muted-foreground font-medium">Clicks</th>
                <th className="px-4 py-3 text-xs text-muted-foreground font-medium">Conversions</th>
                <th className="px-4 py-3 text-xs text-muted-foreground font-medium">Spend ($)</th>
                <th className="px-4 py-3 text-xs text-muted-foreground font-medium">Notes</th>
              </tr>
            </thead>
            <tbody>
              {creators.map((creator) => {
                const row = rows[creator.influencer_id]
                return (
                  <tr key={creator.influencer_id} className="border-b border-border last:border-0">
                    <td className="px-4 py-3 text-foreground font-medium whitespace-nowrap">{creator.name}</td>
                    <td className="px-4 py-3 text-muted-foreground capitalize whitespace-nowrap">
                      {creator.platform ?? '—'}
                    </td>
                    {(['impressions', 'clicks', 'conversions'] as const).map((field) => (
                      <td key={field} className="px-2 py-2">
                        <input
                          type="number"
                          min="0"
                          placeholder="0"
                          value={row[field]}
                          onChange={(e) => updateField(creator.influencer_id, field, e.target.value)}
                          className="w-24 bg-background border border-border rounded-lg px-2 py-1.5 text-sm text-foreground text-right focus:outline-none focus:ring-1 focus:ring-ring"
                        />
                      </td>
                    ))}
                    <td className="px-2 py-2">
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                        value={row.spend}
                        onChange={(e) => updateField(creator.influencer_id, 'spend', e.target.value)}
                        className="w-28 bg-background border border-border rounded-lg px-2 py-1.5 text-sm text-foreground text-right focus:outline-none focus:ring-1 focus:ring-ring"
                      />
                    </td>
                    <td className="px-2 py-2">
                      <input
                        type="text"
                        placeholder="Optional notes"
                        value={row.notes}
                        onChange={(e) => updateField(creator.influencer_id, 'notes', e.target.value)}
                        className="w-40 bg-background border border-border rounded-lg px-2 py-1.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                      />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div>
          {error && <p className="text-sm text-red-400">{error}</p>}
          {saved && <p className="text-sm text-green-400">Metrics saved successfully.</p>}
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {saving ? 'Saving...' : 'Save metrics'}
        </button>
      </div>
    </div>
  )
}
