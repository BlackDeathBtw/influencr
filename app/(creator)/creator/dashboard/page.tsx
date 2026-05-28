'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  DollarSign, Clock, AlertTriangle, TrendingUp,
  Briefcase, Calendar, Plus, Receipt, ArrowRight,
  PiggyBank, CheckSquare,
} from 'lucide-react'

interface DashboardData {
  totalEarned: number
  monthEarned: number
  yearEarned: number
  pendingPayout: number
  overdueCount: number
  activeDeals: number
  monthExpenses: number
  yearExpenses: number
  monthProfit: number
  taxReserve: number
  upcomingDeliverables: Array<{ id: string; title: string; deadline: string; status: string; creator_deals: { brand_name: string } | null }>
  recentPayments: Array<{ id: string; amount: number; status: string; date: string; creator_invoices: { brand_name: string } | null; creator_deals: { brand_name: string } | null }>
  recentInvoices: Array<{ amount: number; status: string; brand_name: string; description: string; created_at: string }>
}

const PAYMENT_STATUS_COLORS: Record<string, string> = {
  received: 'bg-green-500/15 text-green-400',
  expected: 'bg-sky-500/15 text-sky-400',
  partial:  'bg-amber-500/15 text-amber-400',
  late:     'bg-orange-500/15 text-orange-400',
  failed:   'bg-red-500/15 text-red-400',
}

const INVOICE_STATUS_COLORS: Record<string, string> = {
  draft:  'bg-muted text-muted-foreground',
  sent:   'bg-sky-500/15 text-sky-400',
  viewed: 'bg-amber-500/15 text-amber-400',
  paid:   'bg-green-500/15 text-green-400',
  overdue:'bg-red-500/15 text-red-400',
}

const DELIVERABLE_STATUS_COLORS: Record<string, string> = {
  not_started:       'bg-muted text-muted-foreground',
  planning:          'bg-sky-500/15 text-sky-400',
  filming:           'bg-violet-500/15 text-violet-400',
  editing:           'bg-amber-500/15 text-amber-400',
  sent_to_brand:     'bg-blue-500/15 text-blue-400',
  changes_requested: 'bg-orange-500/15 text-orange-400',
  approved:          'bg-teal-500/15 text-teal-400',
  posted:            'bg-green-500/15 text-green-400',
  completed:         'bg-muted text-muted-foreground',
}

function fmt(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export default function CreatorDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/creator-dashboard')
      .then(r => r.json())
      .then(setData)
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="p-8">
        <div className="mb-8"><h1 className="text-2xl font-bold text-foreground">Dashboard</h1></div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {Array.from({ length: 8 }).map((_, i) => <div key={i} className="bg-card border border-border rounded-xl p-5 h-24 animate-pulse" />)}
        </div>
      </div>
    )
  }

  const d = data!

  const stats = [
    { label: 'This month', value: fmt(d.monthEarned),    sub: 'revenue',          icon: DollarSign, color: 'text-green-400',  bg: 'bg-green-500/10' },
    { label: 'This year',  value: fmt(d.yearEarned),     sub: 'total earned',     icon: TrendingUp, color: 'text-brand',      bg: 'bg-brand/10' },
    { label: 'Pending',    value: fmt(d.pendingPayout),  sub: 'awaiting payment', icon: Clock,      color: 'text-amber-400',  bg: 'bg-amber-500/10' },
    { label: 'Overdue',    value: d.overdueCount,         sub: 'invoices',         icon: AlertTriangle, color: d.overdueCount > 0 ? 'text-red-400' : 'text-muted-foreground', bg: d.overdueCount > 0 ? 'bg-red-500/10' : 'bg-muted' },
    { label: 'Active deals', value: d.activeDeals,       sub: 'in progress',      icon: Briefcase,  color: 'text-violet-400', bg: 'bg-violet-500/10' },
    { label: 'Monthly profit', value: fmt(d.monthProfit),sub: 'revenue – expenses',icon: TrendingUp, color: d.monthProfit >= 0 ? 'text-green-400' : 'text-red-400', bg: d.monthProfit >= 0 ? 'bg-green-500/10' : 'bg-red-500/10' },
    { label: 'Expenses',   value: fmt(d.monthExpenses),  sub: 'this month',       icon: Receipt,    color: 'text-orange-400', bg: 'bg-orange-500/10' },
    { label: 'Tax reserve', value: fmt(d.taxReserve),    sub: '25% of yearly income', icon: PiggyBank, color: 'text-sky-400', bg: 'bg-sky-500/10' },
  ]

  return (
    <div className="p-8">
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">Your creator business at a glance</p>
        </div>
        <div className="flex gap-2">
          <Link href="/creator/invoices/new" className="flex items-center gap-2 bg-foreground/90 text-background px-3 py-2 rounded-lg text-sm font-medium hover:bg-foreground transition-colors">
            <Plus size={14} />New invoice
          </Link>
          <Link href="/creator/deals" className="flex items-center gap-2 bg-muted text-muted-foreground px-3 py-2 rounded-lg text-sm font-medium hover:bg-muted/80 transition-colors">
            <Plus size={14} />New deal
          </Link>
          <Link href="/creator/expenses" className="flex items-center gap-2 bg-muted text-muted-foreground px-3 py-2 rounded-lg text-sm font-medium hover:bg-muted/80 transition-colors">
            <Plus size={14} />New expense
          </Link>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map(({ label, value, sub, icon: Icon, color, bg }) => (
          <div key={label} className="bg-card border border-border rounded-xl p-5 hover:border-border/60 transition-colors">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-muted-foreground">{label}</span>
              <div className={`w-7 h-7 ${bg} rounded-lg flex items-center justify-center`}>
                <Icon size={13} className={color} />
              </div>
            </div>
            <p className="text-xl font-bold text-foreground">{value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Upcoming deliverables */}
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <h2 className="font-semibold text-foreground flex items-center gap-2"><Calendar size={15} /> Upcoming deadlines</h2>
            <Link href="/creator/deliverables" className="text-xs text-muted-foreground hover:text-foreground transition-colors">View all</Link>
          </div>
          {d.upcomingDeliverables.length === 0 ? (
            <div className="px-5 py-8 text-center text-sm text-muted-foreground/60">No upcoming deadlines</div>
          ) : (
            <div className="divide-y divide-border">
              {d.upcomingDeliverables.map(dl => (
                <div key={dl.id} className="px-5 py-3 hover:bg-muted/30 transition-colors">
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{dl.title}</p>
                      <p className="text-xs text-muted-foreground">{dl.creator_deals?.brand_name ?? '—'}</p>
                    </div>
                    <div className="shrink-0 flex items-center gap-2">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${DELIVERABLE_STATUS_COLORS[dl.status] ?? 'bg-muted text-muted-foreground'}`}>{dl.status.replace(/_/g, ' ')}</span>
                      <span className="text-xs text-muted-foreground">{fmtDate(dl.deadline)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent invoices */}
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <h2 className="font-semibold text-foreground flex items-center gap-2"><Receipt size={15} /> Recent invoices</h2>
            <Link href="/creator/invoices" className="text-xs text-muted-foreground hover:text-foreground transition-colors">View all</Link>
          </div>
          {d.recentInvoices.length === 0 ? (
            <div className="px-5 py-8 text-center">
              <p className="text-sm text-muted-foreground/60 mb-3">No invoices yet</p>
              <Link href="/creator/invoices/new" className="text-xs font-medium text-brand hover:underline">Create your first invoice →</Link>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {d.recentInvoices.map((inv, i) => (
                <div key={i} className="px-5 py-3 hover:bg-muted/30 transition-colors">
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{inv.brand_name}</p>
                      <p className="text-xs text-muted-foreground truncate">{inv.description}</p>
                    </div>
                    <div className="shrink-0 flex items-center gap-2">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${INVOICE_STATUS_COLORS[inv.status] ?? 'bg-muted text-muted-foreground'}`}>{inv.status}</span>
                      <span className="text-xs font-semibold text-foreground">{fmt(inv.amount / 100)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent payments */}
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <h2 className="font-semibold text-foreground flex items-center gap-2"><DollarSign size={15} /> Recent payments</h2>
            <Link href="/creator/payments" className="text-xs text-muted-foreground hover:text-foreground transition-colors">View all</Link>
          </div>
          {d.recentPayments.length === 0 ? (
            <div className="px-5 py-8 text-center">
              <p className="text-sm text-muted-foreground/60 mb-3">No payments logged</p>
              <Link href="/creator/payments" className="text-xs font-medium text-brand hover:underline">Log a payment →</Link>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {d.recentPayments.map(p => (
                <div key={p.id} className="px-5 py-3 hover:bg-muted/30 transition-colors">
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {p.creator_invoices?.brand_name ?? p.creator_deals?.brand_name ?? 'Manual entry'}
                      </p>
                      <p className="text-xs text-muted-foreground">{p.date ? fmtDate(p.date) : '—'}</p>
                    </div>
                    <div className="shrink-0 flex items-center gap-2">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${PAYMENT_STATUS_COLORS[p.status] ?? 'bg-muted text-muted-foreground'}`}>{p.status}</span>
                      <span className="text-xs font-semibold text-foreground">{fmt(Number(p.amount))}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Warnings */}
      {d.overdueCount > 0 && (
        <div className="mt-6 bg-red-500/10 border border-red-500/20 rounded-xl px-5 py-3 flex items-center gap-3">
          <AlertTriangle size={15} className="text-red-400 shrink-0" />
          <p className="text-sm text-foreground/80">
            <span className="font-semibold text-foreground">{d.overdueCount} invoice{d.overdueCount > 1 ? 's' : ''} overdue</span> — follow up with your clients.
          </p>
          <Link href="/creator/invoices" className="ml-auto shrink-0 flex items-center gap-1 text-xs font-medium text-red-400 hover:text-red-300 transition-colors">
            View <ArrowRight size={12} />
          </Link>
        </div>
      )}
    </div>
  )
}
