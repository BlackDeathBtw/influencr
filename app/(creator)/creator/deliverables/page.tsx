'use client'

import { useState, useEffect } from 'react'
import { Plus, Pencil, Trash2, X, CheckSquare } from 'lucide-react'

interface Deliverable {
  id: string
  title: string
  description: string | null
  type: string
  platform: string | null
  deadline: string | null
  posting_date: string | null
  status: string
  price: number | null
  post_url: string | null
  revision_count: number
  deal_id: string | null
  creator_deals: { title: string; brand_name: string } | null
}

const TYPES = ['reel','story','tiktok','youtube_video','short','photo','ugc_clip','blogpost','post']
const PLATFORMS = ['Instagram','TikTok','YouTube','Twitter','LinkedIn','Blog']
const STATUSES = ['not_started','planning','filming','editing','sent_to_brand','changes_requested','approved','posted','completed']

const STATUS_COLORS: Record<string, string> = {
  not_started:       'bg-muted text-muted-foreground',
  planning:          'bg-sky-500/15 text-sky-400',
  filming:           'bg-violet-500/15 text-violet-400',
  editing:           'bg-amber-500/15 text-amber-400',
  sent_to_brand:     'bg-blue-500/15 text-blue-400',
  changes_requested: 'bg-orange-500/15 text-orange-400',
  approved:          'bg-teal-500/15 text-teal-400',
  posted:            'bg-green-500/15 text-green-400',
  completed:         'bg-green-500/15 text-green-400',
}

function fmtDate(d: string) { return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) }
function isOverdue(d: string | null) { return d ? new Date(d) < new Date() : false }

const EMPTY = { title: '', description: '', type: 'reel', platform: 'Instagram', deadline: '', posting_date: '', status: 'not_started', price: '', post_url: '', deal_id: '' }

export default function DeliverablesPage() {
  const [items, setItems] = useState<Deliverable[]>([])
  const [deals, setDeals] = useState<Array<{ id: string; title: string; brand_name: string }>>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Deliverable | null>(null)
  const [form, setForm] = useState({ ...EMPTY })
  const [saving, setSaving] = useState(false)
  const [statusFilter, setStatusFilter] = useState('all')

  useEffect(() => {
    Promise.all([
      fetch('/api/creator-deliverables').then(r => r.json()),
      fetch('/api/creator-deals').then(r => r.json()),
    ]).then(([d, dl]) => { setItems(d); setDeals(dl) }).finally(() => setLoading(false))
  }, [])

  function openNew() { setForm({ ...EMPTY }); setEditing(null); setShowForm(true) }
  function openEdit(d: Deliverable) {
    setForm({ ...d, price: d.price?.toString() ?? '', deadline: d.deadline ?? '', posting_date: d.posting_date ?? '', post_url: d.post_url ?? '', deal_id: d.deal_id ?? '', description: d.description ?? '', platform: d.platform ?? '' })
    setEditing(d); setShowForm(true)
  }
  function set(k: string) { return (v: string) => setForm(f => ({ ...f, [k]: v })) }

  async function save() {
    if (!form.title.trim()) return
    setSaving(true)
    try {
      const payload = { ...form, price: form.price ? parseFloat(form.price) : null, deal_id: form.deal_id || null }
      const method = editing ? 'PATCH' : 'POST'
      const url = editing ? `/api/creator-deliverables/${editing.id}` : '/api/creator-deliverables'
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      if (!res.ok) return
      const saved = await res.json()
      // re-fetch to get joined data
      fetch('/api/creator-deliverables').then(r => r.json()).then(setItems)
      setShowForm(false)
    } finally { setSaving(false) }
  }

  async function updateStatus(id: string, status: string) {
    const res = await fetch(`/api/creator-deliverables/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) })
    if (res.ok) setItems(prev => prev.map(d => d.id === id ? { ...d, status } : d))
  }

  async function del(id: string) {
    if (!confirm('Delete this deliverable?')) return
    await fetch(`/api/creator-deliverables/${id}`, { method: 'DELETE' })
    setItems(prev => prev.filter(d => d.id !== id))
  }

  const filtered = statusFilter === 'all' ? items : items.filter(d => d.status === statusFilter)

  return (
    <div className="p-8">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Deliverables</h1>
          <p className="text-sm text-muted-foreground mt-1">{items.length} total</p>
        </div>
        <button onClick={openNew} className="flex items-center gap-2 bg-foreground/90 text-background px-4 py-2 rounded-lg text-sm font-medium hover:bg-foreground transition-colors">
          <Plus size={14} />New deliverable
        </button>
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
        <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="bg-card border border-border rounded-xl h-16 animate-pulse" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="bg-card border border-border rounded-xl py-16 text-center">
          <CheckSquare size={32} className="mx-auto mb-3 text-muted-foreground/30" />
          <p className="text-sm text-muted-foreground">{items.length === 0 ? 'No deliverables yet.' : 'No deliverables match this filter.'}</p>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b border-border">
              <tr>{['Deliverable', 'Deal', 'Type', 'Deadline', 'Status', 'Revisions', ''].map(h => <th key={h} className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">{h}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map(d => (
                <tr key={d.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-medium text-foreground">{d.title}</p>
                    {d.platform && <p className="text-xs text-muted-foreground">{d.platform}</p>}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">{d.creator_deals?.brand_name ?? '—'}</td>
                  <td className="px-4 py-3">
                    <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full">{d.type.replace(/_/g, ' ')}</span>
                  </td>
                  <td className="px-4 py-3">
                    {d.deadline ? (
                      <span className={`text-xs font-medium ${isOverdue(d.deadline) && d.status !== 'completed' && d.status !== 'posted' ? 'text-red-400' : 'text-muted-foreground'}`}>
                        {fmtDate(d.deadline)}
                      </span>
                    ) : <span className="text-muted-foreground/50">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={d.status}
                      onChange={e => updateStatus(d.id, e.target.value)}
                      className={`text-xs font-medium px-2 py-1 rounded-full border-0 cursor-pointer ${STATUS_COLORS[d.status] ?? 'bg-muted text-muted-foreground'} focus:outline-none`}
                    >
                      {STATUSES.map(s => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
                    </select>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">{d.revision_count}</td>
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
              <h2 className="font-semibold text-foreground">{editing ? 'Edit deliverable' : 'New deliverable'}</h2>
              <button onClick={() => setShowForm(false)} className="text-muted-foreground hover:text-foreground"><X size={18} /></button>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Title *</label>
                <input value={form.title} onChange={e => set('title')(e.target.value)} placeholder="Spring Reel — Nike" className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand/40" />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Linked deal</label>
                <select value={form.deal_id} onChange={e => set('deal_id')(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-brand/40">
                  <option value="">— None —</option>
                  {deals.map(d => <option key={d.id} value={d.id}>{d.brand_name} — {d.title}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Type</label>
                  <select value={form.type} onChange={e => set('type')(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-brand/40">
                    {TYPES.map(t => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Platform</label>
                  <select value={form.platform} onChange={e => set('platform')(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-brand/40">
                    {PLATFORMS.map(p => <option key={p}>{p}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Deadline</label>
                  <input value={form.deadline} onChange={e => set('deadline')(e.target.value)} type="date" className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-brand/40" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Posting date</label>
                  <input value={form.posting_date} onChange={e => set('posting_date')(e.target.value)} type="date" className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-brand/40" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Status</label>
                  <select value={form.status} onChange={e => set('status')(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-brand/40">
                    {STATUSES.map(s => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Price (optional)</label>
                  <input value={form.price} onChange={e => set('price')(e.target.value)} type="number" placeholder="500" className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand/40" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Post URL</label>
                <input value={form.post_url} onChange={e => set('post_url')(e.target.value)} placeholder="https://instagram.com/p/..." className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand/40" />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Description</label>
                <textarea value={form.description} onChange={e => set('description')(e.target.value)} rows={3} placeholder="Brief notes about this deliverable..." className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand/40 resize-none" />
              </div>
            </div>
            <div className="px-6 py-4 border-t border-border flex gap-3 shrink-0">
              <button onClick={() => setShowForm(false)} className="flex-1 px-4 py-2 rounded-lg border border-border text-sm font-medium text-muted-foreground hover:bg-muted transition-colors">Cancel</button>
              <button onClick={save} disabled={saving || !form.title.trim()} className="flex-1 bg-foreground/90 text-background py-2 rounded-lg text-sm font-semibold hover:bg-foreground transition-colors disabled:opacity-50">
                {saving ? 'Saving…' : editing ? 'Save changes' : 'Add deliverable'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
