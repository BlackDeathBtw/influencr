'use client'

import { useState, useEffect } from 'react'
import { Plus, Pencil, Trash2, X, Wallet } from 'lucide-react'

interface Payment {
  id: string
  deal_id: string | null
  invoice_id: string | null
  amount: number
  currency: string
  payment_method: string
  status: string
  expected_date: string | null
  received_date: string | null
  notes: string | null
  creator_deals: { title: string; brand_name: string } | null
  creator_invoices: { invoice_number: string } | null
}

const PAYMENT_METHODS = ['bank_transfer','paypal','wise','stripe','cash','crypto','other']
const STATUSES = ['expected','received','partial','late','failed']

const STATUS_COLORS: Record<string, string> = {
  expected: 'bg-sky-500/15 text-sky-400',
  received: 'bg-green-500/15 text-green-400',
  partial:  'bg-amber-500/15 text-amber-400',
  late:     'bg-orange-500/15 text-orange-400',
  failed:   'bg-red-500/15 text-red-400',
}

function fmt(n: number, cur = 'USD') {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: cur, maximumFractionDigits: 0 }).format(n)
}
function fmtDate(d: string | null) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

const EMPTY = { deal_id: '', invoice_id: '', amount: '', currency: 'USD', payment_method: 'bank_transfer', status: 'expected', expected_date: '', received_date: '', notes: '' }

export default function PaymentsPage() {
  const [items, setItems] = useState<Payment[]>([])
  const [deals, setDeals] = useState<Array<{ id: string; title: string; brand_name: string }>>([])
  const [invoices, setInvoices] = useState<Array<{ id: string; invoice_number: string }>>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Payment | null>(null)
  const [form, setForm] = useState({ ...EMPTY })
  const [saving, setSaving] = useState(false)
  const [statusFilter, setStatusFilter] = useState('all')

  useEffect(() => {
    Promise.all([
      fetch('/api/creator-payments-log').then(r => r.json()),
      fetch('/api/creator-deals').then(r => r.json()),
      fetch('/api/creator-invoices').then(r => r.json()).catch(() => []),
    ]).then(([p, d, inv]) => { setItems(p); setDeals(d); setInvoices(inv) }).finally(() => setLoading(false))
  }, [])

  const received = items.filter(p => p.status === 'received' || p.status === 'partial').reduce((s, p) => s + Number(p.amount), 0)
  const expected = items.filter(p => p.status === 'expected' || p.status === 'late').reduce((s, p) => s + Number(p.amount), 0)

  function openNew() { setForm({ ...EMPTY }); setEditing(null); setShowForm(true) }
  function openEdit(p: Payment) {
    setForm({ ...p, amount: p.amount.toString(), deal_id: p.deal_id ?? '', invoice_id: p.invoice_id ?? '', expected_date: p.expected_date ?? '', received_date: p.received_date ?? '', notes: p.notes ?? '' })
    setEditing(p); setShowForm(true)
  }
  function set(k: string) { return (v: string) => setForm(f => ({ ...f, [k]: v })) }

  async function save() {
    if (!form.amount) return
    setSaving(true)
    try {
      const payload = { ...form, amount: parseFloat(form.amount), deal_id: form.deal_id || null, invoice_id: form.invoice_id || null, expected_date: form.expected_date || null, received_date: form.received_date || null }
      const method = editing ? 'PATCH' : 'POST'
      const url = editing ? `/api/creator-payments-log/${editing.id}` : '/api/creator-payments-log'
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      if (!res.ok) return
      fetch('/api/creator-payments-log').then(r => r.json()).then(setItems)
      setShowForm(false)
    } finally { setSaving(false) }
  }

  async function updateStatus(id: string, status: string) {
    const res = await fetch(`/api/creator-payments-log/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) })
    if (res.ok) setItems(prev => prev.map(p => p.id === id ? { ...p, status } : p))
  }

  async function del(id: string) {
    if (!confirm('Delete this payment?')) return
    await fetch(`/api/creator-payments-log/${id}`, { method: 'DELETE' })
    setItems(prev => prev.filter(p => p.id !== id))
  }

  const filtered = statusFilter === 'all' ? items : items.filter(p => p.status === statusFilter)

  return (
    <div className="p-8">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Payments</h1>
          <p className="text-sm text-muted-foreground mt-1">Incoming payment log</p>
        </div>
        <button onClick={openNew} className="flex items-center gap-2 bg-foreground/90 text-background px-4 py-2 rounded-lg text-sm font-medium hover:bg-foreground transition-colors">
          <Plus size={14} />Log payment
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-card border border-border rounded-xl p-5">
          <p className="text-xs text-muted-foreground mb-1">Received</p>
          <p className="text-2xl font-bold text-green-400">{fmt(received)}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-5">
          <p className="text-xs text-muted-foreground mb-1">Expected / Outstanding</p>
          <p className="text-2xl font-bold text-foreground">{fmt(expected)}</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5 mb-5">
        <button onClick={() => setStatusFilter('all')} className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${statusFilter === 'all' ? 'bg-foreground text-background' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}>All</button>
        {STATUSES.map(s => (
          <button key={s} onClick={() => setStatusFilter(s)} className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${statusFilter === s ? 'bg-foreground text-background' : `${STATUS_COLORS[s]} hover:opacity-80`}`}>
            {s.replace(/_/g, ' ')}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="bg-card border border-border rounded-xl h-14 animate-pulse" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="bg-card border border-border rounded-xl py-16 text-center">
          <Wallet size={32} className="mx-auto mb-3 text-muted-foreground/30" />
          <p className="text-sm text-muted-foreground">{items.length === 0 ? 'No payments logged yet.' : 'No payments match this filter.'}</p>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b border-border">
              <tr>{['Deal / Invoice', 'Amount', 'Method', 'Expected', 'Received', 'Status', ''].map(h => <th key={h} className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">{h}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map(p => (
                <tr key={p.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3">
                    {p.creator_deals ? (
                      <>
                        <p className="font-medium text-foreground">{p.creator_deals.brand_name}</p>
                        <p className="text-xs text-muted-foreground">{p.creator_deals.title}</p>
                      </>
                    ) : p.creator_invoices ? (
                      <p className="font-medium text-foreground">{p.creator_invoices.invoice_number}</p>
                    ) : (
                      <p className="text-muted-foreground/50 text-xs">—</p>
                    )}
                  </td>
                  <td className="px-4 py-3 font-semibold text-foreground">{fmt(Number(p.amount), p.currency)}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{p.payment_method.replace(/_/g, ' ')}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{fmtDate(p.expected_date)}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{fmtDate(p.received_date)}</td>
                  <td className="px-4 py-3">
                    <select
                      value={p.status}
                      onChange={e => updateStatus(p.id, e.target.value)}
                      className={`text-xs font-medium px-2 py-1 rounded-full border-0 cursor-pointer ${STATUS_COLORS[p.status] ?? 'bg-muted text-muted-foreground'} focus:outline-none`}
                    >
                      {STATUSES.map(s => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 justify-end">
                      <button onClick={() => openEdit(p)} className="p-1.5 text-muted-foreground/60 hover:text-foreground transition-colors"><Pencil size={13} /></button>
                      <button onClick={() => del(p.id)} className="p-1.5 text-muted-foreground/60 hover:text-red-400 transition-colors"><Trash2 size={13} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-40 flex justify-end">
          <div className="h-full w-full max-w-md bg-card border-l border-border flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
              <h2 className="font-semibold text-foreground">{editing ? 'Edit payment' : 'Log payment'}</h2>
              <button onClick={() => setShowForm(false)} className="text-muted-foreground hover:text-foreground"><X size={18} /></button>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Linked deal</label>
                <select value={form.deal_id} onChange={e => set('deal_id')(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-brand/40">
                  <option value="">— None —</option>
                  {deals.map(d => <option key={d.id} value={d.id}>{d.brand_name} — {d.title}</option>)}
                </select>
              </div>
              {invoices.length > 0 && (
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Linked invoice</label>
                  <select value={form.invoice_id} onChange={e => set('invoice_id')(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-brand/40">
                    <option value="">— None —</option>
                    {invoices.map(inv => <option key={inv.id} value={inv.id}>{inv.invoice_number}</option>)}
                  </select>
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Amount *</label>
                  <input value={form.amount} onChange={e => set('amount')(e.target.value)} type="number" placeholder="2500" className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand/40" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Currency</label>
                  <select value={form.currency} onChange={e => set('currency')(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-brand/40">
                    {['USD','EUR','GBP','CHF','CAD','AUD'].map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Payment method</label>
                  <select value={form.payment_method} onChange={e => set('payment_method')(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-brand/40">
                    {PAYMENT_METHODS.map(m => <option key={m} value={m}>{m.replace(/_/g, ' ')}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Status</label>
                  <select value={form.status} onChange={e => set('status')(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-brand/40">
                    {STATUSES.map(s => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Expected date</label>
                  <input value={form.expected_date} onChange={e => set('expected_date')(e.target.value)} type="date" className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-brand/40" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Received date</label>
                  <input value={form.received_date} onChange={e => set('received_date')(e.target.value)} type="date" className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-brand/40" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Notes</label>
                <textarea value={form.notes} onChange={e => set('notes')(e.target.value)} rows={2} className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand/40 resize-none" />
              </div>
            </div>
            <div className="px-6 py-4 border-t border-border flex gap-3 shrink-0">
              <button onClick={() => setShowForm(false)} className="flex-1 px-4 py-2 rounded-lg border border-border text-sm font-medium text-muted-foreground hover:bg-muted transition-colors">Cancel</button>
              <button onClick={save} disabled={saving || !form.amount} className="flex-1 bg-foreground/90 text-background py-2 rounded-lg text-sm font-semibold hover:bg-foreground transition-colors disabled:opacity-50">
                {saving ? 'Saving…' : editing ? 'Save changes' : 'Log payment'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
