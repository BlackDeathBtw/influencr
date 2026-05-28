import { createClient } from '@/lib/supabase/server'
import { Receipt, TrendingDown, Calendar, BarChart2 } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { AddExpenseButton, ExpenseTable } from './client'
import type { CreatorExpense } from './client'

function fmtDollars(cents: number) {
  return '$' + (cents / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function StatCard({
  label,
  value,
  sub,
  Icon,
}: {
  label: string
  value: string
  sub?: string
  Icon: LucideIcon
}) {
  return (
    <div className="bg-card border border-border rounded-xl p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium text-muted-foreground">{label}</span>
        <div className="w-8 h-8 bg-muted rounded-lg flex items-center justify-center">
          <Icon size={15} className="text-muted-foreground" />
        </div>
      </div>
      <p className="text-2xl font-bold text-foreground">{value}</p>
      {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
    </div>
  )
}

const CATEGORY_BAR: Record<string, string> = {
  equipment: 'bg-blue-500',
  software: 'bg-purple-500',
  travel: 'bg-amber-500',
  marketing: 'bg-green-500',
  other: 'bg-muted-foreground',
}

const CATEGORY_LABEL: Record<string, string> = {
  equipment: 'Equipment',
  software: 'Software',
  travel: 'Travel',
  marketing: 'Marketing',
  other: 'Other',
}

function CategoryBreakdown({ expenses }: { expenses: CreatorExpense[] }) {
  const total = expenses.reduce((s, e) => s + e.amount, 0)
  if (total === 0) return null

  const byCategory: Record<string, number> = {}
  for (const exp of expenses) {
    byCategory[exp.category] = (byCategory[exp.category] ?? 0) + exp.amount
  }

  const sorted = Object.entries(byCategory).sort((a, b) => b[1] - a[1])

  return (
    <div className="bg-card border border-border rounded-xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <BarChart2 size={15} className="text-muted-foreground" />
        <h2 className="text-sm font-semibold text-foreground">Spending by Category</h2>
      </div>
      <div className="space-y-3">
        {sorted.map(([cat, cents]) => {
          const pct = Math.round((cents / total) * 100)
          return (
            <div key={cat}>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-medium text-foreground">{CATEGORY_LABEL[cat] ?? cat}</span>
                <span className="text-muted-foreground">{fmtDollars(cents)} · {pct}%</span>
              </div>
              <div className="w-full bg-muted rounded-full h-1.5">
                <div
                  className={`${CATEGORY_BAR[cat] ?? 'bg-muted-foreground'} h-1.5 rounded-full transition-all`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default async function ExpensesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: rows } = await supabase
    .from('creator_expenses')
    .select('*')
    .eq('creator_id', user!.id)
    .order('date', { ascending: false })

  const expenses = (rows ?? []) as CreatorExpense[]

  const now = new Date()
  const thisYear = now.getFullYear()
  const thisMonth = now.getMonth()

  const totalAllTime = expenses.reduce((s, e) => s + e.amount, 0)

  const thisYearTotal = expenses
    .filter(e => new Date(e.date + 'T12:00:00').getFullYear() === thisYear)
    .reduce((s, e) => s + e.amount, 0)

  const thisMonthTotal = expenses
    .filter(e => {
      const d = new Date(e.date + 'T12:00:00')
      return d.getFullYear() === thisYear && d.getMonth() === thisMonth
    })
    .reduce((s, e) => s + e.amount, 0)

  return (
    <div className="p-8 space-y-6 max-w-5xl">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Expenses</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Track your business expenses and deductions</p>
        </div>
      </div>

      <AddExpenseButton />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="All Time" value={fmtDollars(totalAllTime)} Icon={Receipt} sub={`${expenses.length} expense${expenses.length !== 1 ? 's' : ''}`} />
        <StatCard label="This Month" value={fmtDollars(thisMonthTotal)} Icon={Calendar} />
        <StatCard label="This Year" value={fmtDollars(thisYearTotal)} Icon={TrendingDown} />
      </div>

      <CategoryBreakdown expenses={expenses} />

      <div>
        <h2 className="text-sm font-semibold text-foreground mb-3">All Expenses</h2>
        <ExpenseTable expenses={expenses} />
      </div>
    </div>
  )
}
