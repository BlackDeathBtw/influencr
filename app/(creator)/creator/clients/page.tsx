'use client'

import { useState, useEffect } from 'react'
import { Plus, Pencil, Trash2, X, Globe, Mail, Phone, Building2 } from 'lucide-react'

interface Client {
  id: string
  brand_name: string
  website: string | null
  contact_name: string | null
  email: string | null
  phone: string | null
  address: string | null
  country: string | null
  vat_id: string | null
  payment_terms_days: number | null
  currency: string | null
  notes: string | null
  created_at: string
}

const EMPTY: Omit<Client, 'id' | 'created_at'> = {
  brand_name: '', website: '', contact_name: '', email: '', phone: '',
  address: '', country: '', vat_id: '', payment_terms_days: 30, currency: 'USD', notes: '',
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-muted-foreground mb-1">{label}</label>
      {value}
    </div>
  )
}

function Input({ value, onChange, placeholder, type = 'text' }: { value: string | number; onChange: (v: string) => void; placeholder?: string; type?: string }) {
  return (
    <input
      type={type}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand/40"
    />
  )
}

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Client | null>(null)
  const [form, setForm] = useState({ ...EMPTY })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetch('/api/creator-clients').then(r => r.json()).then(setClients).finally(() => setLoading(false))
  }, [])

  function openNew() { setForm({ ...EMPTY }); setEditing(null); setShowForm(true) }
  function openEdit(c: Client) { setForm({ ...c }); setEditing(c); setShowForm(true) }
  function set(k: keyof typeof EMPTY) { return (v: string) => setForm(f => ({ ...f, [k]: v })) }

  async function save() {
    if (!form.brand_name.trim()) return
    setSaving(true)
    try {
      const method = editing ? 'PATCH' : 'POST'
      const url = editing ? `/api/creator-clients/${editing.id}` : '/api/creator-clients'
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
      if (!res.ok) return
      const saved = await res.json()
      setClients(prev => editing ? prev.map(c => c.id === saved.id ? saved : c) : [saved, ...prev])
      setShowForm(false)
    } finally { setSaving(false) }
  }

  async function del(id: string) {
    if (!confirm('Delete this client? This cannot be undone.')) return
    await fetch(`/api/creator-clients/${id}`, { method: 'DELETE' })
    setClients(prev => prev.filter(c => c.id !== id))
  }

  return (
    <div className="p-8">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Clients</h1>
          <p className="text-sm text-muted-foreground mt-1">{clients.length} brand{clients.length !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={openNew} className="flex items-center gap-2 bg-foreground/90 text-background px-4 py-2 rounded-lg text-sm font-medium hover:bg-foreground transition-colors">
          <Plus size={14} />New client
        </button>
      </div>

      {loading ? (
        <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="bg-card border border-border rounded-xl h-16 animate-pulse" />)}</div>
      ) : clients.length === 0 ? (
        <div className="bg-card border border-border rounded-xl py-16 text-center">
          <Building2 size={32} className="mx-auto mb-3 text-muted-foreground/30" />
          <p className="text-sm text-muted-foreground mb-4">No clients yet. Add your first brand.</p>
          <button onClick={openNew} className="inline-flex items-center gap-2 bg-foreground/90 text-background px-4 py-2 rounded-lg text-sm font-medium hover:bg-foreground transition-colors"><Plus size={14} />Add client</button>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b border-border">
              <tr>
                {['Brand', 'Contact', 'Email', 'Country', 'Terms', ''].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {clients.map(c => (
                <tr key={c.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-medium text-foreground">{c.brand_name}</p>
                    {c.website && <a href={c.website} target="_blank" rel="noopener noreferrer" className="text-xs text-muted-foreground hover:text-brand flex items-center gap-1"><Globe size={10} />{c.website.replace(/^https?:\/\//, '')}</a>}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{c.contact_name ?? '—'}</td>
                  <td className="px-4 py-3">
                    {c.email ? <a href={`mailto:${c.email}`} className="text-muted-foreground hover:text-foreground flex items-center gap-1"><Mail size={11} />{c.email}</a> : <span className="text-muted-foreground/50">—</span>}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{c.country ?? '—'}</td>
                  <td className="px-4 py-3 text-muted-foreground">{c.payment_terms_days ? `Net ${c.payment_terms_days}` : '—'}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 justify-end">
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
              <h2 className="font-semibold text-foreground">{editing ? 'Edit client' : 'New client'}</h2>
              <button onClick={() => setShowForm(false)} className="text-muted-foreground hover:text-foreground"><X size={18} /></button>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
              <Field label="Brand name *" value={<Input value={form.brand_name} onChange={set('brand_name')} placeholder="Nike Running" />} />
              <Field label="Website" value={<Input value={form.website ?? ''} onChange={set('website')} placeholder="https://brand.com" />} />
              <div className="grid grid-cols-2 gap-3">
                <Field label="Contact name" value={<Input value={form.contact_name ?? ''} onChange={set('contact_name')} placeholder="Jane Smith" />} />
                <Field label="Email" value={<Input value={form.email ?? ''} onChange={set('email')} placeholder="deals@brand.com" type="email" />} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Phone" value={<Input value={form.phone ?? ''} onChange={set('phone')} placeholder="+1 555 000 0000" />} />
                <Field label="Country" value={<Input value={form.country ?? ''} onChange={set('country')} placeholder="United States" />} />
              </div>
              <Field label="Address" value={<Input value={form.address ?? ''} onChange={set('address')} placeholder="123 Main St, New York, NY" />} />
              <div className="grid grid-cols-2 gap-3">
                <Field label="VAT ID (optional)" value={<Input value={form.vat_id ?? ''} onChange={set('vat_id')} placeholder="DE123456789" />} />
                <Field label="Payment terms (days)" value={<Input value={form.payment_terms_days ?? 30} onChange={set('payment_terms_days')} type="number" />} />
              </div>
              <Field label="Currency" value={
                <select value={form.currency ?? 'USD'} onChange={e => set('currency')(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-brand/40">
                  {['USD','EUR','GBP','CHF','CAD','AUD'].map(c => <option key={c}>{c}</option>)}
                </select>
              } />
              <Field label="Notes" value={
                <textarea value={form.notes ?? ''} onChange={e => set('notes')(e.target.value)} rows={3} placeholder="Any notes about this client..." className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand/40 resize-none" />
              } />
            </div>
            <div className="px-6 py-4 border-t border-border flex gap-3 shrink-0">
              <button onClick={() => setShowForm(false)} className="flex-1 px-4 py-2 rounded-lg border border-border text-sm font-medium text-muted-foreground hover:bg-muted transition-colors">Cancel</button>
              <button onClick={save} disabled={saving || !form.brand_name.trim()} className="flex-1 bg-foreground/90 text-background py-2 rounded-lg text-sm font-semibold hover:bg-foreground transition-colors disabled:opacity-50">
                {saving ? 'Saving…' : editing ? 'Save changes' : 'Add client'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
