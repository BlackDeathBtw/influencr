'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Trash2, Check } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

interface Payment {
  id: string
  influencer_id: string
  campaign_id: string | null
  amount: number
  currency: string
  status: string
  due_date: string | null
  paid_at: string | null
  invoice_number: string | null
  notes: string | null
  influencer: { name: string } | null
  campaign: { name: string } | null
}

interface Props {
  payments: Payment[]
  influencers: { id: string; name: string }[]
  campaigns: { id: string; name: string }[]
  userId: string
}

const statusColors: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-700',
  paid: 'bg-green-100 text-green-700',
  overdue: 'bg-red-100 text-red-700',
}

export default function PaymentManager({ payments, influencers, campaigns, userId }: Props) {
  const router = useRouter()
  const [adding, setAdding] = useState(false)
  const [form, setForm] = useState({
    influencer_id: '',
    campaign_id: '',
    amount: '',
    currency: 'USD',
    status: 'pending',
    due_date: '',
    invoice_number: '',
    notes: '',
  })
  const [loading, setLoading] = useState(false)
  const [filter, setFilter] = useState<string>('')

  function set(key: string, value: string) {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  async function addPayment() {
    if (!form.influencer_id || !form.amount) return
    setLoading(true)
    await fetch('/api/payments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: userId,
        influencer_id: form.influencer_id,
        campaign_id: form.campaign_id || null,
        amount: parseFloat(form.amount),
        currency: form.currency,
        status: form.status,
        due_date: form.due_date || null,
        invoice_number: form.invoice_number || null,
        notes: form.notes || null,
      }),
    })
    setAdding(false)
    setForm({ influencer_id: '', campaign_id: '', amount: '', currency: 'USD', status: 'pending', due_date: '', invoice_number: '', notes: '' })
    setLoading(false)
    router.refresh()
  }

  async function markPaid(id: string) {
    await fetch(`/api/payments/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'paid', paid_at: new Date().toISOString().split('T')[0] }),
    })
    router.refresh()
  }

  async function remove(id: string) {
    if (!confirm('Delete this payment record?')) return
    await fetch(`/api/payments/${id}`, { method: 'DELETE' })
    router.refresh()
  }

  const filtered = filter ? payments.filter(p => p.status === filter) : payments
  const totalPending = payments.filter(p => p.status === 'pending').reduce((s, p) => s + p.amount, 0)
  const totalPaid = payments.filter(p => p.status === 'paid').reduce((s, p) => s + p.amount, 0)

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Pending', value: formatCurrency(totalPending), cls: 'text-amber-600' },
          { label: 'Paid', value: formatCurrency(totalPaid), cls: 'text-green-600' },
          { label: 'Total', value: formatCurrency(totalPending + totalPaid), cls: 'text-foreground' },
        ].map(({ label, value, cls }) => (
          <div key={label} className="bg-card border border-border rounded-xl p-4">
            <p className="text-xs text-muted-foreground mb-1">{label}</p>
            <p className={`text-xl font-bold ${cls}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          {(['', 'pending', 'paid', 'overdue'] as const).map(s => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                filter === s ? 'bg-foreground/90 text-background' : 'bg-card border border-border text-muted-foreground hover:bg-background'
              }`}
            >
              {s === '' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
        {!adding && (
          <button
            onClick={() => setAdding(true)}
            className="flex items-center gap-2 bg-foreground/90 text-background px-4 py-2 rounded-lg text-sm font-medium hover:bg-foreground transition-colors"
          >
            <Plus size={14} /> Log payment
          </button>
        )}
      </div>

      {/* Add form */}
      {adding && (
        <div className="bg-card border border-border rounded-xl p-5 space-y-4">
          <h3 className="font-medium text-foreground">Log a payment</h3>
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Influencer *</label>
              <select value={form.influencer_id} onChange={e => set('influencer_id', e.target.value)} className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-card">
                <option value="">Select</option>
                {influencers.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Campaign</label>
              <select value={form.campaign_id} onChange={e => set('campaign_id', e.target.value)} className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-card">
                <option value="">None</option>
                {campaigns.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Amount *</label>
              <div className="flex">
                <select value={form.currency} onChange={e => set('currency', e.target.value)} className="px-2 py-2 border border-r-0 border-border rounded-l-lg text-sm bg-card">
                  {['USD', 'EUR', 'GBP', 'CAD', 'AUD'].map(c => <option key={c}>{c}</option>)}
                </select>
                <input type="number" value={form.amount} onChange={e => set('amount', e.target.value)} placeholder="500" min="0" step="0.01" className="flex-1 px-3 py-2 border border-border rounded-r-lg text-sm" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Status</label>
              <select value={form.status} onChange={e => set('status', e.target.value)} className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-card">
                {['pending', 'paid', 'overdue'].map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Due date</label>
              <input type="date" value={form.due_date} onChange={e => set('due_date', e.target.value)} className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-card" />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Invoice #</label>
              <input value={form.invoice_number} onChange={e => set('invoice_number', e.target.value)} placeholder="INV-001" className="w-full px-3 py-2 border border-border rounded-lg text-sm" />
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={addPayment} disabled={!form.influencer_id || !form.amount || loading} className="bg-foreground/90 text-background px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50">
              {loading ? 'Saving…' : 'Save'}
            </button>
            <button onClick={() => setAdding(false)} className="border border-border text-muted-foreground px-4 py-2 rounded-lg text-sm">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        {filtered.length === 0 ? (
          <p className="text-sm text-muted-foreground/70 py-12 text-center">No payments {filter ? `with status "${filter}"` : 'yet'}</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b border-border">
              <tr>
                {['Influencer', 'Campaign', 'Amount', 'Invoice', 'Due', 'Status', ''].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map(p => (
                <tr key={p.id} className="hover:bg-background">
                  <td className="px-4 py-3 font-medium text-foreground">{p.influencer?.name ?? '—'}</td>
                  <td className="px-4 py-3 text-muted-foreground">{p.campaign?.name ?? '—'}</td>
                  <td className="px-4 py-3 font-semibold text-foreground">{formatCurrency(p.amount, p.currency)}</td>
                  <td className="px-4 py-3 text-muted-foreground">{p.invoice_number ?? '—'}</td>
                  <td className="px-4 py-3 text-muted-foreground">{p.due_date ? new Date(p.due_date).toLocaleDateString() : '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[p.status]}`}>{p.status}</span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center gap-2 justify-end">
                      {p.status !== 'paid' && (
                        <button onClick={() => markPaid(p.id)} className="text-green-600 hover:text-green-700" title="Mark paid">
                          <Check size={14} />
                        </button>
                      )}
                      <button onClick={() => remove(p.id)} className="text-muted-foreground/90 hover:text-red-500">
                        <Trash2 size={14} />
                      </button>
                    </div>
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
