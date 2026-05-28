import { createClient } from '@/lib/supabase/server'
import { TrendingUp, DollarSign, Calendar, BarChart2 } from 'lucide-react'
import { type LucideIcon } from 'lucide-react'
import TaxSummary from './tax-summary'

interface Invoice {
  id: string
  brand_name: string
  description: string
  amount: number
  status: string
  paid_at: string | null
  due_date: string | null
  created_at: string
}

function fmtDollars(cents: number) {
  return '$' + (cents / 100).toLocaleString('en-US', { maximumFractionDigits: 0 })
}

function fmtDate(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
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

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export default async function EarningsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: invoices } = await supabase
    .from('creator_invoices')
    .select('*')
    .eq('creator_id', user!.id)
    .order('paid_at', { ascending: false })

  const { data: expenses } = await supabase
    .from('creator_expenses')
    .select('*')
    .eq('creator_id', user!.id)
    .order('date', { ascending: true })

  const all = (invoices ?? []) as Invoice[]
  const paid = all.filter(i => i.status === 'paid')

  const now = new Date()
  const thisYear = now.getFullYear()
  const thisMonth = now.getMonth()

  const totalAllTime = paid.reduce((s, i) => s + i.amount, 0)

  const thisYearEarned = paid
    .filter(i => i.paid_at && new Date(i.paid_at).getFullYear() === thisYear)
    .reduce((s, i) => s + i.amount, 0)

  const thisMonthEarned = paid
    .filter(i => {
      if (!i.paid_at) return false
      const d = new Date(i.paid_at)
      return d.getFullYear() === thisYear && d.getMonth() === thisMonth
    })
    .reduce((s, i) => s + i.amount, 0)

  const avgDealSize = paid.length > 0 ? Math.round(totalAllTime / paid.length) : 0

  // Build last 12 months data (oldest first for chart rendering order)
  const monthBuckets: { label: string; cents: number }[] = []
  for (let offset = 11; offset >= 0; offset--) {
    const d = new Date(thisYear, thisMonth - offset, 1)
    const y = d.getFullYear()
    const m = d.getMonth()
    const cents = paid
      .filter(i => {
        if (!i.paid_at) return false
        const pd = new Date(i.paid_at)
        return pd.getFullYear() === y && pd.getMonth() === m
      })
      .reduce((s, i) => s + i.amount, 0)
    monthBuckets.push({ label: `${MONTH_LABELS[m]} ${y !== thisYear ? String(y).slice(2) : ''}`.trim(), cents })
  }

  const maxMonthCents = Math.max(...monthBuckets.map(b => b.cents), 1)

  // By-brand breakdown (paid only)
  const brandMap = new Map<string, number>()
  for (const inv of paid) {
    brandMap.set(inv.brand_name, (brandMap.get(inv.brand_name) ?? 0) + inv.amount)
  }
  const topBrands = [...brandMap.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)

  const recentPaid = paid.slice(0, 10)

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="font-display text-2xl font-bold text-foreground">Earnings</h1>
        <p className="text-sm text-muted-foreground mt-1">Track your income from brand deals</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <StatCard label="Total earned" value={fmtDollars(totalAllTime)} Icon={TrendingUp} />
        <StatCard label="This year" value={fmtDollars(thisYearEarned)} sub={String(thisYear)} Icon={Calendar} />
        <StatCard label="This month" value={fmtDollars(thisMonthEarned)} sub={MONTH_LABELS[thisMonth]} Icon={DollarSign} />
        <StatCard
          label="Avg deal size"
          value={fmtDollars(avgDealSize)}
          sub={paid.length > 0 ? `${paid.length} paid deals` : 'No paid deals yet'}
          Icon={BarChart2}
        />
      </div>

      {/* Monthly chart */}
      <div className="bg-card border border-border rounded-xl p-5 mb-6">
        <h2 className="font-semibold text-foreground mb-5">Monthly earnings — last 12 months</h2>
        {totalAllTime === 0 ? (
          <p className="text-sm text-muted-foreground py-6 text-center">No paid invoices yet</p>
        ) : (
          <div className="space-y-2">
            {monthBuckets.map(({ label, cents }) => {
              const pct = maxMonthCents > 0 ? (cents / maxMonthCents) * 100 : 0
              return (
                <div key={label} className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground w-14 shrink-0 text-right">{label}</span>
                  <div className="flex-1 bg-muted rounded-full h-2.5 overflow-hidden">
                    <div
                      className="h-full bg-brand rounded-full transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="text-xs font-medium text-foreground w-16 shrink-0">
                    {cents > 0 ? fmtDollars(cents) : '—'}
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* By-brand breakdown */}
        <div className="bg-card border border-border rounded-xl p-5">
          <h2 className="font-semibold text-foreground mb-4">Top brands</h2>
          {topBrands.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">No brand earnings yet</p>
          ) : (
            <div className="space-y-0">
              {topBrands.map(([brand, cents], idx) => (
                <div key={brand} className="flex items-center justify-between py-2.5 border-b border-border last:border-0">
                  <div className="flex items-center gap-2.5">
                    <span className="text-xs text-muted-foreground w-5">{idx + 1}</span>
                    <span className="text-sm font-medium text-foreground">{brand}</span>
                  </div>
                  <span className="text-sm font-semibold text-foreground">{fmtDollars(cents)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent paid invoices */}
        <div className="bg-card border border-border rounded-xl p-5">
          <h2 className="font-semibold text-foreground mb-4">Recent payments</h2>
          {recentPaid.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">No paid invoices yet</p>
          ) : (
            <div className="space-y-0">
              {recentPaid.map(inv => (
                <div key={inv.id} className="flex items-center justify-between py-2.5 border-b border-border last:border-0">
                  <div className="min-w-0 flex-1 mr-3">
                    <p className="text-sm font-medium text-foreground truncate">{inv.brand_name}</p>
                    <p className="text-xs text-muted-foreground truncate">{inv.description || '—'}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-sm font-semibold text-foreground">{fmtDollars(inv.amount)}</p>
                    <p className="text-xs text-muted-foreground">{fmtDate(inv.paid_at)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <TaxSummary invoices={paid} expenses={(expenses ?? []) as any} />
    </div>
  )
}
