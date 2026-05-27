'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Copy, Pencil, Trash2, Check, Send, X, Loader2 } from 'lucide-react'
import type { OutreachTemplate, Influencer } from '@/types'

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

interface Props {
  templates: OutreachTemplate[]
  influencers: Pick<Influencer, 'id' | 'name' | 'handle' | 'niche' | 'platform' | 'contact_email'>[]
}

function substituteVars(text: string, inf: Props['influencers'][0]): string {
  return text
    .replace(/\{\{name\}\}/g, inf.name)
    .replace(/\{\{handle\}\}/g, inf.handle ?? '')
    .replace(/\{\{niche\}\}/g, inf.niche ?? '')
    .replace(/\{\{platform\}\}/g, inf.platform ?? '')
}

export default function OutreachClient({ templates: initialTemplates, influencers }: Props) {
  const router = useRouter()
  const [templates, setTemplates] = useState(initialTemplates)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<OutreachTemplate | null>(null)
  const [form, setForm] = useState({ name: '', subject: '', body: DEFAULT_TEMPLATE, platform: 'any' })
  const [saving, setSaving] = useState(false)
  const [copied, setCopied] = useState<string | null>(null)

  // Send email state
  const [sendingFor, setSendingFor] = useState<string | null>(null)
  const [sendForm, setSendForm] = useState<{
    influencer_id: string
    subject: string
    body: string
  }>({ influencer_id: '', subject: '', body: '' })
  const [sending, setSending] = useState(false)
  const [sentConfirm, setSentConfirm] = useState<string | null>(null)
  const [sendError, setSendError] = useState<string | null>(null)

  function openSend(t: OutreachTemplate) {
    setSendingFor(t.id)
    setSendForm({
      influencer_id: '',
      subject: t.subject ?? '',
      body: t.body,
    })
    setSendError(null)
  }

  function closeSend() {
    setSendingFor(null)
    setSendError(null)
  }

  function onInfluencerChange(templateId: string, influencerId: string) {
    const template = templates.find(t => t.id === templateId)
    const inf = influencers.find(i => i.id === influencerId)
    if (!template || !inf) {
      setSendForm(f => ({ ...f, influencer_id: influencerId }))
      return
    }
    setSendForm({
      influencer_id: influencerId,
      subject: template.subject ?? '',
      body: substituteVars(template.body, inf),
    })
  }

  async function sendEmail(t: OutreachTemplate) {
    const inf = influencers.find(i => i.id === sendForm.influencer_id)
    if (!inf) { setSendError('Select an influencer'); return }
    if (!inf.contact_email) { setSendError(`${inf.name} has no email address — add one on their profile first`); return }
    if (!sendForm.subject.trim()) { setSendError('Subject is required'); return }

    setSending(true)
    setSendError(null)

    const res = await fetch('/api/outreach/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        template_id: t.id,
        influencer_id: inf.id,
        to_email: inf.contact_email,
        subject: sendForm.subject,
        body: sendForm.body,
      }),
    })

    const data = await res.json()
    setSending(false)

    if (!res.ok) {
      setSendError(data.error ?? 'Failed to send')
      return
    }

    setSentConfirm(t.id)
    closeSend()
    setTimeout(() => setSentConfirm(null), 3000)
  }

  function openNew() {
    setEditing(null)
    setForm({ name: '', subject: '', body: DEFAULT_TEMPLATE, platform: 'any' })
    setShowForm(true)
    closeSend()
  }

  function openEdit(t: OutreachTemplate) {
    setEditing(t)
    setForm({ name: t.name, subject: t.subject ?? '', body: t.body, platform: t.platform ?? 'any' })
    setShowForm(true)
    closeSend()
  }

  async function save() {
    if (!form.name.trim() || !form.body.trim()) return
    setSaving(true)
    const payload = {
      name: form.name,
      subject: form.subject || null,
      body: form.body,
      platform: form.platform === 'any' ? null : form.platform,
    }
    if (editing) {
      const res = await fetch(`/api/outreach/${editing.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      if (res.ok) { const updated = await res.json(); setTemplates(ts => ts.map(t => t.id === updated.id ? updated : t)) }
    } else {
      const res = await fetch('/api/outreach', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      if (res.ok) { const created = await res.json(); setTemplates(ts => [created, ...ts]) }
    }
    setSaving(false)
    setShowForm(false)
    router.refresh()
  }

  async function remove(id: string) {
    if (!confirm('Delete this template?')) return
    await fetch(`/api/outreach/${id}`, { method: 'DELETE' })
    setTemplates(ts => ts.filter(t => t.id !== id))
  }

  function copyBody(t: OutreachTemplate) {
    navigator.clipboard.writeText(t.body)
    setCopied(t.id)
    setTimeout(() => setCopied(null), 2000)
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Outreach templates</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {templates.length} template{templates.length !== 1 ? 's' : ''} · Use{' '}
            <code className="text-xs bg-muted px-1 py-0.5 rounded">{'{{name}}'}</code>,{' '}
            <code className="text-xs bg-muted px-1 py-0.5 rounded">{'{{niche}}'}</code>,{' '}
            <code className="text-xs bg-muted px-1 py-0.5 rounded">{'{{handle}}'}</code> as variables
          </p>
        </div>
        <button onClick={openNew} className="flex items-center gap-2 bg-foreground/90 text-background px-4 py-2 rounded-lg text-sm font-medium hover:bg-foreground transition-colors">
          <Plus size={15} /> New template
        </button>
      </div>

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
          <button onClick={openNew} className="inline-flex items-center gap-2 bg-foreground/90 text-background px-4 py-2 rounded-lg text-sm font-medium">
            <Plus size={15} /> Create first template
          </button>
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
                      {t.platform && (
                        <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full capitalize">{t.platform}</span>
                      )}
                      {t.subject && <span className="text-xs text-muted-foreground/70">Subject: {t.subject}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => sendingFor === t.id ? closeSend() : openSend(t)}
                      className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-colors ${
                        sentConfirm === t.id
                          ? 'bg-green-500/15 text-green-400'
                          : sendingFor === t.id
                          ? 'bg-brand/15 text-brand'
                          : 'bg-muted text-muted-foreground hover:text-foreground'
                      }`}
                      title="Send email"
                    >
                      {sentConfirm === t.id ? <><Check size={12} /> Sent</> : <><Send size={12} /> Send</>}
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

              {/* Send panel */}
              {sendingFor === t.id && (
                <div className="border-t border-border bg-muted/50 p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-foreground">Send email</p>
                    <button onClick={closeSend} className="p-1 text-muted-foreground/70 hover:text-foreground"><X size={14} /></button>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">To influencer</label>
                    <select
                      value={sendForm.influencer_id}
                      onChange={e => onInfluencerChange(t.id, e.target.value)}
                      className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-card text-foreground"
                    >
                      <option value="">— select influencer —</option>
                      {influencers.map(i => (
                        <option key={i.id} value={i.id}>
                          {i.name}{i.contact_email ? ` (${i.contact_email})` : ' — no email'}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">Subject</label>
                    <input
                      value={sendForm.subject}
                      onChange={e => setSendForm(f => ({ ...f, subject: e.target.value }))}
                      className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-card text-foreground"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">Message (variables substituted)</label>
                    <textarea
                      value={sendForm.body}
                      onChange={e => setSendForm(f => ({ ...f, body: e.target.value }))}
                      rows={8}
                      className="w-full px-3 py-2 border border-border rounded-lg text-sm font-mono resize-y bg-card text-foreground"
                    />
                  </div>

                  {sendError && (
                    <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 px-3 py-2 rounded-lg">{sendError}</p>
                  )}

                  <button
                    onClick={() => sendEmail(t)}
                    disabled={sending || !sendForm.influencer_id}
                    className="flex items-center gap-2 bg-brand text-brand-foreground px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50"
                  >
                    {sending ? <><Loader2 size={14} className="animate-spin" /> Sending…</> : <><Send size={14} /> Send email</>}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
