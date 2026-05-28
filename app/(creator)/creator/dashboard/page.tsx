import { createClient } from '@/lib/supabase/server'
import { TrendingUp, Clock, AlertCircle, CheckCircle2, Plus } from 'lucide-react'
import Link from 'next/link'
import { type LucideIcon } from 'lucide-react'
import GoalTracker from './goal-tracker'

interface CreatorInvoice {
  id: string
  brand_name: string
  description: string
  amount: number
  status: string
  paid_at: string | null
  due_date: string | null
  created_at: string
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    draft: 'bg-muted text-muted-foreground',
    sent: 'bg-blue-100 text-blue-700',
    viewed: 'bg-amber-100 text-amber-700',
    paid: 'bg-green-100 text-green-700',
  }
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${map[status] ?? 'bg-muted text-muted-foreground'}`}>
      {status}
    </span>
  )
}

function StatCard({ label, value, sub, Icon, valueClass }: { label: string; value: string; sub?: string; Icon: LucideIcon; valueClass?: string }) {
  return (
    <div className="bg-card border border-border rounded-xl p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium text-muted-foreground">{label}</span>
        <div className="w-8 h-8 bg-muted rounded-lg flex items-center justify-center">
          <Icon size={15} className="text-muted-foreground" />
        </div>
      </div>
      <p className={`text-2xl font-bold ${valueClass ?? 'text-foreground'}`}>{value}</p>
      {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
    </div>
  )
}

function fmtDollars(cents: number) {
  return '$' + (cents / 100).toLocaleString('en-US', { maximumFractionDigits: 0 })
}

export default async function CreatorDashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const now = new Date()
  const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
  const today = now.toISOString().slice(0, 10)

  const { data: invoices } = await supabase
    .from('creator_invoices')
    .select('*')
    .eq('creator_id', user!.id)
    .order('created_at', { ascending: false })

  const all = (invoices ?? []) as CreatorInvoice[]

  const earnedThisMonth = all
    .filter(i => i.status === 'paid' && i.paid_at != null && i.paid_at >= firstOfMonth)
    .reduce((s, i) => s + i.amount, 0)

  const outstanding = all.filter(i => i.status !== 'paid')
  const outstandingTotal = outstanding.reduce((s, i) => s + i.amount, 0)

  const overdueCount = all.filter(
    i => ['sent', 'viewed'].includes(i.status) && i.due_date != null && i.due_date < today
  ).length

  const paidAllTime = all.filter(i => i.status === 'paid').reduce((s, i) => s + i.amount, 0)

  const { data: goalRow } = await supabase
    .from('creator_goals')
    .select('monthly_revenue_goal')
    .eq('creator_id', user!.id)
    .maybeSingle()

  const goalCents: number | null = goalRow?.monthly_revenue_goal ?? null
  const recent = all.slice(0, 5)

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="font-display text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">Your creator overview</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <StatCard label="Earned this month" value={fmtDollars(earnedThisMonth)} Icon={TrendingUp} />
        <StatCard label="Outstanding" value={fmtDollars(outstandingTotal)} sub={`${outstanding.length} invoice${outstanding.length !== 1 ? 's' : ''}`} Icon={Clock} />
        <StatCard label="Overdue" value={String(overdueCount)} Icon={AlertCircle} valueClass={overdueCount > 0 ? 'text-red-600' : 'text-foreground'} />
        <StatCard label="Paid all time" value={fmtDollars(paidAllTime)} Icon={CheckCircle2} />
      </div>

      <GoalTracker earnedThisMonthCents={earnedThisMonth} goalCents={goalCents} userId={user!.id} />

      <div className="bg-card border border-border rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-foreground">Recent invoices</h2>
          <Link href="/creator/invoices" className="text-xs text-muted-foreground hover:text-foreground transition-colors">View all</Link>
        </div>

        {recent.length === 0 ? (
          <div className="py-10 text-center">
            <p className="text-sm text-muted-foreground mb-4">No invoices yet</p>
            <Link href="/creator/invoices/new" className="inline-flex items-center gap-2 bg-foreground/90 text-background px-4 py-2 rounded-lg text-sm font-medium hover:bg-foreground transition-colors">
              <Plus size={14} />Create invoice
            </Link>
          </div>
        ) : (
          <div className="space-y-0">
            {recent.map(invoice => (
              <div key={invoice.id} className="flex items-center justify-between py-3 border-b border-border last:border-0">
                <div>
                  <p className="text-sm font-medium text-foreground">{invoice.brand_name}</p>
                  <p className="text-xs text-muted-foreground truncate max-w-48">{invoice.description}</p>
                </div>
                <div className="flex items-center gap-3">
                  <StatusBadge status={invoice.status} />
                  <span className="text-sm font-semibold text-foreground">${(invoice.amount / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {recent.length > 0 && (
          <div className="mt-4 pt-4 border-t border-border">
            <Link href="/creator/invoices/new" className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              <Plus size={14} />Create invoice
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
