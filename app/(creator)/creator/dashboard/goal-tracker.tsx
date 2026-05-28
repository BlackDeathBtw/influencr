'use client'

import { useState } from 'react'

function fmt(cents: number) {
  return '$' + (cents / 100).toLocaleString('en-US', { maximumFractionDigits: 0 })
}

interface Props {
  earnedThisMonthCents: number
  goalCents: number | null
  userId: string
}

export default function GoalTracker({ earnedThisMonthCents, goalCents: initialGoal }: Props) {
  const [goal, setGoal] = useState<number | null>(initialGoal)
  const [editing, setEditing] = useState(initialGoal === null)
  const [inputDollars, setInputDollars] = useState(initialGoal ? String(Math.round(initialGoal / 100)) : '')
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    const dollars = Number(inputDollars)
    if (!dollars || dollars <= 0) return
    setSaving(true)
    const res = await fetch('/api/creator-goals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ monthly_revenue_goal: Math.round(dollars * 100) }),
    })
    if (res.ok) {
      setGoal(Math.round(dollars * 100))
      setEditing(false)
    }
    setSaving(false)
  }

  if (editing) {
    return (
      <div className="bg-card border border-border rounded-xl p-5 mb-8">
        <p className="text-sm font-medium text-foreground mb-3">Set a monthly goal</p>
        <div className="flex gap-2 items-center">
          <span className="text-sm text-muted-foreground">$</span>
          <input
            type="number"
            min={1}
            value={inputDollars}
            onChange={e => setInputDollars(e.target.value)}
            placeholder="e.g. 5000"
            className="border border-border rounded-lg px-3 py-1.5 text-sm bg-background text-foreground w-36 focus:outline-none focus:ring-1 focus:ring-brand"
          />
          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-foreground/90 text-background px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-foreground transition-colors disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
          {goal !== null && (
            <button onClick={() => setEditing(false)} className="text-xs text-muted-foreground hover:text-foreground transition-colors">
              Cancel
            </button>
          )}
        </div>
      </div>
    )
  }

  const pct = goal ? Math.min(100, Math.round((earnedThisMonthCents / goal) * 100)) : 0

  return (
    <div className="bg-card border border-border rounded-xl p-5 mb-8">
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm font-medium text-foreground">
          Monthly goal: {fmt(earnedThisMonthCents)} earned of {fmt(goal!)} target
        </p>
        <span className="text-sm font-semibold text-foreground">{pct}%</span>
      </div>
      <div className="w-full bg-muted rounded-full h-2">
        <div className="bg-brand h-2 rounded-full transition-all" style={{ width: `${pct}%` }} />
      </div>
      <button onClick={() => { setInputDollars(String(Math.round(goal! / 100))); setEditing(true) }} className="mt-2 text-xs text-muted-foreground hover:text-foreground transition-colors">
        Edit goal
      </button>
    </div>
  )
}
