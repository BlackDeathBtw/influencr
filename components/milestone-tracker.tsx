'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle2, AlertCircle, Clock, XCircle } from 'lucide-react'
import type { ContractMilestone, MilestoneStatus } from '@/types/contracts'

interface Props {
  contractId: string
  milestones: ContractMilestone[]
}

const METRIC_LABELS: Record<string, string> = {
  impressions: 'Impressions',
  clicks: 'Clicks',
  posts: 'Posts',
  conversions: 'Conversions',
  views: 'Views',
  custom: 'Custom',
}

const STATUS_STYLES: Record<MilestoneStatus, string> = {
  pending: 'bg-muted text-muted-foreground',
  achieved: 'bg-green-500/15 text-green-400',
  failed: 'bg-red-500/15 text-red-400',
  disputed: 'bg-amber-500/15 text-amber-400',
}

const STATUS_ICONS: Record<MilestoneStatus, React.ReactNode> = {
  pending: <Clock size={12} />,
  achieved: <CheckCircle2 size={12} />,
  failed: <XCircle size={12} />,
  disputed: <AlertCircle size={12} />,
}

export default function MilestoneTracker({ contractId, milestones }: Props) {
  const router = useRouter()
  const [editing, setEditing] = useState<string | null>(null)
  const [values, setValues] = useState<Record<string, { achieved_value: string; status: MilestoneStatus }>>(() => {
    const init: Record<string, { achieved_value: string; status: MilestoneStatus }> = {}
    for (const m of milestones) {
      init[m.id] = { achieved_value: String(m.achieved_value ?? 0), status: m.status }
    }
    return init
  })
  const [saving, setSaving] = useState<string | null>(null)

  async function save(milestoneId: string) {
    setSaving(milestoneId)
    const v = values[milestoneId]
    await fetch(`/api/contracts/${contractId}/milestones/${milestoneId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        achieved_value: parseInt(v.achieved_value, 10) || 0,
        status: v.status,
      }),
    })
    setSaving(null)
    setEditing(null)
    router.refresh()
  }

  if (milestones.length === 0) return null

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-foreground">Milestone Progress</h3>
      {milestones.map(m => {
        const pct = Math.min(100, Math.round(((m.achieved_value ?? 0) / m.target_value) * 100))
        const isEditing = editing === m.id
        const val = values[m.id]

        return (
          <div key={m.id} className="bg-card border border-border rounded-xl p-4 space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium text-sm text-foreground">{m.title}</span>
                  <span className="text-xs px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                    {METRIC_LABELS[m.metric] ?? m.metric}
                  </span>
                  <span className={`inline-flex items-center gap-1 text-xs px-1.5 py-0.5 rounded font-medium ${STATUS_STYLES[m.status]}`}>
                    {STATUS_ICONS[m.status]}
                    {m.status}
                  </span>
                </div>
                {m.due_date && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Due {new Date(m.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </p>
                )}
              </div>
              <div className="text-right shrink-0">
                <span className="text-sm font-semibold text-foreground">
                  +${m.bonus_amount.toLocaleString()}
                </span>
                <p className="text-xs text-muted-foreground">bonus</p>
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{(m.achieved_value ?? 0).toLocaleString()} / {m.target_value.toLocaleString()}</span>
                <span>{pct}%</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${m.status === 'achieved' ? 'bg-green-500' : m.status === 'failed' ? 'bg-red-500' : 'bg-foreground/60'}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>

            {isEditing ? (
              <div className="flex items-center gap-2 flex-wrap">
                <input
                  type="number"
                  min={0}
                  value={val.achieved_value}
                  onChange={e => setValues(v => ({ ...v, [m.id]: { ...v[m.id], achieved_value: e.target.value } }))}
                  className="w-32 px-2 py-1 border border-border rounded-lg text-sm bg-background"
                  placeholder="Achieved"
                />
                <select
                  value={val.status}
                  onChange={e => setValues(v => ({ ...v, [m.id]: { ...v[m.id], status: e.target.value as MilestoneStatus } }))}
                  className="px-2 py-1 border border-border rounded-lg text-sm bg-card"
                >
                  <option value="pending">Pending</option>
                  <option value="achieved">Achieved</option>
                  <option value="failed">Failed</option>
                  <option value="disputed">Disputed</option>
                </select>
                <button
                  onClick={() => save(m.id)}
                  disabled={saving === m.id}
                  className="px-3 py-1 bg-foreground/90 text-background rounded-lg text-sm font-medium disabled:opacity-50"
                >
                  {saving === m.id ? 'Saving…' : 'Save'}
                </button>
                <button
                  onClick={() => setEditing(null)}
                  className="px-3 py-1 border border-border text-muted-foreground rounded-lg text-sm"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => setEditing(m.id)}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                Update progress
              </button>
            )}
          </div>
        )
      })}
    </div>
  )
}
