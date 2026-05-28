'use client'

import { useState } from 'react'
import { Wallet, Pencil, X, Check } from 'lucide-react'

interface Props {
  campaignId: string
  budget: number | null
  currency: string
  committed: number
  paid: number
}

export default function CampaignBudget({ campaignId, budget, currency, committed, paid }: Props) {
  const [editing, setEditing] = useState(false)
  const [budgetInput, setBudgetInput] = useState(budget != null ? String(budget) : '')
  const [currentBudget, setCurrentBudget] = useState(budget)
  const [saving, setSaving] = useState(false)

  const remaining = currentBudget != null ? currentBudget - committed : null
  const committedPct = currentBudget && currentBudget > 0 ? Math.min((committed / currentBudget) * 100, 100) : 0
  const paidPct = currentBudget && currentBudget > 0 ? Math.min((paid / currentBudget) * 100, 100) : 0

  function fmt(n: number) {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(n)
  }

  async function saveBudget() {
    setSaving(true)
    const newBudget = budgetInput !== '' ? Number(budgetInput) : null
    await fetch(`/api/campaigns/${campaignId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ budget: newBudget }),
    })
    setCurrentBudget(newBudget)
    setSaving(false)
    setEditing(false)
  }

  return (
    <div className="bg-card border border-border rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Wallet size={15} className="text-brand" />
          <h2 className="font-semibold text-foreground">Budget</h2>
        </div>
        {!editing && (
          <button
            onClick={() => { setBudgetInput(currentBudget != null ? String(currentBudget) : ''); setEditing(true) }}
            className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            aria-label="Edit budget"
          >
            <Pencil size={13} />
          </button>
        )}
      </div>

      {editing && (
        <div className="flex items-center gap-2 mb-4">
          <input
            type="number"
            value={budgetInput}
            onChange={e => setBudgetInput(e.target.value)}
            placeholder="Enter total budget"
            autoFocus
            className="flex-1 px-3 py-2 bg-muted border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-brand/50"
          />
          <button
            onClick={saveBudget}
            disabled={saving}
            className="p-2 bg-brand text-brand-foreground rounded-lg disabled:opacity-50"
            aria-label="Save budget"
          >
            <Check size={13} />
          </button>
          <button
            onClick={() => setEditing(false)}
            className="p-2 bg-muted text-muted-foreground border border-border rounded-lg"
            aria-label="Cancel"
          >
            <X size={13} />
          </button>
        </div>
      )}

      {currentBudget == null && !editing ? (
        <p className="text-sm text-muted-foreground/70 py-2">
          No budget set.{' '}
          <button
            onClick={() => setEditing(true)}
            className="text-brand underline underline-offset-2 hover:no-underline"
          >
            Set budget
          </button>
        </p>
      ) : currentBudget != null ? (
        <>
          <div className="grid grid-cols-2 gap-2 mb-4">
            <div className="bg-muted rounded-lg p-3">
              <p className="text-xs text-muted-foreground mb-1">Total budget</p>
              <p className="text-sm font-bold text-foreground">{fmt(currentBudget)}</p>
            </div>
            <div className="bg-muted rounded-lg p-3">
              <p className="text-xs text-muted-foreground mb-1">Committed</p>
              <p className="text-sm font-bold text-foreground">{fmt(committed)}</p>
            </div>
            <div className="bg-muted rounded-lg p-3">
              <p className="text-xs text-muted-foreground mb-1">Paid</p>
              <p className="text-sm font-bold text-green-400">{fmt(paid)}</p>
            </div>
            <div className={`rounded-lg p-3 ${remaining != null && remaining < 0 ? 'bg-red-500/10' : 'bg-muted'}`}>
              <p className="text-xs text-muted-foreground mb-1">Remaining</p>
              <p className={`text-sm font-bold ${remaining != null && remaining < 0 ? 'text-red-400' : 'text-foreground'}`}>
                {remaining != null ? fmt(remaining) : '—'}
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <div>
              <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                <span>Committed</span>
                <span>{committedPct.toFixed(0)}%</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-brand rounded-full transition-all"
                  style={{ width: `${committedPct}%` }}
                />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                <span>Paid</span>
                <span>{paidPct.toFixed(0)}%</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-green-500 rounded-full transition-all"
                  style={{ width: `${paidPct}%` }}
                />
              </div>
            </div>
          </div>
        </>
      ) : null}
    </div>
  )
}
