'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Trash2 } from 'lucide-react'
import type { ContractWithMilestones, MilestoneMetric } from '@/types/contracts'

interface SimpleInfluencer { id: string; name: string }
interface SimpleCampaign { id: string; name: string }

interface MilestoneRow {
  title: string
  metric: MilestoneMetric
  target_value: string
  bonus_amount: string
  due_date: string
}

interface Props {
  contract?: ContractWithMilestones
  influencers: SimpleInfluencer[]
  campaigns: SimpleCampaign[]
}

const METRIC_OPTIONS: MilestoneMetric[] = ['impressions', 'clicks', 'posts', 'conversions', 'views', 'custom']

const CONTRACT_TEMPLATE =
`INFLUENCER COLLABORATION AGREEMENT

This agreement is entered into as of [DATE] between [BRAND] ("Brand") and [CREATOR] ("Creator").

1. DELIVERABLES
   Creator will produce and publish the following content:
   - [describe content type and count]
   - Platform: [platform]
   - Due date: [DEADLINE]

2. COMPENSATION
   Brand will pay Creator the base fee plus any earned milestone bonuses upon completion.

3. USAGE RIGHTS
   Brand receives a 12-month license to repurpose the content across owned channels.

4. FTC COMPLIANCE
   Creator will disclose the partnership using #ad or #sponsored in all content.

5. APPROVAL PROCESS
   All content must be approved by Brand 48 hours prior to publishing.

Signed:
Brand: ___________________________  Date: ________
Creator: _________________________  Date: ________`

function blankMilestone(): MilestoneRow {
  return { title: '', metric: 'impressions', target_value: '', bonus_amount: '', due_date: '' }
}

export default function ContractEditor({ contract, influencers, campaigns }: Props) {
  const router = useRouter()
  const [form, setForm] = useState({
    title: contract?.title ?? '',
    influencer_id: contract?.influencer_id ?? '',
    campaign_id: contract?.campaign_id ?? '',
    payment_model: contract?.payment_model ?? 'flat',
    base_fee: String(contract?.base_fee ?? ''),
    currency: contract?.currency ?? 'USD',
    content: contract?.content ?? CONTRACT_TEMPLATE,
  })
  const [milestones, setMilestones] = useState<MilestoneRow[]>(
    contract?.milestones?.map(m => ({
      title: m.title,
      metric: m.metric,
      target_value: String(m.target_value),
      bonus_amount: String(m.bonus_amount),
      due_date: m.due_date ?? '',
    })) ?? []
  )
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function addMilestone() {
    setMilestones(ms => [...ms, blankMilestone()])
  }

  function removeMilestone(idx: number) {
    setMilestones(ms => ms.filter((_, i) => i !== idx))
  }

  function updateMilestone(idx: number, field: keyof MilestoneRow, value: string) {
    setMilestones(ms => ms.map((m, i) => i === idx ? { ...m, [field]: value } : m))
  }

  async function save() {
    if (!form.title.trim()) { setError('Title is required'); return }
    setSaving(true)
    setError(null)

    const payload = {
      title: form.title,
      influencer_id: form.influencer_id || null,
      campaign_id: form.campaign_id || null,
      payment_model: form.payment_model,
      base_fee: parseFloat(form.base_fee) || 0,
      currency: form.currency,
      content: form.content,
      milestones: form.payment_model !== 'flat'
        ? milestones
            .filter(m => m.title.trim() && m.target_value)
            .map(m => ({
              title: m.title,
              metric: m.metric,
              target_value: parseInt(m.target_value, 10),
              bonus_amount: parseFloat(m.bonus_amount) || 0,
              due_date: m.due_date || null,
            }))
        : [],
    }

    const url = contract ? `/api/contracts/${contract.id}` : '/api/contracts'
    const method = contract ? 'PATCH' : 'POST'

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    setSaving(false)

    if (!res.ok) {
      const json = await res.json().catch(() => ({}))
      setError(json.error ?? 'Failed to save contract')
      return
    }

    router.refresh()
    router.push('/contracts')
  }

  return (
    <div className="p-8 max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          {contract ? 'Edit Contract' : 'New Contract'}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {contract ? 'Update contract details and milestones.' : 'Create a performance-based contract with milestone bonuses.'}
        </p>
      </div>

      {error && (
        <div className="bg-red-500/15 text-red-400 text-sm px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      <div className="bg-card border border-border rounded-xl p-6 space-y-4">
        <h2 className="font-semibold text-foreground text-sm">Contract Details</h2>

        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">Title *</label>
          <input
            value={form.title}
            onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            placeholder="e.g. Spring Campaign — Alex Rivera"
            className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-background"
          />
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Influencer (optional)</label>
            <select
              value={form.influencer_id}
              onChange={e => setForm(f => ({ ...f, influencer_id: e.target.value }))}
              className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-card"
            >
              <option value="">— none —</option>
              {influencers.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Campaign (optional)</label>
            <select
              value={form.campaign_id}
              onChange={e => setForm(f => ({ ...f, campaign_id: e.target.value }))}
              className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-card"
            >
              <option value="">— none —</option>
              {campaigns.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
        </div>

        <div className="grid sm:grid-cols-3 gap-4">
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Payment Model</label>
            <select
              value={form.payment_model}
              onChange={e => setForm(f => ({ ...f, payment_model: e.target.value as 'flat' | 'milestone' | 'hybrid' }))}
              className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-card"
            >
              <option value="flat">Flat fee</option>
              <option value="milestone">Milestone only</option>
              <option value="hybrid">Hybrid (base + milestones)</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">
              {form.payment_model === 'milestone' ? 'Guaranteed Fee' : 'Base Fee'}
            </label>
            <input
              type="number"
              min={0}
              step="0.01"
              value={form.base_fee}
              onChange={e => setForm(f => ({ ...f, base_fee: e.target.value }))}
              placeholder="0.00"
              className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-background"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Currency</label>
            <select
              value={form.currency}
              onChange={e => setForm(f => ({ ...f, currency: e.target.value }))}
              className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-card"
            >
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
              <option value="GBP">GBP</option>
              <option value="CAD">CAD</option>
              <option value="AUD">AUD</option>
            </select>
          </div>
        </div>
      </div>

      {form.payment_model !== 'flat' && (
        <div className="bg-card border border-border rounded-xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-foreground text-sm">Performance Milestones</h2>
            <button
              onClick={addMilestone}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-foreground/90 text-background rounded-lg font-medium"
            >
              <Plus size={12} /> Add milestone
            </button>
          </div>

          {milestones.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">
              No milestones yet. Add one to tie payments to performance.
            </p>
          )}

          {milestones.map((m, idx) => (
            <div key={idx} className="border border-border rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">Milestone {idx + 1}</span>
                <button
                  onClick={() => removeMilestone(idx)}
                  className="p-1 text-muted-foreground/60 hover:text-red-400 transition-colors"
                >
                  <Trash2 size={13} />
                </button>
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Title *</label>
                  <input
                    value={m.title}
                    onChange={e => updateMilestone(idx, 'title', e.target.value)}
                    placeholder="e.g. Reach 50k impressions"
                    className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-background"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Metric *</label>
                  <select
                    value={m.metric}
                    onChange={e => updateMilestone(idx, 'metric', e.target.value)}
                    className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-card"
                  >
                    {METRIC_OPTIONS.map(opt => (
                      <option key={opt} value={opt}>{opt.charAt(0).toUpperCase() + opt.slice(1)}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Target Value *</label>
                  <input
                    type="number"
                    min={1}
                    value={m.target_value}
                    onChange={e => updateMilestone(idx, 'target_value', e.target.value)}
                    placeholder="50000"
                    className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-background"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Bonus Amount ({form.currency})</label>
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    value={m.bonus_amount}
                    onChange={e => updateMilestone(idx, 'bonus_amount', e.target.value)}
                    placeholder="500.00"
                    className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-background"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Due Date (optional)</label>
                  <input
                    type="date"
                    value={m.due_date}
                    onChange={e => updateMilestone(idx, 'due_date', e.target.value)}
                    className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-background"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="bg-card border border-border rounded-xl p-6 space-y-3">
        <h2 className="font-semibold text-foreground text-sm">Contract Body</h2>
        <textarea
          value={form.content}
          onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
          rows={18}
          className="w-full px-3 py-2 border border-border rounded-lg text-sm font-mono resize-y bg-background"
        />
      </div>

      <div className="flex gap-3">
        <button
          onClick={save}
          disabled={!form.title.trim() || saving}
          className="bg-foreground/90 text-background px-5 py-2.5 rounded-lg text-sm font-medium disabled:opacity-50 hover:bg-foreground transition-colors"
        >
          {saving ? 'Saving…' : contract ? 'Update contract' : 'Create contract'}
        </button>
        <button
          onClick={() => router.push('/contracts')}
          className="border border-border text-muted-foreground px-5 py-2.5 rounded-lg text-sm hover:bg-muted/40 transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}
