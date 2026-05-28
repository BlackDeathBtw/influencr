'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Copy, Pencil, Trash2, Check, Send, X, Loader2, Users } from 'lucide-react'
import type { OutreachTemplate, Influencer, OutreachLog } from '@/types'
import OutreachSequences from '@/components/outreach-sequences'

const PLATFORMS = ['any', 'instagram', 'tiktok', 'youtube', 'twitter', 'linkedin', 'email']

const DEFAULT_TEMPLATE = `Hi {{name}},

I came across your content and think you'd be a great fit for our upcoming campaign.

We're looking for creators in the {{niche}} space who can authentically showcase our product to their audience.

Here's what we're offering:
- Compensation: {{rate}}
- Deliverables: 1 post + 1 story
- Timeline: flexible

Would you be open to a quick chat this week?

Best,
{{sender}}`

type Tab = 'templates' | 'sequences' | 'sent'

interface SequenceData {
  id: string
  name: string
  description: string | null
  steps: Array<{ delay_days: number; subject: string; body: string }>
  created_at: string
}

interface Props {
  templates: OutreachTemplate[]
  influencers: Pick<Influencer, 'id' | 'name' | 'handle' | 'niche' | 'platform' | 'contact_email'>[]
  logs: OutreachLog[]
  sequences: SequenceData[]
}

function TrackingBadge({ log }: { log: OutreachLog }) {
  if (log.status === 'clicked' || log.clicked_at) return <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-600 font-medium">Clicked</span>
  if (log.status === 'opened' || log.opened_at) return <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-500/15 text-green-600 font-medium">Opened</span>
  if (log.status === 'bounced') return <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-500/15 text-red-600 font-medium">Bounced</span>
  return <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-medium">Sent</span>
}

function substituteVars(text: string, inf: Props['influencers'][0]): string {
  return text
    .replace(/\{\{name\}\}/g, inf.name)
    .replace(/\{\{handle\}\}/g, inf.handle ?? '')
    .replace(/\{\{niche\}\}/g, inf.niche ?? '')
    .replace(/\{\{platform\}\}/g, inf.platform ?? '')
}

export default function OutreachClient({ templates: initialTemplates, influencers, logs, sequences }: Props) {
  const router = useRouter()
  const [tab, setTab] = useState<Tab>('templates')
  const [templates, setTemplates] = useState(initialTemplates)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<OutreachTemplate | null>(null)
  const [form, setForm] = useState({ name: '', subject: '', body: DEFAULT_TEMPLATE, platform: 'any' })
  const [saving, setSaving] = useState(false)
  const [copied, setCopied] = useState<string | null>(null)

  // Single send state
  const [sendingFor, setSendingFor] = useState<string | null>(null)
  const [sendForm, setSendForm] = useState<{ influencer_id: string; subject: string; body: string }>({ influencer_id: '', subject: '', body: '' })
  const [sending, setSending] = useState(false)
  const [sentConfirm, setSentConfirm] = useState<string | null>(null)
  const [sendError, setSendError] = useState<string | null>(null)

  // Bulk send state
  const [bulkFor, setBulkFor] = useState<string | null>(null)
  const [bulkSelected, setBulkSelected] = useState<Set<string>>(new Set())
  const [bulkSending, setBulkSending] = useState(false)
  const [bulkResult, setBulkResult] = useState<{ sent: number; skipped: number; failed: number } | null>(null)

  function openSend(t: OutreachTemplate) { setSendingFor(t.id); setSendForm({ influencer_id: '', subject: t.subject ?? '', body: t.body }); setSendError(null) }
  function closeSend() { setSendingFor(null); setSendError(null) }

  function onInfluencerChange(templateId: string, influencerId: string) {
    const template = templates.find(t => t.id === templateId)
    const inf = influencers.find(i => i.id === influencerId)
    if (!template || !inf) { setSendForm(f => ({ ...f, influencer_id: influencerId })); return }
    setSendForm({ influencer_id: influencerId, subject: template.subject ?? '', body: substituteVars(template.body, inf) })
  }

  async function sendEmail(t: OutreachTemplate) {
    const inf = influencers.find(i => i.id === sendForm.influencer_id)
    if (!inf) { setSendError('Select an influencer'); return }
    if (!inf.contact_email) { setSendError(`${inf.name} has no email address — add one on their profile first`); return }
    if (!sendForm.subject.trim()) { setSendError('Subject is required'); return }
    setSending(true); setSendError(null)
    const res = await fetch('/api/outreach/send', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ template_id: t.id, influencer_id: inf.id, to_email: inf.contact_email, subject: sendForm.subject, body: sendForm.body }) })
    const data = await res.json()
    setSending(false)
    if (!res.ok) { setSendError(data.error ?? 'Failed to send'); return }
    setSentConfirm(t.id); closeSend(); setTimeout(() => setSentConfirm(null), 3000)
  }

  async function sendBulk(templateId: string) {
    if (bulkSelected.size === 0) return
    setBulkSending(true); setBulkResult(null)
    const res = await fetch('/api/outreach/bulk-send', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ template_id: templateId, influencer_ids: Array.from(bulkSelected) }) })
    if (res.ok) { setBulkResult(await res.json()); setBulkSelected(new Set()) }
    setBulkSending(false)
  }

  function openNew() { setEditing(null); setForm({ name: '', subject: '', body: DEFAULT_TEMPLATE, platform: 'any' }); setShowForm(true); closeSend() }
  function openEdit(t: OutreachTemplate) { setEditing(t); setForm({ name: t.name, subject: t.subject ?? '', body: t.body, platform: t.platform ?? 'any' }); setShowForm(true); closeSend() }

  async function save() {
    if (!form.name.trim() || !form.body.trim()) return
    setSaving(true)
    const payload = { name: form.name, subject: form.subject || null, body: form.body, platform: form.platform === 'any' ? null : form.platform }
    if (editing) {
      const res = await fetch(`/api/outreach/${editing.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      if (res.ok) { const updated = await res.json(); setTemplates(ts => ts.map(t => t.id === updated.id ? updated : t)) }
    } else {
      const res = await fetch('/api/outreach', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      if (res.ok) { const created = await res.json(); setTemplates(ts => [created, ...ts]) }
    }
    setSaving(false); setShowForm(false); router.refresh()
  }

  async function remove(id: string) {
    if (!confirm('Delete this template?')) return
    await fetch(`/api/outreach/${id}`, { method: 'DELETE' })
    setTemplates(ts => ts.filter(t => t.id !== id))
  }

  function copyBody(t: OutreachTemplate) { navigator.clipboard.writeText(t.body); setCopied(t.id); setTimeout(() => setCopied(null), 2000) }

  const influencersWithEmail = influencers.filter(i => i.contact_email)

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-foreground">Outreach</h1>
        {tab === 'templates' && (
          <button onClick={openNew} className="flex items-center gap-2 bg-foreground/90 text-background px-4 py-2 rounded-lg text-sm font-medium hover:bg-foreground transition-colors">
            <Plus size={15} /> New template
          </button>
        )}
      </div>

      <div className="flex gap-1 bg-muted rounded-lg p-1 w-fit mb-6">
        {(['templates', 'sequences', 'sent'] as Tab[]).map(t => (
          <button key={t} onClick={() => setTab(t)} className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors capitalize ${tab === t ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>
            {t}
            {t === 'templates' && templates.length > 0 && <span className="ml-1.5 text-xs text-muted-foreground">{templates.length}</span>}
            {t === 'sequences' && sequences.length > 0 && <span className="ml-1.5 text-xs text-muted-foreground">{sequences.length}</span>}
            {t === 'sent' && logs.length > 0 && <span className="ml-1.5 text-xs text-muted-foreground">{logs.length}</span>}
          </button>
        ))}
      </div>

      {tab === 'sequences' && (
        <OutreachSequences initialSequences={sequences} influencers={influencersWithEmail} />
      )}

      {tab === 'sent' && (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          {logs.length === 0 ? (
            <div className="py-16 text-center"><p className="text-muted-foreground/70 text-sm">No emails sent yet</p></div>
          ) : (
            <div className="divide-y divide-border">
              {logs.map((log) => (
                <div key={log.id} className="flex items-center justify-between px-5 py-3.5 hover:bg-muted/20 transition-colors">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground truncate">{(log.influencer as { name: string } | null)?.name ?? log.to_email}</p>
                    <p className="text-xs text-muted-foreground truncate max-w-sm">{log.subject}</p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0 ml-4">
                    <TrackingBadge log={log} />
                    <span className="text-xs text-muted-foreground">{new Date(log.sent_at).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'templates' && (
        <div>
          {showForm && (
            <div className="mb-6 bg-card border border-border rounded-xl p-6 space-y-4">
              <h2 className="font-semibold text-foreground">{editing ? 'Edit template' : 'New template'}</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Template name *</label>
                  <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Cold DM — lifestyle brands" className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-muted text-foreground" />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Platform</label>
                  <select value={form.platform} onChange={e => setForm(f => ({ ...f, platform: e.target.value }))} className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-muted text-foreground">
                    {PLATFORMS.map(p => <option key={p} value={p}>{p === 'any' ? 'Any / Email' : p}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Email subject (optional)</label>
                <input value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))} placeholder="Collab opportunity with [Brand]" className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-muted text-foreground" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Message body *</label>
                <textarea value={form.body} onChange={e => setForm(f => ({ ...f, body: e.target.value }))} rows={12} className="w-full px-3 py-2 border border-border rounded-lg text-sm font-mono resize-y bg-muted text-foreground" />
              </div>
              <div className="flex gap-2">
                <button onClick={save} disabled={!form.name.trim() || !form.body.trim() || saving} className="bg-foreground/90 text-background px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50">
                  {saving ? 'Saving…' : 'Save template'}
                </button>
                <button onClick={() => setShowForm(false)} className="border border-border text-muted-foreground px-4 py-2 rounded-lg text-sm">Cancel</button>
              </div>
            </div>
          )}

          {templates.length === 0 ? (
            <div className="bg-card border border-border rounded-xl py-16 text-center">
              <p className="text-muted-foreground/70 text-sm mb-4">No templates yet — create one to get started</p>
              <button onClick={openNew} className="inline-flex items-center gap-2 bg-foreground/90 text-background px-4 py-2 rounded-lg text-sm font-medium"><Plus size={15} /> Create first template</button>
            </div>
          ) : (
            <div className="space-y-3">
              {templates.map(t => (
                <div key={t.id} className="bg-card border border-border rounded-xl overflow-hidden">
                  <div className="p-5">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-semibold text-foreground">{t.name}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          {t.platform && <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full capitalize">{t.platform}</span>}
                          {t.subject && <span className="text-xs text-muted-foreground/70">Subject: {t.subject}</span>}
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <button onClick={() => sendingFor === t.id ? closeSend() : openSend(t)} className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-colors ${sentConfirm === t.id ? 'bg-green-500/15 text-green-400' : sendingFor === t.id ? 'bg-brand/15 text-brand' : 'bg-muted text-muted-foreground hover:text-foreground'}`} title="Send to one">
                          {sentConfirm === t.id ? <><Check size={12} /> Sent</> : <><Send size={12} /> Send</>}
                        </button>
                        <button onClick={() => { setBulkFor(bulkFor === t.id ? null : t.id); setBulkSelected(new Set()); setBulkResult(null) }} className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-colors ${bulkFor === t.id ? 'bg-brand/15 text-brand' : 'bg-muted text-muted-foreground hover:text-foreground'}`} title="Bulk send">
                          <Users size={12} /> Bulk
                        </button>
                        <button onClick={() => copyBody(t)} className="p-1.5 text-muted-foreground/70 hover:text-foreground/80 transition-colors" title="Copy body">
                          {copied === t.id ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
                        </button>
                        <button onClick={() => openEdit(t)} className="p-1.5 text-muted-foreground/70 hover:text-foreground/80 transition-colors"><Pencil size={14} /></button>
                        <button onClick={() => remove(t.id)} className="p-1.5 text-muted-foreground/70 hover:text-red-400 transition-colors"><Trash2 size={14} /></button>
                      </div>
                    </div>
                    <pre className="text-xs text-muted-foreground font-mono whitespace-pre-wrap line-clamp-4 leading-relaxed">{t.body}</pre>
                  </div>

                  {sendingFor === t.id && (
                    <div className="border-t border-border bg-muted/50 p-5 space-y-3">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-foreground">Send to one</p>
                        <button onClick={closeSend} className="p-1 text-muted-foreground/70 hover:text-foreground"><X size={14} /></button>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-muted-foreground mb-1 block">To influencer</label>
                        <select value={sendForm.influencer_id} onChange={e => onInfluencerChange(t.id, e.target.value)} className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-card text-foreground">
                          <option value="">— select influencer —</option>
                          {influencers.map(i => <option key={i.id} value={i.id}>{i.name}{i.contact_email ? ` (${i.contact_email})` : ' — no email'}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-muted-foreground mb-1 block">Subject</label>
                        <input value={sendForm.subject} onChange={e => setSendForm(f => ({ ...f, subject: e.target.value }))} className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-card text-foreground" />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-muted-foreground mb-1 block">Message (variables substituted)</label>
                        <textarea value={sendForm.body} onChange={e => setSendForm(f => ({ ...f, body: e.target.value }))} rows={8} className="w-full px-3 py-2 border border-border rounded-lg text-sm font-mono resize-y bg-card text-foreground" />
                      </div>
                      {sendError && <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 px-3 py-2 rounded-lg">{sendError}</p>}
                      <button onClick={() => sendEmail(t)} disabled={sending || !sendForm.influencer_id} className="flex items-center gap-2 bg-brand text-brand-foreground px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50">
                        {sending ? <><Loader2 size={14} className="animate-spin" /> Sending…</> : <><Send size={14} /> Send email</>}
                      </button>
                    </div>
                  )}

                  {bulkFor === t.id && (
                    <div className="border-t border-border bg-muted/50 p-5 space-y-3">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-foreground">Bulk send — select recipients</p>
                        <button onClick={() => { setBulkFor(null); setBulkResult(null) }} className="p-1 text-muted-foreground/70 hover:text-foreground"><X size={14} /></button>
                      </div>
                      {bulkResult && (
                        <div className="flex items-center gap-4 bg-green-500/10 border border-green-500/20 px-4 py-2.5 rounded-lg text-sm">
                          <span className="text-green-400 font-medium">{bulkResult.sent} sent</span>
                          {bulkResult.skipped > 0 && <span className="text-muted-foreground">{bulkResult.skipped} skipped (no email)</span>}
                          {bulkResult.failed > 0 && <span className="text-red-400">{bulkResult.failed} failed</span>}
                        </div>
                      )}
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-muted-foreground">{influencersWithEmail.length} contacts with email</span>
                        <button onClick={() => setBulkSelected(s => s.size === influencersWithEmail.length ? new Set() : new Set(influencersWithEmail.map(i => i.id)))} className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                          {bulkSelected.size === influencersWithEmail.length ? 'Deselect all' : 'Select all'}
                        </button>
                      </div>
                      <div className="max-h-48 overflow-y-auto border border-border rounded-lg divide-y divide-border">
                        {influencersWithEmail.map(inf => (
                          <label key={inf.id} className="flex items-center gap-3 px-3 py-2 hover:bg-muted cursor-pointer">
                            <input type="checkbox" checked={bulkSelected.has(inf.id)} onChange={e => setBulkSelected(s => { const n = new Set(s); e.target.checked ? n.add(inf.id) : n.delete(inf.id); return n })} className="rounded" />
                            <span className="text-sm text-foreground flex-1">{inf.name}</span>
                            <span className="text-xs text-muted-foreground">{inf.contact_email}</span>
                          </label>
                        ))}
                        {influencersWithEmail.length === 0 && <p className="px-3 py-4 text-xs text-muted-foreground">No contacts with email addresses</p>}
                      </div>
                      <button onClick={() => sendBulk(t.id)} disabled={bulkSelected.size === 0 || bulkSending} className="flex items-center gap-2 bg-brand text-brand-foreground px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50">
                        {bulkSending ? <><Loader2 size={14} className="animate-spin" /> Sending…</> : <><Send size={14} /> Send to {bulkSelected.size} contact{bulkSelected.size !== 1 ? 's' : ''}</>}
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
