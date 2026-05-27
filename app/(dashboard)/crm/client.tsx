'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  DndContext, DragOverlay, PointerSensor, useSensor, useSensors,
  type DragStartEvent, type DragEndEvent,
} from '@dnd-kit/core'
import { useDroppable, useDraggable } from '@dnd-kit/core'
import Link from 'next/link'
import { X, ShieldCheck, Trash2 } from 'lucide-react'
import { formatNumber } from '@/lib/utils'
import { getCredibility } from '@/lib/credibility'
import type { CrmStage, CrmNote, CrmActivity } from '@/types'

interface Creator {
  id: string
  name: string
  handle: string | null
  platform: string | null
  niche: string | null
  followers: number | null
  engagement_rate: number | null
  contact_email: string | null
  contact_name: string | null
  crm_stage: CrmStage
  tags: string[] | null
  status: string
  outreach_status: string
}

const STAGES: { id: CrmStage; label: string; color: string }[] = [
  { id: 'prospect',    label: 'Prospect',    color: 'bg-muted text-muted-foreground' },
  { id: 'outreach',    label: 'Outreach',    color: 'bg-sky-500/15 text-sky-600' },
  { id: 'negotiating', label: 'Negotiating', color: 'bg-amber-500/15 text-amber-600' },
  { id: 'contracted',  label: 'Contracted',  color: 'bg-violet-500/15 text-violet-600' },
  { id: 'delivered',   label: 'Delivered',   color: 'bg-blue-500/15 text-blue-600' },
  { id: 'paid',        label: 'Paid',        color: 'bg-green-500/15 text-green-600' },
]

const PLATFORM_COLORS: Record<string, string> = {
  instagram: 'bg-pink-500/15 text-pink-500',
  tiktok: 'bg-foreground/10 text-foreground/80',
  youtube: 'bg-red-500/15 text-red-500',
  twitter: 'bg-sky-500/15 text-sky-500',
  linkedin: 'bg-blue-500/15 text-blue-500',
  other: 'bg-muted text-muted-foreground',
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60_000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 30) return `${days}d ago`
  return new Date(iso).toLocaleDateString()
}

function activitySummary(activity: CrmActivity): string {
  const p = activity.payload as Record<string, unknown>
  switch (activity.type) {
    case 'stage_change': return `Moved to ${p.to ?? ''}`
    case 'note_added': return `Note: "${String(p.body ?? '').slice(0, 40)}${String(p.body ?? '').length > 40 ? '…' : ''}"`
    case 'outreach_sent': return 'Outreach sent'
    case 'contract_signed': return 'Contract signed'
    case 'payment_made': return 'Payment recorded'
    default: return String(activity.type).replace(/_/g, ' ')
  }
}

function PlatformBadge({ platform }: { platform: string | null }) {
  if (!platform) return null
  return (
    <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${PLATFORM_COLORS[platform] ?? PLATFORM_COLORS.other}`}>
      {platform}
    </span>
  )
}

function CreatorCard({
  creator, onClick, isDragging = false,
}: {
  creator: Creator
  onClick?: () => void
  isDragging?: boolean
}) {
  const cred = getCredibility(creator.followers, creator.engagement_rate)
  return (
    <div
      onClick={onClick}
      className={`bg-card border border-border rounded-lg p-3 cursor-pointer hover:border-foreground/20 transition-colors select-none ${isDragging ? 'opacity-50' : ''}`}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="min-w-0">
          <p className="font-semibold text-sm text-foreground truncate">{creator.name}</p>
          {creator.handle && (
            <p className="text-xs text-muted-foreground/70 truncate">@{creator.handle}</p>
          )}
        </div>
        <PlatformBadge platform={creator.platform} />
      </div>
      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        {creator.followers != null && (
          <span>{formatNumber(creator.followers)}</span>
        )}
        <span className={cred.color + ' flex items-center gap-0.5'}>
          {cred.level === 'credible' && <ShieldCheck size={10} />}
          {cred.label}
        </span>
      </div>
    </div>
  )
}

function DraggableCard({
  creator, onOpen,
}: {
  creator: Creator
  onOpen: (c: Creator) => void
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: creator.id })
  return (
    <div ref={setNodeRef} {...attributes} {...listeners} role="button" aria-label={`Drag ${creator.name}`}>
      <CreatorCard creator={creator} onClick={() => onOpen(creator)} isDragging={isDragging} />
    </div>
  )
}

function KanbanColumn({
  stage, creators, onOpen,
}: {
  stage: typeof STAGES[number]
  creators: Creator[]
  onOpen: (c: Creator) => void
}) {
  const { setNodeRef, isOver } = useDroppable({ id: stage.id })
  return (
    <div className="flex flex-col shrink-0 w-60">
      <div className="flex items-center gap-2 mb-3">
        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${stage.color}`}>
          {stage.label}
        </span>
        <span className="text-xs text-muted-foreground/60 font-medium">{creators.length}</span>
      </div>
      <div
        ref={setNodeRef}
        className={`flex-1 min-h-[120px] rounded-xl p-2 space-y-2 transition-colors ${isOver ? 'bg-muted/60' : 'bg-muted/20'}`}
      >
        {creators.length === 0 && (
          <div className="h-20 flex items-center justify-center">
            <span className="text-xs text-muted-foreground/30">Drop here</span>
          </div>
        )}
        {creators.map((c) => (
          <DraggableCard key={c.id} creator={c} onOpen={onOpen} />
        ))}
      </div>
    </div>
  )
}

function DetailPanel({
  creator, onClose, onStageChange,
}: {
  creator: Creator
  onClose: () => void
  onStageChange: (id: string, stage: CrmStage) => void
}) {
  const [notes, setNotes] = useState<CrmNote[]>([])
  const [activities, setActivities] = useState<CrmActivity[]>([])
  const [loadingNotes, setLoadingNotes] = useState(true)
  const [loadingActivities, setLoadingActivities] = useState(true)
  const [noteBody, setNoteBody] = useState('')
  const [addingNote, setAddingNote] = useState(false)
  const [localStage, setLocalStage] = useState<CrmStage>(creator.crm_stage)
  const [open, setOpen] = useState(false)
  useEffect(() => { setOpen(true) }, [])

  // fetch on mount
  useEffect(() => {
    async function load() {
      try {
        const [nRes, aRes] = await Promise.all([
          fetch(`/api/crm/notes?influencer_id=${creator.id}`),
          fetch(`/api/crm/activities?influencer_id=${creator.id}`),
        ])
        if (nRes.ok) setNotes(await nRes.json())
        if (aRes.ok) setActivities(await aRes.json())
      } catch {
        // network error — leave lists empty, loading flags cleared in finally
      } finally {
        setLoadingNotes(false)
        setLoadingActivities(false)
      }
    }
    load()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [creator.id])

  async function handleStageChange(stage: CrmStage) {
    const prevStage = localStage
    setLocalStage(stage)
    onStageChange(creator.id, stage)
    try {
      const res = await fetch(`/api/influencers/${creator.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ crm_stage: stage }),
      })
      if (!res.ok) {
        setLocalStage(prevStage)
        onStageChange(creator.id, prevStage)
      }
    } catch {
      setLocalStage(prevStage)
      onStageChange(creator.id, prevStage)
    }
  }

  async function handleAddNote() {
    if (!noteBody.trim()) return
    setAddingNote(true)
    const res = await fetch('/api/crm/notes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ influencer_id: creator.id, body: noteBody.trim() }),
    })
    if (res.ok) {
      const note: CrmNote = await res.json()
      setNotes((prev) => [note, ...prev])
      setNoteBody('')
    }
    setAddingNote(false)
  }

  async function handleDeleteNote(noteId: string) {
    const deleted = notes.find((n) => n.id === noteId)
    setNotes((prev) => prev.filter((n) => n.id !== noteId))
    try {
      const res = await fetch(`/api/crm/notes/${noteId}`, { method: 'DELETE' })
      if (!res.ok && deleted) {
        setNotes((prev) => {
          const idx = prev.findIndex((n) => new Date(n.created_at) < new Date(deleted.created_at))
          if (idx === -1) return [...prev, deleted]
          return [...prev.slice(0, idx), deleted, ...prev.slice(idx)]
        })
      }
    } catch {
      if (deleted) {
        setNotes((prev) => {
          const idx = prev.findIndex((n) => new Date(n.created_at) < new Date(deleted.created_at))
          if (idx === -1) return [...prev, deleted]
          return [...prev.slice(0, idx), deleted, ...prev.slice(idx)]
        })
      }
    }
  }

  const cred = getCredibility(creator.followers, creator.engagement_rate)

  return (
    <>
      {/* backdrop */}
      <div
        className="fixed inset-0 bg-foreground/10 backdrop-blur-[1px] z-40"
        onClick={onClose}
      />
      {/* panel */}
      <div className={`fixed right-0 top-0 h-full w-[400px] bg-card border-l border-border z-50 flex flex-col shadow-2xl transition-transform duration-300 ease-out ${open ? 'translate-x-0' : 'translate-x-full'}`}>
        {/* header */}
        <div className="flex items-start justify-between p-5 border-b border-border">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-foreground text-base">{creator.name}</h2>
              <PlatformBadge platform={creator.platform} />
            </div>
            {creator.handle && (
              <p className="text-sm text-muted-foreground mt-0.5">@{creator.handle}</p>
            )}
          </div>
          <button onClick={onClose} aria-label="Close panel" className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded-md hover:bg-muted">
            <X size={16} />
          </button>
        </div>

        {/* scrollable body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">

          {/* stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-muted/40 rounded-lg p-2.5 text-center">
              <p className="text-xs text-muted-foreground mb-0.5">Followers</p>
              <p className="font-semibold text-sm text-foreground">
                {creator.followers != null ? formatNumber(creator.followers) : '—'}
              </p>
            </div>
            <div className="bg-muted/40 rounded-lg p-2.5 text-center">
              <p className="text-xs text-muted-foreground mb-0.5">Eng. rate</p>
              <p className="font-semibold text-sm text-foreground">
                {creator.engagement_rate != null ? `${creator.engagement_rate}%` : '—'}
              </p>
            </div>
            <div className="bg-muted/40 rounded-lg p-2.5 text-center">
              <p className="text-xs text-muted-foreground mb-0.5">Credibility</p>
              <p className={`font-semibold text-sm ${cred.color} flex items-center justify-center gap-0.5`}>
                {cred.level === 'credible' && <ShieldCheck size={11} />}
                {cred.score != null ? cred.score : cred.label}
              </p>
            </div>
          </div>

          {/* contact */}
          {(creator.contact_email || creator.contact_name) && (
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground/60">Contact</p>
              {creator.contact_name && <p className="text-sm text-foreground">{creator.contact_name}</p>}
              {creator.contact_email && (
                <a href={`mailto:${creator.contact_email}`} className="text-sm text-brand underline-offset-2 hover:underline">
                  {creator.contact_email}
                </a>
              )}
            </div>
          )}

          {/* niche + tags */}
          {(creator.niche || (creator.tags?.length ?? 0) > 0) && (
            <div className="space-y-1.5">
              {creator.niche && <p className="text-sm text-muted-foreground">{creator.niche}</p>}
              {creator.tags && creator.tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {creator.tags.map((t) => (
                    <span key={t} className="px-2 py-0.5 bg-muted rounded-full text-xs text-muted-foreground">{t}</span>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* stage selector */}
          <div className="space-y-1.5">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground/60">Stage</p>
            <select
              value={localStage}
              onChange={(e) => handleStageChange(e.target.value as CrmStage)}
              className="w-full bg-muted border border-border rounded-lg px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-foreground/20"
            >
              {STAGES.map((s) => (
                <option key={s.id} value={s.id}>{s.label}</option>
              ))}
            </select>
          </div>

          {/* notes */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground/60 mb-3">Notes</p>
            <div className="space-y-2 mb-3">
              {loadingNotes ? (
                <p className="text-xs text-muted-foreground/50">Loading…</p>
              ) : notes.length === 0 ? (
                <p className="text-xs text-muted-foreground/40">No notes yet</p>
              ) : notes.map((note) => (
                <div key={note.id} className="bg-muted/30 rounded-lg p-3 group">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm text-foreground leading-relaxed">{note.body}</p>
                    <button
                      onClick={() => handleDeleteNote(note.id)}
                      aria-label="Delete note"
                      className="opacity-0 group-hover:opacity-100 text-muted-foreground/50 hover:text-red-500 transition-all shrink-0"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                  <p className="text-[10px] text-muted-foreground/40 mt-1">{relativeTime(note.created_at)}</p>
                </div>
              ))}
            </div>
            <textarea
              value={noteBody}
              onChange={(e) => setNoteBody(e.target.value)}
              placeholder="Add a note…"
              rows={2}
              className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-foreground/20 resize-none"
            />
            <button
              onClick={handleAddNote}
              disabled={addingNote || !noteBody.trim()}
              className="mt-2 w-full bg-foreground/90 text-background text-sm font-medium py-1.5 rounded-lg hover:bg-foreground transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {addingNote ? 'Adding…' : 'Add note'}
            </button>
          </div>

          {/* activities */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground/60 mb-3">Activity</p>
            {loadingActivities ? (
              <p className="text-xs text-muted-foreground/50">Loading…</p>
            ) : activities.length === 0 ? (
              <p className="text-xs text-muted-foreground/40">No activity yet</p>
            ) : (
              <div className="space-y-1.5">
                {activities.map((a) => (
                  <div key={a.id} className="flex items-start gap-2 text-xs">
                    <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/30 mt-1.5 shrink-0" />
                    <div>
                      <p className="text-foreground/80">{activitySummary(a)}</p>
                      <p className="text-muted-foreground/40">{relativeTime(a.created_at)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* quick links */}
          <div className="border-t border-border pt-4 flex flex-col gap-1.5">
            <Link href={`/influencers/${creator.id}`} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Edit profile →
            </Link>
            <Link href="/outreach" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Send outreach →
            </Link>
            <Link href="/contracts" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              New contract →
            </Link>
          </div>
        </div>
      </div>
    </>
  )
}

export default function CrmKanban({ influencers }: { influencers: Creator[] }) {
  const [creators, setCreators] = useState<Creator[]>(influencers)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [panelCreator, setPanelCreator] = useState<Creator | null>(null)

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))

  const byStage = useMemo(() => {
    const map = new Map<string, Creator[]>()
    STAGES.forEach(s => map.set(s.id, []))
    creators.forEach(c => {
      const arr = map.get(c.crm_stage)
      if (arr) arr.push(c)
    })
    return map
  }, [creators])

  const handleDragStart = useCallback(({ active }: DragStartEvent) => {
    setActiveId(active.id as string)
  }, [])

  const handleDragEnd = useCallback(({ active, over }: DragEndEvent) => {
    setActiveId(null)
    if (!over || active.id === over.id) return
    const maybeStage = String(over.id)
    if (!STAGES.some(s => s.id === maybeStage)) return
    const newStage = maybeStage as CrmStage

    const originalStage = creators.find((c) => c.id === active.id)?.crm_stage

    setCreators((prev) =>
      prev.map((c) => c.id === active.id ? { ...c, crm_stage: newStage } : c),
    )

    fetch(`/api/influencers/${active.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ crm_stage: newStage }),
    }).then((res) => {
      if (!res.ok && originalStage) {
        setCreators((prev) =>
          prev.map((c) => c.id === active.id ? { ...c, crm_stage: originalStage } : c),
        )
      }
    }).catch(() => {
      if (originalStage) {
        setCreators((prev) =>
          prev.map((c) => c.id === active.id ? { ...c, crm_stage: originalStage } : c),
        )
      }
    })
  }, [creators])

  function handleStageChange(id: string, stage: CrmStage) {
    setCreators((prev) => prev.map((c) => c.id === id ? { ...c, crm_stage: stage } : c))
  }

  const activeCreator = activeId ? creators.find((c) => c.id === activeId) ?? null : null

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="flex-1 overflow-x-auto overflow-y-hidden px-8 py-6">
        <div className="flex gap-4 h-full min-h-0">
          {STAGES.map((stage) => (
            <KanbanColumn
              key={stage.id}
              stage={stage}
              creators={byStage.get(stage.id) ?? []}
              onOpen={setPanelCreator}
            />
          ))}
        </div>
      </div>

      <DragOverlay>
        {activeCreator && (
          <div className="w-60 rotate-1 shadow-xl">
            <CreatorCard creator={activeCreator} />
          </div>
        )}
      </DragOverlay>

      {panelCreator && (
        <DetailPanel
          creator={panelCreator}
          onClose={() => setPanelCreator(null)}
          onStageChange={handleStageChange}
        />
      )}
    </DndContext>
  )
}
