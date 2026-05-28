'use client'

import { useState, useEffect } from 'react'
import { Plus, Trash2, X, Image, ExternalLink, Download } from 'lucide-react'

interface Receipt {
  id: string
  file_url: string
  file_name: string | null
  date: string | null
  amount: number | null
  category: string | null
  notes: string | null
  expense_id: string | null
  creator_expenses: { title: string; category: string } | null
  created_at: string
}

const CATEGORIES = ['equipment','software','travel','food_meetings','studio_rent','props','ads','freelancer','education','phone_internet','other']
const EMPTY = { file_url: '', file_name: '', date: new Date().toISOString().split('T')[0], amount: '', category: 'other', notes: '', expense_id: '' }

function fmtDate(d: string | null) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function ReceiptsPage() {
  const [items, setItems] = useState<Receipt[]>([])
  const [expenses, setExpenses] = useState<Array<{ id: string; title: string }>>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ ...EMPTY })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    Promise.all([
      fetch('/api/creator-receipts').then(r => r.json()),
      fetch('/api/creator-expenses').then(r => r.json()),
    ]).then(([r, e]) => { setItems(r); setExpenses(e) }).finally(() => setLoading(false))
  }, [])

  function set(k: string) { return (v: string) => setForm(f => ({ ...f, [k]: v })) }

  async function save() {
    if (!form.file_url.trim()) return
    setSaving(true)
    try {
      const payload = { ...form, amount: form.amount ? parseFloat(form.amount) : null, expense_id: form.expense_id || null }
      const res = await fetch('/api/creator-receipts', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      if (!res.ok) return
      fetch('/api/creator-receipts').then(r => r.json()).then(setItems)
      setForm({ ...EMPTY }); setShowForm(false)
    } finally { setSaving(false) }
  }

  async function del(id: string) {
    if (!confirm('Delete this receipt?')) return
    await fetch(`/api/creator-receipts/${id}`, { method: 'DELETE' })
    setItems(prev => prev.filter(r => r.id !== id))
  }

  return (
    <div className="p-8">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Receipts</h1>
          <p className="text-sm text-muted-foreground mt-1">{items.length} receipt{items.length !== 1 ? 's' : ''} stored</p>
        </div>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-2 bg-foreground/90 text-background px-4 py-2 rounded-lg text-sm font-medium hover:bg-foreground transition-colors">
          <Plus size={14} />Add receipt
        </button>
      </div>

      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">{Array.from({ length: 6 }).map((_, i) => <div key={i} className="bg-card border border-border rounded-xl h-32 animate-pulse" />)}</div>
      ) : items.length === 0 ? (
        <div className="bg-card border border-border rounded-xl py-20 text-center">
          <Image size={36} className="mx-auto mb-3 text-muted-foreground/30" />
          <p className="text-sm text-muted-foreground mb-4">No receipts yet. Add your first one.</p>
          <button onClick={() => setShowForm(true)} className="inline-flex items-center gap-2 bg-foreground/90 text-background px-4 py-2 rounded-lg text-sm font-medium hover:bg-foreground transition-colors"><Plus size={14} />Add receipt</button>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b border-border">
              <tr>{['File', 'Linked expense', 'Amount', 'Date', 'Category', ''].map(h => <th key={h} className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">{h}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-border">
              {items.map(r => (
                <tr key={r.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-muted rounded-lg flex items-center justify-center shrink-0">
                        <Image size={13} className="text-muted-foreground" />
                      </div>
                      <span className="text-sm font-medium text-foreground truncate max-w-[140px]">{r.file_name ?? 'receipt'}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">{r.creator_expenses?.title ?? '—'}</td>
                  <td className="px-4 py-3 text-foreground font-medium">{r.amount ? `$${Number(r.amount).toFixed(2)}` : '—'}</td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">{fmtDate(r.date)}</td>
                  <td className="px-4 py-3"><span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full">{(r.category ?? 'other').replace(/_/g, ' ')}</span></td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 justify-end">
                      <a href={r.file_url} target="_blank" rel="noopener noreferrer" className="p-1.5 text-muted-foreground/60 hover:text-foreground transition-colors"><ExternalLink size={13} /></a>
                      <a href={r.file_url} download className="p-1.5 text-muted-foreground/60 hover:text-foreground transition-colors"><Download size={13} /></a>
                      <button onClick={() => del(r.id)} className="p-1.5 text-muted-foreground/60 hover:text-red-400 transition-colors"><Trash2 size={13} /></button>
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
              <h2 className="font-semibold text-foreground">Add receipt</h2>
              <button onClick={() => setShowForm(false)} className="text-muted-foreground hover:text-foreground"><X size={18} /></button>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">File URL *</label>
                <input value={form.file_url} onChange={e => set('file_url')(e.target.value)} placeholder="https://..." className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand/40" />
                <p className="text-xs text-muted-foreground mt-1">Paste a direct link to the file (PDF, JPG, PNG)</p>
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">File name</label>
                <input value={form.file_name} onChange={e => set('file_name')(e.target.value)} placeholder="adobe-invoice-june.pdf" className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand/40" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Amount</label>
                  <input value={form.amount} onChange={e => set('amount')(e.target.value)} type="number" placeholder="54.99" className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand/40" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Date</label>
                  <input value={form.date} onChange={e => set('date')(e.target.value)} type="date" className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-brand/40" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Category</label>
                <select value={form.category} onChange={e => set('category')(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-brand/40">
                  {CATEGORIES.map(c => <option key={c} value={c}>{c.replace(/_/g, ' ')}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Link to expense</label>
                <select value={form.expense_id} onChange={e => set('expense_id')(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-brand/40">
                  <option value="">— None —</option>
                  {expenses.map(e => <option key={e.id} value={e.id}>{e.title}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Notes</label>
                <textarea value={form.notes} onChange={e => set('notes')(e.target.value)} rows={2} className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand/40 resize-none" />
              </div>
            </div>
            <div className="px-6 py-4 border-t border-border flex gap-3 shrink-0">
              <button onClick={() => setShowForm(false)} className="flex-1 px-4 py-2 rounded-lg border border-border text-sm font-medium text-muted-foreground hover:bg-muted transition-colors">Cancel</button>
              <button onClick={save} disabled={saving || !form.file_url.trim()} className="flex-1 bg-foreground/90 text-background py-2 rounded-lg text-sm font-semibold hover:bg-foreground transition-colors disabled:opacity-50">
                {saving ? 'Saving…' : 'Add receipt'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
