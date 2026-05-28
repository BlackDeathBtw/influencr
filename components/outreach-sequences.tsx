'use client'

import { useState } from 'react'
import { Plus, Trash2, ChevronDown, ChevronRight, Send, Users, Check, X, Loader2 } from 'lucide-react'

interface SequenceStep {
  delay_days: number
  subject: string
  body: string
}

interface Sequence {
  id: string
  name: string
  description: string | null
  steps: SequenceStep[]
  created_at: string
}

interface Enrollment {
  id: string
  influencer_id: string
  current_step: number
  status: string
  next_send_at: string | null
  last_sent_at: string | null
  influencer: { name: string; handle: string | null; contact_email: string | null } | null
}

interface Influencer {
  id: string
  name: string
  handle: string | null
  contact_email: string | null
}

interface Props {
  initialSequences: Sequence[]
  influencers: Influencer[]
}

const BLANK_STEP: SequenceStep = { delay_days: 0, subject: '', body: '' }

const STATUS_COLOR: Record<string, string> = {
  active: 'bg-sky-500/15 text-sky-600',
  completed: 'bg-green-500/15 text-green-600',
  paused: 'bg-amber-500/15 text-amber-600',
}

export default function OutreachSequences({ initialSequences, influencers }: Props) {
  const [sequences, setSequences] = useState<Sequence[]>(initialSequences)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState({ name: '', description: '', steps: [{ ...BLANK_STEP }] })
  const [saving, setSaving] = useState(false)
  const [expanded, setExpanded] = useState<string | null>(null)

  // Enrollment state
  const [enrollingId, setEnrollingId] = useState<string | null>(null)
  const [selectedInf, setSelectedInf] = useState<Set<string>>(new Set())
  const [enrolling, setEnrolling] = useState(false)
  const [enrollments, setEnrollments] = useState<Record<string, Enrollment[]>>({})
  const [loadingEnrollments, setLoadingEnrollments] = useState<string | null>(null)
  const [sendingStep, setSendingStep] = useState<string | null>(null)

  function openNew() {
    setEditingId(null)
    setForm({ name: '', description: '', steps: [{ ...BLANK_STEP }] })
    setShowForm(true)
  }

  function openEdit(seq: Sequence) {
    setEditingId(seq.id)
    setForm({ name: seq.name, description: seq.description ?? '', steps: seq.steps.map(s => ({ ...s })) })
    setShowForm(true)
  }

  function addStep() {
    const last = form.steps[form.steps.length - 1]
    setForm(f => ({ ...f, steps: [...f.steps, { delay_days: (last?.delay_days ?? 0) + 3, subject: '', body: '' }] }))
  }

  function removeStep(i: number) {
    setForm(f => ({ ...f, steps: f.steps.filter((_, idx) => idx !== i) }))
  }

  function updateStep(i: number, field: keyof SequenceStep, value: string | number) {
    setForm(f => ({ ...f, steps: f.steps.map((s, idx) => idx === i ? { ...s, [field]: value } : s) }))
  }

  async function save() {
    if (!form.name.trim() || form.steps.length === 0) return
    setSaving(true)
    const payload = { name: form.name.trim(), description: form.description || null, steps: form.steps }
    let res: Response
    if (editingId) {
      res = await fetch(`/api/email-sequences/${editingId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
    } else {
      res = await fetch('/api/email-sequences', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
    }
    if (res.ok) {
      const saved = await res.json()
      if (editingId) {
        setSequences(ss => ss.map(s => s.id === editingId ? saved : s))
      } else {
        setSequences(ss => [saved, ...ss])
      }
    }
    setSaving(false)
    setShowForm(false)
    setEditingId(null)
  }

  async function remove(id: string) {
    if (!confirm('Delete this sequence and all enrollments?')) return
    await fetch(`/api/email-sequences/${id}`, { method: 'DELETE' })
    setSequences(ss => ss.filter(s => s.id !== id))
  }

  async function loadEnrollments(seqId: string) {
    setLoadingEnrollments(seqId)
    const res = await fetch(`/api/email-sequences/${seqId}/enroll`)
    if (res.ok) {
      const data = await res.json()
      setEnrollments(e => ({ ...e, [seqId]: data }))
    }
    setLoadingEnrollments(null)
  }

  function toggleExpand(id: string) {
    const next = expanded === id ? null : id
    setExpanded(next)
    if (next && !enrollments[next]) loadEnrollments(next)
  }

  async function enroll(seqId: string) {
    if (selectedInf.size === 0) return
    setEnrolling(true)
    const res = await fetch(`/api/email-sequences/${seqId}/enroll`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ influencer_ids: Array.from(selectedInf) }),
    })
    if (res.ok) {
      setSelectedInf(new Set())
      setEnrollingId(null)
      loadEnrollments(seqId)
    }
    setEnrolling(false)
  }

  async function sendNext(seqId: string, enrollmentId: string) {
    setSendingStep(enrollmentId)
    const res = await fetch(`/api/email-sequences/${seqId}/send-next`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ enrollment_id: enrollmentId }),
    })
    if (res.ok) loadEnrollments(seqId)
    setSendingStep(null)
  }

  async function removeEnrollment(seqId: string, enrollmentId: string) {
    await fetch(`/api/email-sequences/${seqId}/enroll?enrollment_id=${enrollmentId}`, { method: 'DELETE' })
    setEnrollments(e => ({ ...e, [seqId]: (e[seqId] ?? []).filter(en => en.id !== enrollmentId) }))
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Email sequences</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Multi-step drip campaigns with automatic variable substitution</p>
        </div>
        <button onClick={openNew} className="flex items-center gap-2 bg-foreground/90 text-background px-4 py-2 rounded-lg text-sm font-medium hover:bg-foreground transition-colors">
          <Plus size={15} /> New sequence
        </button>
      </div>

      {showForm && (
        <div className="mb-6 bg-card border border-border rounded-xl p-6 space-y-5">
          <h3 className="font-semibold text-foreground">{editingId ? 'Edit sequence' : 'New sequence'}</h3>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Name *</label>
              <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Cold outreach — lifestyle" className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-muted text-foreground" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Description</label>
              <input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Optional note" className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-muted text-foreground" />
            </div>
          </div>

          <div className="space-y-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Steps</p>
            {form.steps.map((step, i) => (
              <div key={i} className="bg-muted/40 border border-border rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-foreground">Step {i + 1}</span>
                  {form.steps.length > 1 && (
                    <button onClick={() => removeStep(i)} className="p-1 text-muted-foreground/60 hover:text-red-400 transition-colors"><Trash2 size={13} /></button>
                  )}
                </div>
                <div className="grid sm:grid-cols-[120px_1fr] gap-3">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">Send after (days)</label>
                    <input type="number" min="0" value={step.delay_days} onChange={e => updateStep(i, 'delay_days', Number(e.target.value))} className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-card text-foreground" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">Subject</label>
                    <input value={step.subject} onChange={e => updateStep(i, 'subject', e.target.value)} placeholder="Collab opportunity with {{name}}" className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-card text-foreground" />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Body — use <code className="bg-muted px-1 rounded">{'{{name}}'}</code>, <code className="bg-muted px-1 rounded">{'{{niche}}'}</code></label>
                  <textarea value={step.body} onChange={e => updateStep(i, 'body', e.target.value)} rows={5} className="w-full px-3 py-2 border border-border rounded-lg text-sm font-mono resize-y bg-card text-foreground" />
                </div>
              </div>
            ))}
            <button onClick={addStep} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground border border-dashed border-border px-3 py-2 rounded-lg transition-colors">
              <Plus size={13} /> Add step
            </button>
          </div>

          <div className="flex gap-2">
            <button onClick={save} disabled={!form.name.trim() || saving} className="bg-foreground/90 text-background px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50">
              {saving ? 'Saving…' : 'Save sequence'}
            </button>
            <button onClick={() => setShowForm(false)} className="border border-border text-muted-foreground px-4 py-2 rounded-lg text-sm">Cancel</button>
          </div>
        </div>
      )}

      {sequences.length === 0 ? (
        <div className="bg-card border border-border rounded-xl py-16 text-center">
          <p className="text-muted-foreground/70 text-sm mb-4">No sequences yet — create a multi-step drip campaign</p>
          <button onClick={openNew} className="inline-flex items-center gap-2 bg-foreground/90 text-background px-4 py-2 rounded-lg text-sm font-medium">
            <Plus size={15} /> Create first sequence
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {sequences.map(seq => (
            <div key={seq.id} className="bg-card border border-border rounded-xl overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4">
                <button onClick={() => toggleExpand(seq.id)} className="flex items-center gap-3 min-w-0 flex-1 text-left">
                  {expanded === seq.id ? <ChevronDown size={15} className="text-muted-foreground shrink-0" /> : <ChevronRight size={15} className="text-muted-foreground shrink-0" />}
                  <div className="min-w-0">
                    <p className="font-semibold text-foreground">{seq.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{seq.steps.length} step{seq.steps.length !== 1 ? 's' : ''}{seq.description ? ` · ${seq.description}` : ''}</p>
                  </div>
                </button>
                <div className="flex items-center gap-1 shrink-0 ml-4">
                  <button
                    onClick={() => { setEnrollingId(enrollingId === seq.id ? null : seq.id); setSelectedInf(new Set()) }}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-muted text-muted-foreground hover:text-foreground rounded-lg text-xs font-medium transition-colors"
                  >
                    <Users size={12} /> Enroll
                  </button>
                  <button onClick={() => openEdit(seq)} className="p-1.5 text-muted-foreground/70 hover:text-foreground transition-colors"><Send size={13} /></button>
                  <button onClick={() => remove(seq.id)} className="p-1.5 text-muted-foreground/70 hover:text-red-400 transition-colors"><Trash2 size={13} /></button>
                </div>
              </div>

              {enrollingId === seq.id && (
                <div className="border-t border-border bg-muted/30 px-5 py-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-foreground">Enroll influencers</p>
                    <button onClick={() => setEnrollingId(null)} className="p-1 text-muted-foreground/60"><X size={14} /></button>
                  </div>
                  <div className="max-h-48 overflow-y-auto space-y-1">
                    {influencers.filter(i => i.contact_email).map(inf => (
                      <label key={inf.id} className="flex items-center gap-3 px-2 py-1.5 rounded-lg hover:bg-muted cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedInf.has(inf.id)}
                          onChange={e => setSelectedInf(s => { const n = new Set(s); e.target.checked ? n.add(inf.id) : n.delete(inf.id); return n })}
                          className="rounded"
                        />
                        <span className="text-sm text-foreground">{inf.name}</span>
                        <span className="text-xs text-muted-foreground">{inf.contact_email}</span>
                      </label>
                    ))}
                    {influencers.filter(i => i.contact_email).length === 0 && (
                      <p className="text-xs text-muted-foreground py-2">No influencers with email addresses</p>
                    )}
                  </div>
                  <button
                    onClick={() => enroll(seq.id)}
                    disabled={selectedInf.size === 0 || enrolling}
                    className="flex items-center gap-2 bg-brand text-brand-foreground px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50"
                  >
                    {enrolling ? <Loader2 size={13} className="animate-spin" /> : <Users size={13} />}
                    Enroll {selectedInf.size > 0 ? selectedInf.size : ''} influencer{selectedInf.size !== 1 ? 's' : ''}
                  </button>
                </div>
              )}

              {expanded === seq.id && (
                <div className="border-t border-border px-5 py-4">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Enrolled contacts</p>
                  {loadingEnrollments === seq.id ? (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 size={13} className="animate-spin" /> Loading…</div>
                  ) : (enrollments[seq.id] ?? []).length === 0 ? (
                    <p className="text-sm text-muted-foreground/60">No enrollments yet</p>
                  ) : (
                    <div className="space-y-2">
                      {(enrollments[seq.id] ?? []).map(en => (
                        <div key={en.id} className="flex items-center justify-between py-2 border-b border-border last:border-0 gap-3">
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-foreground">{en.influencer?.name ?? '—'}</p>
                            <p className="text-xs text-muted-foreground">Step {en.current_step + 1} of {seq.steps.length}</p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${STATUS_COLOR[en.status] ?? 'bg-muted text-muted-foreground'}`}>{en.status}</span>
                            {en.status === 'active' && en.current_step < seq.steps.length && (
                              <button
                                onClick={() => sendNext(seq.id, en.id)}
                                disabled={sendingStep === en.id}
                                className="flex items-center gap-1 px-2 py-1 bg-muted hover:bg-brand/10 hover:text-brand text-muted-foreground rounded text-xs font-medium transition-colors disabled:opacity-50"
                              >
                                {sendingStep === en.id ? <Loader2 size={11} className="animate-spin" /> : <Send size={11} />} Send step {en.current_step + 1}
                              </button>
                            )}
                            {en.status === 'completed' && <Check size={13} className="text-green-400" />}
                            <button onClick={() => removeEnrollment(seq.id, en.id)} className="p-1 text-muted-foreground/50 hover:text-red-400 transition-colors"><X size={12} /></button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
