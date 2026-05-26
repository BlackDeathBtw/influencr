'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Trash2 } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

interface CampaignInfluencer {
  id: string
  influencer_id: string
  fee: number | null
  status: string
  notes: string | null
  influencer: { id: string; name: string } | null
}

interface Influencer {
  id: string
  name: string
}

interface Props {
  campaignId: string
  campaignInfluencers: CampaignInfluencer[]
  allInfluencers: Influencer[]
}

const dealStatusColors: Record<string, string> = {
  outreach: 'bg-zinc-100 text-zinc-600',
  negotiating: 'bg-amber-100 text-amber-700',
  confirmed: 'bg-green-100 text-green-700',
  declined: 'bg-red-100 text-red-700',
}

export default function CampaignInfluencers({ campaignId, campaignInfluencers, allInfluencers }: Props) {
  const router = useRouter()
  const [adding, setAdding] = useState(false)
  const [form, setForm] = useState({ influencer_id: '', fee: '', status: 'outreach', notes: '' })
  const [loading, setLoading] = useState(false)

  const added = new Set(campaignInfluencers.map(ci => ci.influencer_id))
  const available = allInfluencers.filter(inf => !added.has(inf.id))

  async function addInfluencer() {
    if (!form.influencer_id) return
    setLoading(true)
    await fetch('/api/campaign-influencers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        campaign_id: campaignId,
        influencer_id: form.influencer_id,
        fee: form.fee ? parseFloat(form.fee) : null,
        status: form.status,
        notes: form.notes || null,
      }),
    })
    setAdding(false)
    setForm({ influencer_id: '', fee: '', status: 'outreach', notes: '' })
    setLoading(false)
    router.refresh()
  }

  async function updateStatus(id: string, status: string) {
    await fetch(`/api/campaign-influencers/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    router.refresh()
  }

  async function remove(id: string) {
    if (!confirm('Remove this influencer from the campaign?')) return
    await fetch(`/api/campaign-influencers/${id}`, { method: 'DELETE' })
    router.refresh()
  }

  return (
    <div className="bg-white border border-zinc-200 rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-zinc-900">Influencers ({campaignInfluencers.length})</h2>
        {!adding && available.length > 0 && (
          <button
            onClick={() => setAdding(true)}
            className="flex items-center gap-1.5 text-sm text-zinc-600 hover:text-zinc-900 font-medium"
          >
            <Plus size={14} /> Add
          </button>
        )}
      </div>

      {adding && (
        <div className="mb-4 p-4 bg-zinc-50 rounded-lg border border-zinc-200 space-y-3">
          <select
            value={form.influencer_id}
            onChange={e => setForm(f => ({ ...f, influencer_id: e.target.value }))}
            className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm bg-white"
          >
            <option value="">Select influencer</option>
            {available.map(inf => <option key={inf.id} value={inf.id}>{inf.name}</option>)}
          </select>
          <div className="grid grid-cols-2 gap-3">
            <input
              type="number"
              value={form.fee}
              onChange={e => setForm(f => ({ ...f, fee: e.target.value }))}
              placeholder="Fee (USD)"
              className="px-3 py-2 border border-zinc-200 rounded-lg text-sm"
            />
            <select
              value={form.status}
              onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
              className="px-3 py-2 border border-zinc-200 rounded-lg text-sm bg-white"
            >
              {['outreach', 'negotiating', 'confirmed', 'declined'].map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-2">
            <button
              onClick={addInfluencer}
              disabled={!form.influencer_id || loading}
              className="bg-zinc-900 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50"
            >
              {loading ? 'Adding…' : 'Add'}
            </button>
            <button
              onClick={() => setAdding(false)}
              className="border border-zinc-200 text-zinc-600 px-4 py-2 rounded-lg text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {campaignInfluencers.length === 0 ? (
        <p className="text-sm text-zinc-400 py-4 text-center">No influencers added yet</p>
      ) : (
        <div className="space-y-2">
          {campaignInfluencers.map(ci => (
            <div key={ci.id} className="flex items-center justify-between py-2 border-b border-zinc-100 last:border-0">
              <div>
                <p className="text-sm font-medium text-zinc-800">{ci.influencer?.name ?? '—'}</p>
                {ci.fee && <p className="text-xs text-zinc-400">{formatCurrency(ci.fee)}</p>}
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={ci.status}
                  onChange={e => updateStatus(ci.id, e.target.value)}
                  className={`text-xs px-2 py-1 rounded-full font-medium border-0 cursor-pointer ${dealStatusColors[ci.status]}`}
                >
                  {['outreach', 'negotiating', 'confirmed', 'declined'].map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
                <button onClick={() => remove(ci.id)} className="text-zinc-300 hover:text-red-500 transition-colors">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
