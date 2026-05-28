'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2, ChevronLeft, ChevronRight, ChevronDown, ChevronUp, Plus, X } from 'lucide-react'
import type { PipelineDeal } from './page'

const STAGES = ['prospecting', 'pitched', 'negotiating', 'active', 'completed'] as const
type Stage = typeof STAGES[number]

const STAGE_LABELS: Record<Stage, string> = {
  prospecting: 'Prospecting',
  pitched: 'Pitched',
  negotiating: 'Negotiating',
  active: 'Active',
  completed: 'Completed',
}

const DELIVERABLE_STATUSES = ['briefed', 'filmed', 'submitted', 'approved', 'posted'] as const
type DeliverableStatus = typeof DELIVERABLE_STATUSES[number]

const STATUS_DOT: Record<DeliverableStatus, string> = {
  briefed: 'bg-muted-foreground/40',
  filmed: 'bg-amber-400',
  submitted: 'bg-sky-400',
  approved: 'bg-green-400',
  posted: 'bg-purple-400',
}

const STATUS_LABEL: Record<DeliverableStatus, string> = {
  briefed: 'Briefed',
  filmed: 'Filmed',
  submitted: 'Submitted',
  approved: 'Approved',
  posted: 'Posted',
}

interface Deliverable {
  id: string
  pipeline_id: string
  title: string
  status: DeliverableStatus
  due_date: string | null
}

function formatAmount(cents: number): string {
  return '$' + (cents / 100).toLocaleString('en-US')
}

function nextStatus(s: DeliverableStatus): DeliverableStatus {
  const idx = DELIVERABLE_STATUSES.indexOf(s)
  return DELIVERABLE_STATUSES[(idx + 1) % DELIVERABLE_STATUSES.length]
}

function DeliverableRow({ item, onStatusChange, onDelete }: {
  item: Deliverable
  onStatusChange: (id: string, status: DeliverableStatus) => void
  onDelete: (id: string) => void
}) {
  return (
    <div className="flex items-center gap-2 py-1 group">
      <button
        onClick={() => onStatusChange(item.id, nextStatus(item.status))}
        title={STATUS_LABEL[item.status]}
        className={`w-2.5 h-2.5 rounded-full shrink-0 ${STATUS_DOT[item.status]} hover:opacity-80 transition-opacity`}
      />
      <span className="text-xs text-foreground flex-1 truncate">{item.title}</span>
      {item.due_date && (
        <span className="text-[10px] text-muted-foreground/60 shrink-0">
          {new Date(item.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
        </span>
      )}
      <button
        onClick={() => onDelete(item.id)}
        className="opacity-0 group-hover:opacity-100 p-0.5 text-muted-foreground/40 hover:text-red-400 transition-all"
      >
        <X size={10} />
      </button>
    </div>
  )
}

function DealCard({ deal, onMove, onDelete }: {
  deal: PipelineDeal
  onMove: (id: string, stage: Stage) => void
  onDelete: (id: string) => void
}) {
  const [confirmDelete, setConfirmDelete] = useState(false)
  const stageIndex = STAGES.indexOf(deal.stage as Stage)
  const [expanded, setExpanded] = useState(false)
  const [deliverables, setDeliverables] = useState<Deliverable[]>([])
  const [loaded, setLoaded] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [adding, setAdding] = useState(false)

  async function toggleExpand() {
    if (!expanded && !loaded) {
      const res = await fetch(`/api/creator-deliverables?pipeline_id=${deal.id}`)
      if (res.ok) setDeliverables(await res.json())
      setLoaded(true)
    }
    setExpanded(v => !v)
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!newTitle.trim()) return
    setAdding(true)
    const res = await fetch('/api/creator-deliverables', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pipeline_id: deal.id, title: newTitle.trim() }),
    })
    if (res.ok) {
      const d = await res.json()
      setDeliverables(prev => [...prev, d])
      setNewTitle('')
    }
    setAdding(false)
  }

  async function handleStatusChange(id: string, status: DeliverableStatus) {
    setDeliverables(prev => prev.map(d => d.id === id ? { ...d, status } : d))
    await fetch(`/api/creator-deliverables/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
  }

  async function handleDeleteDeliverable(id: string) {
    setDeliverables(prev => prev.filter(d => d.id !== id))
    await fetch(`/api/creator-deliverables/${id}`, { method: 'DELETE' })
  }

  return (
    <div className="bg-card border border-border rounded-lg p-3 space-y-1.5">
      <p className="font-semibold text-sm text-foreground leading-tight">{deal.brand_name}</p>
      {deal.amount_estimate != null && (
        <p className="text-xs text-muted-foreground">{formatAmount(deal.amount_estimate)}</p>
      )}
      {deal.notes && (
        <p className="text-xs text-muted-foreground truncate">{deal.notes}</p>
      )}
      <div className="flex items-center justify-between pt-1">
        <div className="flex items-center gap-1">
          <button
            onClick={() => stageIndex > 0 && onMove(deal.id, STAGES[stageIndex - 1])}
            disabled={stageIndex === 0}
            className="p-0.5 rounded text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors"
          >
            <ChevronLeft size={14} />
          </button>
          <button
            onClick={() => stageIndex < STAGES.length - 1 && onMove(deal.id, STAGES[stageIndex + 1])}
            disabled={stageIndex === STAGES.length - 1}
            className="p-0.5 rounded text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors"
          >
            <ChevronRight size={14} />
          </button>
        </div>
        {confirmDelete ? (
          <div className="flex items-center gap-1 text-xs">
            <span className="text-muted-foreground">Delete?</span>
            <button onClick={() => onDelete(deal.id)} className="text-red-600 font-medium hover:text-red-800">Yes</button>
            <button onClick={() => setConfirmDelete(false)} className="text-muted-foreground hover:text-foreground">No</button>
          </div>
        ) : (
          <button
            onClick={() => setConfirmDelete(true)}
            className="p-0.5 rounded text-muted-foreground hover:text-red-600 transition-colors"
          >
            <Trash2 size={13} />
          </button>
        )}
      </div>

      {/* Deliverables toggle */}
      <div className="border-t border-border/60 pt-1.5 mt-1">
        <button
          onClick={toggleExpand}
          className="flex items-center gap-1 text-[11px] text-muted-foreground/70 hover:text-muted-foreground transition-colors w-full"
        >
          {expanded ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
          Deliverables{loaded && deliverables.length > 0 ? ` (${deliverables.length})` : ''}
        </button>

        {expanded && (
          <div className="mt-2 space-y-0.5">
            {deliverables.map(d => (
              <DeliverableRow
                key={d.id}
                item={d}
                onStatusChange={handleStatusChange}
                onDelete={handleDeleteDeliverable}
              />
            ))}
            <form onSubmit={handleAdd} className="flex gap-1 mt-2">
              <input
                value={newTitle}
                onChange={e => setNewTitle(e.target.value)}
                placeholder="e.g. 1x Reel"
                className="flex-1 text-[11px] px-2 py-1 border border-border rounded bg-background text-foreground placeholder:text-muted-foreground/40 focus:outline-none"
              />
              <button
                type="submit"
                disabled={adding || !newTitle.trim()}
                className="text-[11px] px-2 py-1 bg-foreground/90 text-background rounded font-medium hover:bg-foreground disabled:opacity-50 transition-colors"
              >
                <Plus size={10} />
              </button>
            </form>
            {loaded && deliverables.length > 0 && (
              <div className="flex gap-3 pt-1.5 pb-0.5">
                {DELIVERABLE_STATUSES.map(s => (
                  <div key={s} className="flex items-center gap-1">
                    <span className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[s]}`} />
                    <span className="text-[9px] text-muted-foreground/50">{STATUS_LABEL[s]}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function AddDealForm({ onAdd }: { onAdd: (brandName: string, amount?: number) => Promise<void> }) {
  const [brandName, setBrandName] = useState('')
  const [amount, setAmount] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    if (!brandName.trim()) return
    setLoading(true)
    try {
      const amountCents = amount ? Math.round(parseFloat(amount) * 100) : undefined
      await onAdd(brandName.trim(), amountCents)
      setBrandName('')
      setAmount('')
    } finally {
      setLoading(false)
    }
  }, [brandName, amount, onAdd])

  return (
    <form onSubmit={handleSubmit} className="space-y-1.5 mb-3">
      <input
        value={brandName}
        onChange={e => setBrandName(e.target.value)}
        placeholder="Brand name"
        className="w-full text-xs px-2 py-1.5 border border-border rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-foreground/20"
      />
      <div className="flex gap-1">
        <input
          value={amount}
          onChange={e => setAmount(e.target.value)}
          placeholder="Amount ($)"
          type="number"
          min="0"
          step="0.01"
          className="w-full text-xs px-2 py-1.5 border border-border rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-foreground/20"
        />
        <button
          type="submit"
          disabled={loading || !brandName.trim()}
          className="text-xs px-3 py-1.5 bg-foreground/90 text-background rounded-md font-medium hover:bg-foreground disabled:opacity-50 transition-colors whitespace-nowrap"
        >
          {loading ? '…' : 'Add'}
        </button>
      </div>
    </form>
  )
}

export default function PipelineClient({ deals: initialDeals }: { deals: PipelineDeal[] }) {
  const router = useRouter()
  const [deals, setDeals] = useState<PipelineDeal[]>(initialDeals)

  const handleMove = useCallback(async (id: string, stage: Stage) => {
    setDeals(prev => prev.map(d => d.id === id ? { ...d, stage } : d))
    await fetch(`/api/creator-pipeline/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stage }),
    })
    router.refresh()
  }, [router])

  const handleDelete = useCallback(async (id: string) => {
    setDeals(prev => prev.filter(d => d.id !== id))
    await fetch(`/api/creator-pipeline/${id}`, { method: 'DELETE' })
    router.refresh()
  }, [router])

  const handleAdd = useCallback(async (brand_name: string, amount_estimate?: number) => {
    const res = await fetch('/api/creator-pipeline', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ brand_name, amount_estimate, stage: 'prospecting' }),
    })
    const newDeal = await res.json()
    setDeals(prev => [newDeal, ...prev])
    router.refresh()
  }, [router])

  return (
    <div className="overflow-x-auto pb-4">
      <div className="flex gap-4 min-w-max">
        {STAGES.map(stage => {
          const stageDeals = deals.filter(d => d.stage === stage)
          return (
            <div key={stage} className="w-56 flex-shrink-0">
              <div className="flex items-center gap-2 mb-3">
                <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {STAGE_LABELS[stage]}
                </h2>
                <span className="text-xs bg-muted text-muted-foreground px-1.5 py-0.5 rounded-full font-medium">
                  {stageDeals.length}
                </span>
              </div>
              {stage === 'prospecting' && <AddDealForm onAdd={handleAdd} />}
              <div className="space-y-2">
                {stageDeals.map(deal => (
                  <DealCard key={deal.id} deal={deal} onMove={handleMove} onDelete={handleDelete} />
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
