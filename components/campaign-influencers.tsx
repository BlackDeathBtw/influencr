'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Trash2, Tag } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

interface CampaignInfluencer {
  id: string
  influencer_id: string
  fee: number | null
  status: string
  notes: string | null
  promo_code: string | null
  affiliate_link: string | null
  revenue_attributed: number | null
  influencer: { id: string; name: string; followers: number | null } | null
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
  outreach: 'bg-muted text-muted-foreground',
  negotiating: 'bg-amber-500/15 text-amber-400',
  confirmed: 'bg-green-500/15 text-green-400',
  declined: 'bg-red-500/15 text-red-400',
}

export default function CampaignInfluencers({ campaignId, campaignInfluencers, allInfluencers }: Props) {
  const router = useRouter()
  const [adding, setAdding] = useState(false)
  const [form, setForm] = useState({ influencer_id: '', fee: '', status: 'outreach', notes: '' })
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [promoForm, setPromoForm] = useState<Record<string, { promo_code: string; affiliate_link: string; revenue_attributed: string }>>({})
  const [savingPromo, setSavingPromo] = useState<string | null>(null)
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

  function openPromo(ci: CampaignInfluencer) {
    setExpandedId(expandedId === ci.id ? null : ci.id)
    if (!promoForm[ci.id]) {
      setPromoForm(f => ({
        ...f,
        [ci.id]: {
          promo_code: ci.promo_code ?? '',
          affiliate_link: ci.affiliate_link ?? '',
          revenue_attributed: ci.revenue_attributed != null ? String(ci.revenue_attributed) : '',
        },
      }))
    }
  }

  async function savePromo(id: string) {
    setSavingPromo(id)
    const { promo_code, affiliate_link, revenue_attributed } = promoForm[id]
    await fetch(`/api/campaign-influencers/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        promo_code: promo_code || null,
        affiliate_link: affiliate_link || null,
        revenue_attributed: revenue_attributed !== '' ? Number(revenue_attributed) : null,
      }),
    })
    setSavingPromo(null)
    setExpandedId(null)
    router.refresh()
  }

  return (
    <div className="bg-card border border-border rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-foreground">Influencers ({campaignInfluencers.length})</h2>
        {!adding && available.length > 0 && (
          <button
            onClick={() => setAdding(true)}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground font-medium"
          >
            <Plus size={14} /> Add
          </button>
        )}
      </div>

      {adding && (
        <div className="mb-4 p-4 bg-background rounded-lg border border-border space-y-3">
          <select
            value={form.influencer_id}
            onChange={e => setForm(f => ({ ...f, influencer_id: e.target.value }))}
            className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-card"
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
              className="px-3 py-2 border border-border rounded-lg text-sm"
            />
            <select
              value={form.status}
              onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
              className="px-3 py-2 border border-border rounded-lg text-sm bg-card"
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
              className="bg-foreground/90 text-background px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50"
            >
              {loading ? 'Adding…' : 'Add'}
            </button>
            <button
              onClick={() => setAdding(false)}
              className="border border-border text-muted-foreground px-4 py-2 rounded-lg text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {campaignInfluencers.length === 0 ? (
        <p className="text-sm text-muted-foreground/70 py-4 text-center">No influencers added yet</p>
      ) : (
        <div className="space-y-2">
          {campaignInfluencers.map(ci => (
            <div key={ci.id} className="border-b border-border last:border-0">
              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="text-sm font-medium text-foreground/90">{ci.influencer?.name ?? '—'}</p>
                  <div className="flex items-center gap-2">
                    {ci.fee && <p className="text-xs text-muted-foreground/70">{formatCurrency(ci.fee)}</p>}
                    {ci.promo_code && (
                      <span className="text-xs bg-amber-500/15 text-amber-400 px-1.5 py-0.5 rounded font-mono">
                        {ci.promo_code}
                      </span>
                    )}
                  </div>
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
                  <button
                    onClick={() => openPromo(ci)}
                    className={`transition-colors ${expandedId === ci.id ? 'text-amber-600' : 'text-muted-foreground/90 hover:text-muted-foreground'}`}
                    title="Promo code / affiliate link"
                  >
                    <Tag size={13} />
                  </button>
                  <button onClick={() => remove(ci.id)} className="text-muted-foreground/90 hover:text-red-500 transition-colors">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
              {expandedId === ci.id && promoForm[ci.id] && (
                <div className="pb-3 pl-0 space-y-2">
                  <input
                    value={promoForm[ci.id].promo_code}
                    onChange={e => setPromoForm(f => ({ ...f, [ci.id]: { ...f[ci.id], promo_code: e.target.value } }))}
                    placeholder="Promo code (e.g. ALEX20)"
                    className="w-full px-3 py-1.5 border border-border rounded-lg text-xs font-mono"
                  />
                  <input
                    value={promoForm[ci.id].affiliate_link}
                    onChange={e => setPromoForm(f => ({ ...f, [ci.id]: { ...f[ci.id], affiliate_link: e.target.value } }))}
                    placeholder="Affiliate link (https://…)"
                    className="w-full px-3 py-1.5 border border-border rounded-lg text-xs bg-muted text-foreground"
                  />
                  <input
                    type="number"
                    value={promoForm[ci.id].revenue_attributed}
                    onChange={e => setPromoForm(f => ({ ...f, [ci.id]: { ...f[ci.id], revenue_attributed: e.target.value } }))}
                    placeholder="Revenue attributed (USD)"
                    className="w-full px-3 py-1.5 border border-border rounded-lg text-xs bg-muted text-foreground"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => savePromo(ci.id)}
                      disabled={savingPromo === ci.id}
                      className="text-xs bg-foreground/90 text-background px-3 py-1.5 rounded-lg disabled:opacity-50"
                    >
                      {savingPromo === ci.id ? 'Saving…' : 'Save'}
                    </button>
                    <button
                      onClick={() => setExpandedId(null)}
                      className="text-xs text-muted-foreground hover:text-foreground/80"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
