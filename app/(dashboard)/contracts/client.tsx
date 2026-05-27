'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Pencil, Trash2, Send, CheckCircle2, Download, Link } from 'lucide-react'
import type { Contract } from '@/types'

interface SimpleInfluencer { id: string; name: string }
interface SimpleCampaign { id: string; name: string }

interface Props {
  contracts: Contract[]
  influencers: SimpleInfluencer[]
  campaigns: SimpleCampaign[]
}

const STATUS_STYLES: Record<string, string> = {
  draft: 'bg-muted text-muted-foreground',
  sent: 'bg-amber-100 text-amber-700',
  signed: 'bg-green-100 text-green-700',
  declined: 'bg-red-100 text-red-700',
}

const CONTRACT_TEMPLATE =
`INFLUENCER COLLABORATION AGREEMENT

This agreement is entered into as of [DATE] between [BRAND] ("Brand") and [CREATOR] ("Creator").

1. DELIVERABLES
   Creator will produce and publish the following content:
   - [describe content type and count]
   - Platform: [platform]
   - Due date: [DEADLINE]

2. COMPENSATION
   Brand will pay Creator [RATE] upon completion of deliverables.

3. USAGE RIGHTS
   Brand receives a 12-month license to repurpose the content across owned channels.

4. FTC COMPLIANCE
   Creator will disclose the partnership using #ad or #sponsored in all content.

5. APPROVAL PROCESS
   All content must be approved by Brand 48 hours prior to publishing.

Signed:
Brand: ___________________________  Date: ________
Creator: _________________________  Date: ________`

async function downloadContractPDF(contract: Contract) {
  const { jsPDF } = await import('jspdf')
  const doc = new jsPDF({ unit: 'pt', format: 'a4' })

  const margin = 60
  const pageWidth = doc.internal.pageSize.getWidth()
  const maxWidth = pageWidth - margin * 2
  let y = margin

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(16)
  doc.text(contract.title, margin, y)
  y += 30

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.setTextColor(120, 120, 120)
  doc.text(`Generated ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`, margin, y)
  y += 24

  doc.setDrawColor(220, 220, 220)
  doc.line(margin, y, pageWidth - margin, y)
  y += 20

  doc.setTextColor(30, 30, 30)
  doc.setFontSize(11)
  const lines = doc.splitTextToSize(contract.content, maxWidth)
  for (const line of lines) {
    if (y > doc.internal.pageSize.getHeight() - margin) {
      doc.addPage()
      y = margin
    }
    doc.text(line, margin, y)
    y += 16
  }

  const filename = contract.title.replace(/[^a-z0-9]/gi, '-').toLowerCase() + '.pdf'
  doc.save(filename)
}

export default function ContractsClient({ contracts: initialContracts, influencers, campaigns }: Props) {
  const router = useRouter()
  const [contracts, setContracts] = useState(initialContracts)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Contract | null>(null)
  const [form, setForm] = useState({
    title: '',
    content: CONTRACT_TEMPLATE,
    influencer_id: '',
    campaign_id: '',
  })
  const [saving, setSaving] = useState(false)
  const [preview, setPreview] = useState<Contract | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  function copySignLink(c: Contract) {
    if (!c.sign_token) return
    const url = `${window.location.origin}/sign/${c.sign_token}`
    navigator.clipboard.writeText(url)
    setCopiedId(c.id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  function openNew() {
    setEditing(null)
    setForm({ title: '', content: CONTRACT_TEMPLATE, influencer_id: '', campaign_id: '' })
    setShowForm(true)
    setPreview(null)
  }

  function openEdit(c: Contract) {
    setEditing(c)
    setForm({
      title: c.title,
      content: c.content,
      influencer_id: c.influencer_id ?? '',
      campaign_id: c.campaign_id ?? '',
    })
    setShowForm(true)
    setPreview(null)
  }

  async function save() {
    if (!form.title.trim()) return
    setSaving(true)

    const payload = {
      title: form.title,
      content: form.content,
      influencer_id: form.influencer_id || null,
      campaign_id: form.campaign_id || null,
    }

    if (editing) {
      const res = await fetch(`/api/contracts/${editing.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (res.ok) {
        const updated = await res.json()
        setContracts(cs => cs.map(c => c.id === updated.id ? updated : c))
      }
    } else {
      const res = await fetch('/api/contracts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (res.ok) {
        const created = await res.json()
        setContracts(cs => [created, ...cs])
      }
    }

    setSaving(false)
    setShowForm(false)
    router.refresh()
  }

  async function updateStatus(c: Contract, status: string) {
    const extra: Record<string, string> = {}
    if (status === 'sent') extra.sent_at = new Date().toISOString()
    if (status === 'signed') extra.signed_at = new Date().toISOString()

    const res = await fetch(`/api/contracts/${c.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, ...extra }),
    })
    if (res.ok) {
      const updated = await res.json()
      setContracts(cs => cs.map(x => x.id === updated.id ? updated : x))
    }
  }

  async function remove(id: string) {
    if (!confirm('Delete this contract?')) return
    await fetch(`/api/contracts/${id}`, { method: 'DELETE' })
    setContracts(cs => cs.filter(c => c.id !== id))
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Contracts</h1>
          <p className="text-sm text-muted-foreground mt-1">{contracts.length} contract{contracts.length !== 1 ? 's' : ''}</p>
        </div>
        <button
          onClick={openNew}
          className="flex items-center gap-2 bg-foreground/90 text-background px-4 py-2 rounded-lg text-sm font-medium hover:bg-foreground transition-colors"
        >
          <Plus size={15} /> New contract
        </button>
      </div>

      {showForm && (
        <div className="mb-6 bg-card border border-border rounded-xl p-6 space-y-4">
          <h2 className="font-semibold text-foreground">{editing ? 'Edit contract' : 'New contract'}</h2>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Title *</label>
            <input
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              placeholder="e.g. Spring Campaign — Alex Rivera"
              className="w-full px-3 py-2 border border-border rounded-lg text-sm"
            />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Influencer (optional)</label>
              <select
                value={form.influencer_id}
                onChange={e => setForm(f => ({ ...f, influencer_id: e.target.value }))}
                className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-card"
              >
                <option value="">— none —</option>
                {influencers.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Campaign (optional)</label>
              <select
                value={form.campaign_id}
                onChange={e => setForm(f => ({ ...f, campaign_id: e.target.value }))}
                className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-card"
              >
                <option value="">— none —</option>
                {campaigns.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Contract body</label>
            <textarea
              value={form.content}
              onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
              rows={16}
              className="w-full px-3 py-2 border border-border rounded-lg text-sm font-mono resize-y"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={save}
              disabled={!form.title.trim() || saving}
              className="bg-foreground/90 text-background px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50"
            >
              {saving ? 'Saving…' : 'Save contract'}
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="border border-border text-muted-foreground px-4 py-2 rounded-lg text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {preview && (
        <div className="mb-6 bg-card border border-border rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-foreground">{preview.title}</h2>
            <button onClick={() => setPreview(null)} className="text-xs text-muted-foreground/70 hover:text-muted-foreground">
              Close
            </button>
          </div>
          <pre className="text-sm text-foreground/80 whitespace-pre-wrap font-mono leading-relaxed border border-border rounded-lg p-4 bg-background">
            {preview.content}
          </pre>
        </div>
      )}

      {contracts.length === 0 ? (
        <div className="bg-card border border-border rounded-xl py-16 text-center">
          <p className="text-muted-foreground/70 text-sm mb-4">No contracts yet</p>
          <button
            onClick={openNew}
            className="inline-flex items-center gap-2 bg-foreground/90 text-background px-4 py-2 rounded-lg text-sm font-medium"
          >
            <Plus size={15} /> Create first contract
          </button>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-xl divide-y divide-border">
          {contracts.map(c => (
            <div key={c.id} className="flex items-center gap-4 px-5 py-4">
              <div className="flex-1 min-w-0">
                <button
                  onClick={() => setPreview(preview?.id === c.id ? null : c)}
                  className="font-medium text-foreground text-sm hover:underline text-left"
                >
                  {c.title}
                </button>
                <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground/70">
                  {c.influencer && <span>{(c.influencer as { name: string }).name}</span>}
                  {c.influencer && c.campaign && <span>·</span>}
                  {c.campaign && <span>{(c.campaign as { name: string }).name}</span>}
                  <span>·</span>
                  <span>{new Date(c.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_STYLES[c.status]}`}>
                  {c.status}
                </span>
                {c.status === 'draft' && (
                  <button
                    onClick={() => updateStatus(c, 'sent')}
                    className="p-1.5 text-muted-foreground/70 hover:text-amber-600 transition-colors"
                    title="Mark as sent"
                  >
                    <Send size={13} />
                  </button>
                )}
                {c.status === 'sent' && (
                  <button
                    onClick={() => updateStatus(c, 'signed')}
                    className="p-1.5 text-muted-foreground/70 hover:text-green-600 transition-colors"
                    title="Mark as signed"
                  >
                    <CheckCircle2 size={13} />
                  </button>
                )}
                <button
                  onClick={() => downloadContractPDF(c)}
                  className="p-1.5 text-muted-foreground/70 hover:text-foreground/80 transition-colors"
                  title="Download PDF"
                >
                  <Download size={13} />
                </button>
                {c.sign_token && (
                  <button
                    onClick={() => copySignLink(c)}
                    className="p-1.5 text-muted-foreground/70 hover:text-foreground/80 transition-colors"
                    title={copiedId === c.id ? 'Copied!' : 'Copy sign link'}
                  >
                    <Link size={13} className={copiedId === c.id ? 'text-green-600' : ''} />
                  </button>
                )}
                <button
                  onClick={() => openEdit(c)}
                  className="p-1.5 text-muted-foreground/70 hover:text-foreground/80 transition-colors"
                >
                  <Pencil size={13} />
                </button>
                <button
                  onClick={() => remove(c.id)}
                  className="p-1.5 text-muted-foreground/70 hover:text-red-500 transition-colors"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
