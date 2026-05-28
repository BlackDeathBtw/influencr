'use client'

import { useState, useEffect } from 'react'
import { Plus, Pencil, Trash2, X, Shield } from 'lucide-react'

interface UsageRight {
  id: string
  brand_name: string
  deal_id: string | null
  usage_type: string
  platforms: string[]
  region: string | null
  start_date: string | null
  end_date: string | null
  fee: number | null
  renewal_option: boolean
  notes: string | null
  status: string
  creator_deals: { title: string } | null
}

const USAGE_TYPES = ['organic','paid_ads','website','whitelisting','print','broadcast','other']
const PLATFORMS = ['Instagram','TikTok','YouTube','Twitter','LinkedIn','Facebook','Web','Print']

const STATUS_COLORS: Record<string, string> = {
  active:         'bg-green-500/15 text-green-400',
  expiring_soon:  'bg-amber-500/15 text-amber-400',
  expired:        'bg-red-500/15 text-red-400',
}

function fmtDate(d: string | null) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function computeStatus(end_date: string | null): string {
  if (!end_date) return 'active'
  const end = new Date(end_date)
  const now = new Date()
  const days = (end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
  if (days < 0) return 'expired'
  if (days <= 30) return 'expiring_soon'
  return 'active'
}

const EMPTY = { brand_name: '', deal_id: '', usage_type: 'organic', platforms: [] as string[], region: '', start_date: '', end_date: '', fee: '', renewal_option: false, notes: '' }

export default function UsageRightsPage() {
  const [items, setItems] = useState<UsageRight[]>([])
  const [deals, setDeals] = useState<Array<{ id: string; title: string; brand_name: string }>>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<UsageRight | null>(null)
  const [form, setForm] = useState({ ...EMPTY })
  const [saving, setSaving] = useState(false)
  const [statusFilter, setStatusFilter] = useState('all')

  useEffect(() => {
    Promise.all([
      fetch('/api/creator-usage-rights').then(r => r.json()),
      fetch('/api/creator-deals').then(r => r.json()),
    ]).then(([u, d]) => { setItems(u); setDeals(d) }).finally(() => setLoading(false))
  }, [])

  function openNew() { setForm({ ...EMPTY }); setEditing(null); setShowForm(true) }
  function openEdit(u: UsageRight) {
    setForm({ ...u, fee: u.fee?.toString() ?? '', start_date: u.start_date ?? '', end_date: u.end_date ?? '', region: u.region ?? '', notes: u.notes ?? '', deal_id: u.deal_id ?? '', platforms: u.platforms ?? [] })
    setEditing(u); setShowForm(true)
  }
  function set(k: string) { return (v: string) => setForm(f => ({ ...f, [k]: v })) }
  function togglePlatform(p: string) {
    setForm(f => ({ ...f, platforms: f.platforms.includes(p) ? f.platforms.filter(x => x !== p) : [...f.platforms, p] }))
  }

  async function save() {
    if (!form.brand_name.trim()) return
    setSaving(true)
    try {
      const payload = { ...form, fee: form.fee ? parseFloat(form.fee) : null, deal_id: form.deal_id || null, end_date: form.end_date || null, start_date: form.start_date || null, region: form.region || null }
      const method = editing ? 'PATCH' : 'POST'
      const url = editing ? `/api/creator-usage-rights/${editing.id}` : '/api/creator-usage-rights'
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      if (!res.ok) return
      fetch('/api/creator-usage-rights').then(r => r.json()).then(setItems)
      setShowForm(false)
    } finally { setSaving(false) }
  }

  async function del(id: string) {
    if (!confirm('Delete this usage right?')) return
    await fetch(`/api/creator-usage-rights/${id}`, { method: 'DELETE' })
    setItems(prev => prev.filter(u => u.id !== id))
  }

  const withStatus = items.map(u => ({ ...u, status: u.status ?? computeStatus(u.end_date) }))
  const filtered = statusFilter === 'all' ? withStatus : withStatus.filter(u => u.status === statusFilter)

  return (
    <div className="p-8">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Usage Rights</h1>
          <p className="text-sm text-muted-foreground mt-1">Track how brands can use your content</p>
        </div>
        <button onClick={openNew} className="flex items-center gap-2 bg-foreground/90 text-background px-4 py-2 rounded-lg text-sm font-medium hover:bg-foreground transition-colors">
          <Plus size={14} />Add usage right
        </button>
      </div>

      <div className="flex flex-wrap gap-1.5 mb-5">
        {['all','active','expiring_soon','expired'].map(s => (
          <button key={s} onClick={() => setStatusFilter(s)} className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${statusFilter === s ? 'bg-foreground text-background' : s === 'all' ? 'bg-muted text-muted-foreground hover:bg-muted/80' : `${STATUS_COLORS[s]} hover:opacity-80`}`}>
            {s.replace(/_/g, ' ')}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="bg-card border border-border rounded-xl h-14 animate-pulse" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="bg-card border border-border rounded-xl py-16 text-center">
          <Shield size={32} className="mx-auto mb-3 text-muted-foreground/30" />
          <p className="text-sm text-muted-foreground">{items.length === 0 ? 'No usage rights tracked yet.' : 'No usage rights match this filter.'}</p>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b border-border">
              <tr>{['Brand', 'Usage type', 'Platforms', 'Region', 'Expires', 'Fee', 'Status', ''].map(h => <th key={h} className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">{h}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map(u => (
                <tr key={u.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-medium text-foreground">{u.brand_name}</p>
                    {u.creator_deals && <p className="text-xs text-muted-foreground">{u.creator_deals.title}</p>}
                  </td>
                  <td className="px-4 py-3"><span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full">{u.usage_type.replace(/_/g, ' ')}</span></td>
                  <td className="px-4 py-3 text-xs text-muted-foreground max-w-[120px] truncate">{u.platforms?.join(', ') || '—'}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{u.region ?? '—'}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{fmtDate(u.end_date)}</td>
                  <td className="px-4 py-3 text-xs font-medium text-foreground">{u.fee ? `$${Number(u.fee).toLocaleString()}` : '—'}</td>
                  <td className="px-4 py-3"><span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_COLORS[u.status] ?? 'bg-muted text-muted-foreground'}`}>{u.status.replace(/_/g, ' ')}</span></td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 justify-end">
                      <button onClick={() => openEdit(u)} className="p-1.5 text-muted-foreground/60 hover:text-foreground transition-colors"><Pencil size={13} /></button>
                      <button onClick={() => del(u.id)} className="p-1.5 text-muted-foreground/60 hover:text-red-400 transition-colors"><Trash2 size={13} /></button>
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
              <h2 className="font-semibold text-foreground">{editing ? 'Edit usage right' : 'Add usage right'}</h2>
              <button onClick={() => setShowForm(false)} className="text-muted-foreground hover:text-foreground"><X size={18} /></button>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Brand *</label>
                <input value={form.brand_name} onChange={e => set('brand_name')(e.target.value)} placeholder="Nike" className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand/40" />
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
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Usage type</label>
                  <select value={form.usage_type} onChange={e => set('usage_type')(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-brand/40">
                    {USAGE_TYPES.map(t => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Region</label>
                  <input value={form.region} onChange={e => set('region')(e.target.value)} placeholder="Global / DACH / EU…" className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand/40" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-2">Platforms</label>
                <div className="flex flex-wrap gap-2">
                  {PLATFORMS.map(p => (
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
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Fee ($)</label>
                  <input value={form.fee} onChange={e => set('fee')(e.target.value)} type="number" placeholder="500" className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand/40" />
                </div>
                <div className="flex items-end pb-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={form.renewal_option} onChange={e => setForm(f => ({ ...f, renewal_option: e.target.checked }))} className="w-4 h-4 rounded border-border" />
                    <span className="text-xs font-medium text-muted-foreground">Renewal option</span>
                  </label>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Notes</label>
                <textarea value={form.notes} onChange={e => set('notes')(e.target.value)} rows={3} className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand/40 resize-none" />
              </div>
            </div>
            <div className="px-6 py-4 border-t border-border flex gap-3 shrink-0">
              <button onClick={() => setShowForm(false)} className="flex-1 px-4 py-2 rounded-lg border border-border text-sm font-medium text-muted-foreground hover:bg-muted transition-colors">Cancel</button>
              <button onClick={save} disabled={saving || !form.brand_name.trim()} className="flex-1 bg-foreground/90 text-background py-2 rounded-lg text-sm font-semibold hover:bg-foreground transition-colors disabled:opacity-50">
                {saving ? 'Saving…' : editing ? 'Save changes' : 'Add usage right'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
