'use client'

import { useState, useEffect } from 'react'
import { Plus, Pencil, Trash2, X, Briefcase } from 'lucide-react'
import Link from 'next/link'

interface Deal {
  id: string
  title: string
  brand_name: string
  contact_person: string | null
  value: number | null
  currency: string
  platforms: string[]
  status: string
  start_date: string | null
  end_date: string | null
  notes: string | null
  created_at: string
}

const STATUSES = [
  'lead','contacted','negotiating','contract_sent','contract_signed',
  'in_production','sent_for_approval','approved','posted','invoiced','paid','completed','cancelled',
]

const STATUS_COLORS: Record<string, string> = {
  lead:               'bg-muted text-muted-foreground',
  contacted:          'bg-sky-500/15 text-sky-400',
  negotiating:        'bg-amber-500/15 text-amber-400',
  contract_sent:      'bg-violet-500/15 text-violet-400',
  contract_signed:    'bg-blue-500/15 text-blue-400',
  in_production:      'bg-indigo-500/15 text-indigo-400',
  sent_for_approval:  'bg-orange-500/15 text-orange-400',
  approved:           'bg-teal-500/15 text-teal-400',
  posted:             'bg-cyan-500/15 text-cyan-400',
  invoiced:           'bg-purple-500/15 text-purple-400',
  paid:               'bg-green-500/15 text-green-400',
  completed:          'bg-green-500/15 text-green-400',
  cancelled:          'bg-red-500/15 text-red-400',
}

const EMPTY = { title: '', brand_name: '', contact_person: '', value: '', currency: 'USD', platforms: [] as string[], status: 'lead', start_date: '', end_date: '', notes: '' }

const ALL_PLATFORMS = ['Instagram','TikTok','YouTube','Twitter','LinkedIn','Podcast','Blog']

function fmt(v: number | null, cur = 'USD') {
  if (!v) return '—'
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: cur, maximumFractionDigits: 0 }).format(v)
}

export default function DealsPage() {
  const [deals, setDeals] = useState<Deal[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Deal | null>(null)
  const [form, setForm] = useState({ ...EMPTY })
  const [saving, setSaving] = useState(false)
  const [statusFilter, setStatusFilter] = useState('all')

  useEffect(() => {
    fetch('/api/creator-deals').then(r => r.json()).then(setDeals).finally(() => setLoading(false))
  }, [])

  function openNew() { setForm({ ...EMPTY }); setEditing(null); setShowForm(true) }
  function openEdit(d: Deal) {
    setForm({ ...d, value: d.value?.toString() ?? '', platforms: d.platforms ?? [], start_date: d.start_date ?? '', end_date: d.end_date ?? '', contact_person: d.contact_person ?? '', notes: d.notes ?? '' })
    setEditing(d); setShowForm(true)
  }
  function set(k: string) { return (v: string) => setForm(f => ({ ...f, [k]: v })) }
  function togglePlatform(p: string) {
    setForm(f => ({ ...f, platforms: f.platforms.includes(p) ? f.platforms.filter(x => x !== p) : [...f.platforms, p] }))
  }

  async function save() {
    if (!form.title.trim() || !form.brand_name.trim()) return
    setSaving(true)
    try {
      const payload = { ...form, value: form.value ? parseFloat(form.value) : null }
      const method = editing ? 'PATCH' : 'POST'
      const url = editing ? `/api/creator-deals/${editing.id}` : '/api/creator-deals'
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      if (!res.ok) return
      const saved = await res.json()
      setDeals(prev => editing ? prev.map(d => d.id === saved.id ? saved : d) : [saved, ...prev])
      setShowForm(false)
    } finally { setSaving(false) }
  }

  async function del(id: string) {
    if (!confirm('Delete this deal?')) return
    await fetch(`/api/creator-deals/${id}`, { method: 'DELETE' })
    setDeals(prev => prev.filter(d => d.id !== id))
  }

  async function updateStatus(id: string, status: string) {
    const res = await fetch(`/api/creator-deals/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) })
    if (res.ok) {
      const updated = await res.json()
      setDeals(prev => prev.map(d => d.id === id ? updated : d))
    }
  }

  const filtered = statusFilter === 'all' ? deals : deals.filter(d => d.status === statusFilter)

  return (
    <div className="p-8">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Deals</h1>
          <p className="text-sm text-muted-foreground mt-1">{deals.length} deal{deals.length !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={openNew} className="flex items-center gap-2 bg-foreground/90 text-background px-4 py-2 rounded-lg text-sm font-medium hover:bg-foreground transition-colors">
          <Plus size={14} />New deal
        </button>
      </div>

      {/* Status filter pills */}
      <div className="flex flex-wrap gap-1.5 mb-5">
        <button onClick={() => setStatusFilter('all')} className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${statusFilter === 'all' ? 'bg-foreground text-background' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}>All</button>
        {['lead','negotiating','in_production','posted','paid','cancelled'].map(s => (
          <button key={s} onClick={() => setStatusFilter(s)} className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${statusFilter === s ? 'bg-foreground text-background' : `${STATUS_COLORS[s]} hover:opacity-80`}`}>
            {s.replace(/_/g, ' ')}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="bg-card border border-border rounded-xl h-20 animate-pulse" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="bg-card border border-border rounded-xl py-16 text-center">
          <Briefcase size={32} className="mx-auto mb-3 text-muted-foreground/30" />
          <p className="text-sm text-muted-foreground mb-4">{deals.length === 0 ? 'No deals yet. Add your first brand deal.' : 'No deals match this filter.'}</p>
          {deals.length === 0 && <button onClick={openNew} className="inline-flex items-center gap-2 bg-foreground/90 text-background px-4 py-2 rounded-lg text-sm font-medium hover:bg-foreground transition-colors"><Plus size={14} />Add deal</button>}
        </div>
      ) : (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b border-border">
              <tr>{['Deal', 'Brand', 'Value', 'Status', 'Deadline', ''].map(h => <th key={h} className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">{h}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map(d => (
                <tr key={d.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-medium text-foreground">{d.title}</p>
                    {d.platforms?.length > 0 && <p className="text-xs text-muted-foreground">{d.platforms.join(', ')}</p>}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{d.brand_name}</td>
                  <td className="px-4 py-3 font-semibold text-foreground">{fmt(d.value, d.currency)}</td>
                  <td className="px-4 py-3">
                    <select
                      value={d.status}
                      onChange={e => updateStatus(d.id, e.target.value)}
                      className={`text-xs font-medium px-2 py-1 rounded-full border-0 cursor-pointer ${STATUS_COLORS[d.status] ?? 'bg-muted text-muted-foreground'} focus:outline-none focus:ring-1 focus:ring-brand/40`}
                    >
                      {STATUSES.map(s => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
                    </select>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">{d.end_date ? new Date(d.end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—'}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 justify-end">
                      <button onClick={() => openEdit(d)} className="p-1.5 text-muted-foreground/60 hover:text-foreground transition-colors"><Pencil size={13} /></button>
                      <button onClick={() => del(d.id)} className="p-1.5 text-muted-foreground/60 hover:text-red-400 transition-colors"><Trash2 size={13} /></button>
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
              <h2 className="font-semibold text-foreground">{editing ? 'Edit deal' : 'New deal'}</h2>
              <button onClick={() => setShowForm(false)} className="text-muted-foreground hover:text-foreground"><X size={18} /></button>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Deal title *</label>
                <input value={form.title} onChange={e => set('title')(e.target.value)} placeholder="Spring Campaign 2025" className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand/40" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Brand *</label>
                  <input value={form.brand_name} onChange={e => set('brand_name')(e.target.value)} placeholder="Nike" className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand/40" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Contact person</label>
                  <input value={form.contact_person} onChange={e => set('contact_person')(e.target.value)} placeholder="Jane Smith" className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand/40" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Deal value</label>
                  <input value={form.value} onChange={e => set('value')(e.target.value)} type="number" placeholder="2500" className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand/40" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Currency</label>
                  <select value={form.currency} onChange={e => set('currency')(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-brand/40">
                    {['USD','EUR','GBP','CHF','CAD','AUD'].map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Status</label>
                <select value={form.status} onChange={e => set('status')(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-brand/40">
                  {STATUSES.map(s => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-2">Platforms</label>
                <div className="flex flex-wrap gap-2">
                  {ALL_PLATFORMS.map(p => (
                    <button key={p} type="button" onClick={() => togglePlatform(p)} className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${form.platforms.includes(p) ? 'bg-brand text-brand-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}>{p}</button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Start date</label>
                  <input value={form.start_date} onChange={e => set('start_date')(e.target.value)} type="date" className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-brand/40" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">End date</label>
                  <input value={form.end_date} onChange={e => set('end_date')(e.target.value)} type="date" className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-brand/40" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Notes</label>
                <textarea value={form.notes} onChange={e => set('notes')(e.target.value)} rows={3} placeholder="Any notes about this deal..." className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand/40 resize-none" />
              </div>
            </div>
            <div className="px-6 py-4 border-t border-border flex gap-3 shrink-0">
              <button onClick={() => setShowForm(false)} className="flex-1 px-4 py-2 rounded-lg border border-border text-sm font-medium text-muted-foreground hover:bg-muted transition-colors">Cancel</button>
              <button onClick={save} disabled={saving || !form.title.trim() || !form.brand_name.trim()} className="flex-1 bg-foreground/90 text-background py-2 rounded-lg text-sm font-semibold hover:bg-foreground transition-colors disabled:opacity-50">
                {saving ? 'Saving…' : editing ? 'Save changes' : 'Create deal'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
