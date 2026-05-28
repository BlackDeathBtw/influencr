'use client'

import { useState, useEffect } from 'react'
import { Plus, Pencil, Trash2, X, ScrollText, Download, ExternalLink, AlertCircle } from 'lucide-react'

interface Contract {
  id: string
  brand_name: string
  value: number | null
  currency: string
  start_date: string | null
  end_date: string | null
  payment_terms_days: number | null
  deliverables_summary: string | null
  usage_rights: string | null
  exclusivity: boolean
  revisions: number | null
  cancellation_notice: string | null
  file_url: string | null
  status: string
  signed_at: string | null
  notes: string | null
  deal_id: string | null
  creator_deals: { title: string } | null
}

const STATUSES = ['draft','sent','under_review','signed','expired','cancelled']
const STATUS_COLORS: Record<string, string> = {
  draft:        'bg-muted text-muted-foreground',
  sent:         'bg-sky-500/15 text-sky-400',
  under_review: 'bg-amber-500/15 text-amber-400',
  signed:       'bg-green-500/15 text-green-400',
  expired:      'bg-red-500/15 text-red-400',
  cancelled:    'bg-red-500/15 text-red-400',
}

const EMPTY = {
  brand_name: '', value: '', currency: 'USD', start_date: '', end_date: '',
  payment_terms_days: '30', deliverables_summary: '', usage_rights: '',
  exclusivity: false, revisions: '', cancellation_notice: '', file_url: '',
  status: 'draft', notes: '', deal_id: '',
}

function fmtDate(d: string | null) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}
function fmt(v: number | null) { return v ? `$${Number(v).toLocaleString()}` : '—' }

export default function ContractsPage() {
  const [items, setItems] = useState<Contract[]>([])
  const [deals, setDeals] = useState<Array<{ id: string; title: string; brand_name: string }>>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Contract | null>(null)
  const [form, setForm] = useState({ ...EMPTY })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    Promise.all([
      fetch('/api/creator-deal-contracts').then(r => r.json()),
      fetch('/api/creator-deals').then(r => r.json()),
    ]).then(([c, d]) => { setItems(c); setDeals(d) }).finally(() => setLoading(false))
  }, [])

  function openNew() { setForm({ ...EMPTY }); setEditing(null); setShowForm(true) }
  function openEdit(c: Contract) {
    setForm({
      ...c,
      value: c.value?.toString() ?? '',
      payment_terms_days: c.payment_terms_days?.toString() ?? '30',
      revisions: c.revisions?.toString() ?? '',
      start_date: c.start_date ?? '',
      end_date: c.end_date ?? '',
      deliverables_summary: c.deliverables_summary ?? '',
      usage_rights: c.usage_rights ?? '',
      cancellation_notice: c.cancellation_notice ?? '',
      file_url: c.file_url ?? '',
      notes: c.notes ?? '',
      deal_id: c.deal_id ?? '',
    })
    setEditing(c); setShowForm(true)
  }
  function set(k: string) { return (v: string | boolean) => setForm(f => ({ ...f, [k]: v })) }

  async function save() {
    if (!form.brand_name.trim()) return
    setSaving(true)
    try {
      const payload = {
        ...form,
        value: form.value ? parseFloat(form.value) : null,
        payment_terms_days: form.payment_terms_days ? parseInt(form.payment_terms_days) : null,
        revisions: form.revisions ? parseInt(form.revisions) : null,
        deal_id: form.deal_id || null,
      }
      const method = editing ? 'PATCH' : 'POST'
      const url = editing ? `/api/creator-deal-contracts/${editing.id}` : '/api/creator-deal-contracts'
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      if (!res.ok) return
      fetch('/api/creator-deal-contracts').then(r => r.json()).then(setItems)
      setShowForm(false)
    } finally { setSaving(false) }
  }

  async function updateStatus(id: string, status: string) {
    const signed_at = status === 'signed' ? new Date().toISOString() : null
    const res = await fetch(`/api/creator-deal-contracts/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status, ...(signed_at && { signed_at }) }) })
    if (res.ok) fetch('/api/creator-deal-contracts').then(r => r.json()).then(setItems)
  }

  async function del(id: string) {
    if (!confirm('Delete this contract record?')) return
    await fetch(`/api/creator-deal-contracts/${id}`, { method: 'DELETE' })
    setItems(prev => prev.filter(c => c.id !== id))
  }

  return (
    <div className="p-8">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Contracts</h1>
          <p className="text-sm text-muted-foreground mt-1">{items.length} contract record{items.length !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={openNew} className="flex items-center gap-2 bg-foreground/90 text-background px-4 py-2 rounded-lg text-sm font-medium hover:bg-foreground transition-colors">
          <Plus size={14} />Add contract
        </button>
      </div>

      <div className="flex items-start gap-3 bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-3 mb-6">
        <AlertCircle size={15} className="text-amber-400 shrink-0 mt-0.5" />
        <p className="text-xs text-muted-foreground">
          <span className="font-semibold text-foreground">Disclaimer:</span> This tool is for organization only and does not constitute legal advice. Always consult a qualified attorney for legal matters.
        </p>
      </div>

      {loading ? (
        <div className="space-y-2">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="bg-card border border-border rounded-xl h-16 animate-pulse" />)}</div>
      ) : items.length === 0 ? (
        <div className="bg-card border border-border rounded-xl py-16 text-center">
          <ScrollText size={32} className="mx-auto mb-3 text-muted-foreground/30" />
          <p className="text-sm text-muted-foreground mb-4">No contracts tracked yet.</p>
          <button onClick={openNew} className="inline-flex items-center gap-2 bg-foreground/90 text-background px-4 py-2 rounded-lg text-sm font-medium hover:bg-foreground transition-colors"><Plus size={14} />Add contract</button>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b border-border">
              <tr>{['Brand', 'Deal', 'Value', 'Status', 'Period', 'Signed', ''].map(h => <th key={h} className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">{h}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-border">
              {items.map(c => (
                <tr key={c.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-medium text-foreground">{c.brand_name}</p>
                    {c.exclusivity && <span className="text-xs text-amber-400">Exclusive</span>}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">{c.creator_deals?.title ?? '—'}</td>
                  <td className="px-4 py-3 font-semibold text-foreground">{fmt(c.value)}</td>
                  <td className="px-4 py-3">
                    <select value={c.status} onChange={e => updateStatus(c.id, e.target.value)} className={`text-xs font-medium px-2 py-1 rounded-full border-0 cursor-pointer ${STATUS_COLORS[c.status] ?? 'bg-muted text-muted-foreground'} focus:outline-none`}>
                      {STATUSES.map(s => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
                    </select>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">{fmtDate(c.start_date)} — {fmtDate(c.end_date)}</td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">{fmtDate(c.signed_at)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 justify-end">
                      {c.file_url && <a href={c.file_url} target="_blank" rel="noopener noreferrer" className="p-1.5 text-muted-foreground/60 hover:text-foreground transition-colors"><ExternalLink size={13} /></a>}
                      <button onClick={() => openEdit(c)} className="p-1.5 text-muted-foreground/60 hover:text-foreground transition-colors"><Pencil size={13} /></button>
                      <button onClick={() => del(c.id)} className="p-1.5 text-muted-foreground/60 hover:text-red-400 transition-colors"><Trash2 size={13} /></button>
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
              <h2 className="font-semibold text-foreground">{editing ? 'Edit contract' : 'Add contract'}</h2>
              <button onClick={() => setShowForm(false)} className="text-muted-foreground hover:text-foreground"><X size={18} /></button>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Brand *</label>
                  <input value={form.brand_name} onChange={e => set('brand_name')(e.target.value)} placeholder="Nike" className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand/40" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Status</label>
                  <select value={form.status} onChange={e => set('status')(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-brand/40">
                    {STATUSES.map(s => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
                  </select>
                </div>
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
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Contract value</label>
                  <input value={form.value} onChange={e => set('value')(e.target.value)} type="number" placeholder="2500" className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand/40" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Payment terms (days)</label>
                  <input value={form.payment_terms_days} onChange={e => set('payment_terms_days')(e.target.value)} type="number" placeholder="30" className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand/40" />
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
                <label className="block text-xs font-medium text-muted-foreground mb-1">Deliverables summary</label>
                <textarea value={form.deliverables_summary} onChange={e => set('deliverables_summary')(e.target.value)} rows={2} placeholder="2x Instagram Reels, 1x YouTube integration..." className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand/40 resize-none" />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Usage rights</label>
                <input value={form.usage_rights} onChange={e => set('usage_rights')(e.target.value)} placeholder="Organic use, 12 months, worldwide" className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand/40" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Revisions allowed</label>
                  <input value={form.revisions} onChange={e => set('revisions')(e.target.value)} type="number" placeholder="2" className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand/40" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Cancellation notice</label>
                  <input value={form.cancellation_notice} onChange={e => set('cancellation_notice')(e.target.value)} placeholder="14 days written notice" className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand/40" />
                </div>
              </div>
              <div className="flex items-center gap-3">
                <input type="checkbox" id="excl" checked={form.exclusivity as boolean} onChange={e => set('exclusivity')(e.target.checked as unknown as string)} className="rounded border-border" />
                <label htmlFor="excl" className="text-sm text-foreground">Exclusivity clause</label>
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Contract file URL</label>
                <input value={form.file_url} onChange={e => set('file_url')(e.target.value)} placeholder="https://..." className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand/40" />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Notes</label>
                <textarea value={form.notes} onChange={e => set('notes')(e.target.value)} rows={2} className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand/40 resize-none" />
              </div>
            </div>
            <div className="px-6 py-4 border-t border-border flex gap-3 shrink-0">
              <button onClick={() => setShowForm(false)} className="flex-1 px-4 py-2 rounded-lg border border-border text-sm font-medium text-muted-foreground hover:bg-muted transition-colors">Cancel</button>
              <button onClick={save} disabled={saving || !form.brand_name.trim()} className="flex-1 bg-foreground/90 text-background py-2 rounded-lg text-sm font-semibold hover:bg-foreground transition-colors disabled:opacity-50">
                {saving ? 'Saving…' : editing ? 'Save changes' : 'Add contract'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
