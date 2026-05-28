'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Trash2, X } from 'lucide-react'

export interface CreatorExpense {
  id: string
  creator_id: string
  amount: number
  category: string
  description: string
  date: string
  created_at: string
}

const CATEGORIES = [
  { value: 'equipment', label: 'Equipment' },
  { value: 'software', label: 'Software' },
  { value: 'travel', label: 'Travel' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'other', label: 'Other' },
]

const CATEGORY_BADGE: Record<string, string> = {
  equipment: 'bg-blue-100 text-blue-700',
  software: 'bg-purple-100 text-purple-700',
  travel: 'bg-amber-100 text-amber-700',
  marketing: 'bg-green-100 text-green-700',
  other: 'bg-muted text-muted-foreground',
}

function todayISO() {
  return new Date().toISOString().slice(0, 10)
}

function AddExpenseForm({ onClose }: { onClose: () => void }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState({
    description: '',
    amount: '',
    category: 'equipment',
    date: todayISO(),
  })

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const res = await fetch('/api/creator-expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description: form.description,
          amount_dollars: form.amount,
          category: form.category,
          date: form.date,
        }),
      })
      if (!res.ok) {
        const json = await res.json()
        setError(json.error ?? 'Failed to add expense')
        return
      }
      router.refresh()
      onClose()
    } catch {
      setError('Network error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-card border border-border rounded-xl p-5 space-y-4"
    >
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">Add Expense</h3>
        <button
          type="button"
          onClick={onClose}
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          <X size={15} />
        </button>
      </div>

      {error && (
        <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2">
          <label className="block text-xs font-medium text-muted-foreground mb-1">
            Description
          </label>
          <input
            name="description"
            value={form.description}
            onChange={handleChange}
            required
            placeholder="e.g. Adobe Creative Cloud"
            className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-brand/50"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1">
            Amount (USD)
          </label>
          <input
            name="amount"
            type="number"
            min="0.01"
            step="0.01"
            value={form.amount}
            onChange={handleChange}
            required
            placeholder="0.00"
            className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-brand/50"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1">
            Category
          </label>
          <select
            name="category"
            value={form.category}
            onChange={handleChange}
            className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-brand/50"
          >
            {CATEGORIES.map(c => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
        </div>

        <div className="sm:col-span-2">
          <label className="block text-xs font-medium text-muted-foreground mb-1">
            Date
          </label>
          <input
            name="date"
            type="date"
            value={form.date}
            onChange={handleChange}
            required
            className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-brand/50"
          />
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="bg-brand text-brand-foreground px-4 py-2 rounded-lg text-sm font-semibold hover:opacity-90 disabled:opacity-50 transition-opacity"
        >
          {loading ? 'Adding…' : 'Add Expense'}
        </button>
      </div>
    </form>
  )
}

function DeleteButton({ id }: { id: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleDelete() {
    if (!confirm('Delete this expense?')) return
    setLoading(true)
    try {
      await fetch(`/api/creator-expenses?id=${id}`, { method: 'DELETE' })
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleDelete}
      disabled={loading}
      className="text-muted-foreground hover:text-red-600 disabled:opacity-40 transition-colors"
      title="Delete expense"
    >
      <Trash2 size={13} />
    </button>
  )
}

export function AddExpenseButton() {
  const [open, setOpen] = useState(false)

  return (
    <div className="space-y-4">
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-2 bg-brand text-brand-foreground px-4 py-2 rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity"
        >
          <Plus size={14} />
          Add Expense
        </button>
      )}
      {open && <AddExpenseForm onClose={() => setOpen(false)} />}
    </div>
  )
}

export function ExpenseTable({ expenses }: { expenses: CreatorExpense[] }) {
  if (expenses.length === 0) {
    return (
      <div className="bg-card border border-border rounded-xl p-10 text-center">
        <p className="text-muted-foreground text-sm">No expenses yet. Add your first expense above.</p>
      </div>
    )
  }

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border">
            <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Date</th>
            <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Description</th>
            <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Category</th>
            <th className="text-right px-5 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Amount</th>
            <th className="px-5 py-3" />
          </tr>
        </thead>
        <tbody>
          {expenses.map(exp => (
            <tr key={exp.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
              <td className="px-5 py-3.5 text-muted-foreground whitespace-nowrap">
                {new Date(exp.date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </td>
              <td className="px-5 py-3.5 font-medium text-foreground truncate max-w-52">{exp.description}</td>
              <td className="px-5 py-3.5">
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${CATEGORY_BADGE[exp.category] ?? CATEGORY_BADGE.other}`}>
                  {exp.category}
                </span>
              </td>
              <td className="px-5 py-3.5 text-right font-semibold text-foreground">
                ${(exp.amount / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </td>
              <td className="px-5 py-3.5 text-right">
                <DeleteButton id={exp.id} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
