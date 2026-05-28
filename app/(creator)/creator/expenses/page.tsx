'use client'

import { useState, useEffect } from 'react'
import { Plus, Pencil, Trash2, X, Receipt } from 'lucide-react'

interface Expense {
  id: string
  title: string
  amount: number
  currency: string
  date: string
  category: string
  merchant: string | null
  payment_method: string
  tax_amount: number | null
  notes: string | null
  deal_id: string | null
  creator_deals: { title: string } | null
}

const CATEGORIES = ['equipment','software','travel','food_meetings','studio_rent','props','ads','freelancer','education','phone_internet','other']
const PAYMENT_METHODS = ['cash','bank_transfer','credit_card','paypal','other']

const CAT_COLORS: Record<string, string> = {
  equipment: 'bg-blue-100 text-blue-700',
  software: 'bg-purple-100 text-purple-700',
  travel: 'bg-sky-100 text-sky-700',
  food_meetings: 'bg-orange-100 text-orange-700',
  studio_rent: 'bg-pink-100 text-pink-700',
  props: 'bg-yellow-100 text-yellow-700',
  ads: 'bg-red-100 text-red-700',
  freelancer: 'bg-indigo-100 text-indigo-700',
  education: 'bg-green-100 text-green-700',
  phone_internet: 'bg-teal-100 text-teal-700',
  other: 'bg-muted text-muted-foreground',
}

const EMPTY = { title: '', amount: '', currency: 'USD', date: new Date().toISOString().split('T')[0], category: 'other', merchant: '', payment_method: 'bank_transfer', tax_amount: '', notes: '', deal_id: '' }

function fmt(n: number) { return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n) }
function fmtDate(d: string) { return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) }

export default function ExpensesPage() {
  const [items, setItems] = useState<Expense[]>([])
  const [deals, setDeals] = useState<Array<{ id: string; title: string; brand_name: string }>>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Expense | null>(null)
  const [form, setForm] = useState({ ...EMPTY })
  const [saving, setSaving] = useState(false)
  const [catFilter, setCatFilter] = useState('all')

  useEffect(() => {
    Promise.all([
      fetch('/api/creator-expenses').then(r => r.json()),
      fetch('/api/creator-deals').then(r => r.json()),
    ]).then(([e, d]) => { setItems(e); setDeals(d) }).finally(() => setLoading(false))
  }, [])

  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
  const yearStart = new Date(now.getFullYear(), 0, 1).toISOString().split('T')[0]
  const totalMonth = items.filter(e => e.date >= monthStart).reduce((s, e) => s + Number(e.amount), 0)
  const totalYear = items.filter(e => e.date >= yearStart).reduce((s, e) => s + Number(e.amount), 0)

  function openNew() { setForm({ ...EMPTY }); setEditing(null); setShowForm(true) }
  function openEdit(e: Expense) {
    setForm({ ...e, amount: e.amount.toString(), tax_amount: e.tax_amount?.toString() ?? '', merchant: e.merchant ?? '', notes: e.notes ?? '', deal_id: e.deal_id ?? '' })
    setEditing(e); setShowForm(true)
  }
  function set(k: string) { return (v: string) => setForm(f => ({ ...f, [k]: v })) }

  async function save() {
    if (!form.title.trim() || !form.amount) return
    setSaving(true)
    try {
      const payload = { ...form, amount: parseFloat(form.amount), tax_amount: form.tax_amount ? parseFloat(form.tax_amount) : null, deal_id: form.deal_id || null }
      const method = editing ? 'PATCH' : 'POST'
      const url = editing ? `/api/creator-expenses/${editing.id}` : '/api/creator-expenses'
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      if (!res.ok) return
      fetch('/api/creator-expenses').then(r => r.json()).then(setItems)
      setShowForm(false)
    } finally { setSaving(false) }
  }

  async function del(id: string) {
    if (!confirm('Delete this expense?')) return
    await fetch(`/api/creator-expenses/${id}`, { method: 'DELETE' })
    setItems(prev => prev.filter(e => e.id !== id))
  }

  const filtered = catFilter === 'all' ? items : items.filter(e => e.category === catFilter)

  return (
    <div className="p-8">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Expenses</h1>
          <p className="text-sm text-muted-foreground mt-1">Track your business costs</p>
        </div>
        <button onClick={openNew} className="flex items-center gap-2 bg-foreground/90 text-background px-4 py-2 rounded-lg text-sm font-medium hover:bg-foreground transition-colors">
          <Plus size={14} />Log expense
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-card border border-border rounded-xl p-5">
          <p className="text-xs text-muted-foreground mb-1">This month</p>
          <p className="text-2xl font-bold text-foreground">{fmt(totalMonth)}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-5">
          <p className="text-xs text-muted-foreground mb-1">This year</p>
          <p className="text-2xl font-bold text-foreground">{fmt(totalYear)}</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5 mb-5">
        <button onClick={() => setCatFilter('all')} className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${catFilter === 'all' ? 'bg-foreground text-background' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}>All</button>
        {CATEGORIES.map(c => (
          <button key={c} onClick={() => setCatFilter(c)} className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${catFilter === c ? 'bg-foreground text-background' : `${CAT_COLORS[c]} hover:opacity-80`}`}>
            {c.replace(/_/g, ' ')}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="bg-card border border-border rounded-xl h-14 animate-pulse" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="bg-card border border-border rounded-xl py-16 text-center">
          <Receipt size={32} className="mx-auto mb-3 text-muted-foreground/30" />
          <p className="text-sm text-muted-foreground">{items.length === 0 ? 'No expenses yet.' : 'No expenses in this category.'}</p>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b border-border">
              <tr>{['Title', 'Amount', 'Category', 'Date', 'Merchant', 'Method', ''].map(h => <th key={h} className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">{h}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map(e => (
                <tr key={e.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-medium text-foreground">{e.title}</p>
                    {e.creator_deals && <p className="text-xs text-muted-foreground">{e.creator_deals.title}</p>}
                  </td>
                  <td className="px-4 py-3 font-semibold text-foreground">{fmt(Number(e.amount))}</td>
                  <td className="px-4 py-3"><span className={`text-xs font-medium px-2 py-0.5 rounded-full ${CAT_COLORS[e.category] ?? 'bg-muted text-muted-foreground'}`}>{e.category.replace(/_/g, ' ')}</span></td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">{fmtDate(e.date)}</td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">{e.merchant ?? '—'}</td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">{e.payment_method.replace(/_/g, ' ')}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 justify-end">
                      <button onClick={() => openEdit(e)} className="p-1.5 text-muted-foreground/60 hover:text-foreground transition-colors"><Pencil size={13} /></button>
                      <button onClick={() => del(e.id)} className="p-1.5 text-muted-foreground/60 hover:text-red-400 transition-colors"><Trash2 size={13} /></button>
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
              <h2 className="font-semibold text-foreground">{editing ? 'Edit expense' : 'Log expense'}</h2>
              <button onClick={() => setShowForm(false)} className="text-muted-foreground hover:text-foreground"><X size={18} /></button>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Title *</label>
                <input value={form.title} onChange={e => set('title')(e.target.value)} placeholder="Adobe Creative Cloud" className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand/40" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Amount *</label>
                  <input value={form.amount} onChange={e => set('amount')(e.target.value)} type="number" placeholder="54.99" className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand/40" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Date *</label>
                  <input value={form.date} onChange={e => set('date')(e.target.value)} type="date" className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-brand/40" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Category</label>
                  <select value={form.category} onChange={e => set('category')(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-brand/40">
                    {CATEGORIES.map(c => <option key={c} value={c}>{c.replace(/_/g, ' ')}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Payment method</label>
                  <select value={form.payment_method} onChange={e => set('payment_method')(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-brand/40">
                    {PAYMENT_METHODS.map(m => <option key={m} value={m}>{m.replace(/_/g, ' ')}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Merchant</label>
                  <input value={form.merchant} onChange={e => set('merchant')(e.target.value)} placeholder="Adobe Inc." className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand/40" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Tax amount</label>
                  <input value={form.tax_amount} onChange={e => set('tax_amount')(e.target.value)} type="number" placeholder="8.75" className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand/40" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Link to deal</label>
                <select value={form.deal_id} onChange={e => set('deal_id')(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-brand/40">
                  <option value="">— None —</option>
                  {deals.map(d => <option key={d.id} value={d.id}>{d.brand_name} — {d.title}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Notes</label>
                <textarea value={form.notes} onChange={e => set('notes')(e.target.value)} rows={2} className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand/40 resize-none" />
              </div>
            </div>
            <div className="px-6 py-4 border-t border-border flex gap-3 shrink-0">
              <button onClick={() => setShowForm(false)} className="flex-1 px-4 py-2 rounded-lg border border-border text-sm font-medium text-muted-foreground hover:bg-muted transition-colors">Cancel</button>
              <button onClick={save} disabled={saving || !form.title.trim() || !form.amount} className="flex-1 bg-foreground/90 text-background py-2 rounded-lg text-sm font-semibold hover:bg-foreground transition-colors disabled:opacity-50">
                {saving ? 'Saving…' : editing ? 'Save changes' : 'Log expense'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
