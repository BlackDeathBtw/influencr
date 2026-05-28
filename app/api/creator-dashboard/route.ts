import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
  const startOfYear = new Date(now.getFullYear(), 0, 1).toISOString()

  const [invoicesRes, dealsRes, deliverablesRes, expensesRes, paymentsRes] = await Promise.all([
    supabase.from('creator_invoices').select('amount,status,created_at,brand_name,description').eq('creator_id', user.id),
    supabase.from('creator_deals').select('id,title,brand_name,value,status,end_date').eq('creator_id', user.id),
    supabase.from('creator_deliverables').select('id,title,deadline,status,creator_deals(brand_name)').eq('creator_id', user.id).not('deadline', 'is', null).gte('deadline', now.toISOString().split('T')[0]).order('deadline', { ascending: true }).limit(5),
    supabase.from('creator_expenses').select('amount,date').eq('creator_id', user.id),
    supabase.from('creator_payments_log').select('amount,status,date,creator_invoices(brand_name),creator_deals(brand_name)').eq('creator_id', user.id).order('created_at', { ascending: false }).limit(5),
  ])

  const invoices = invoicesRes.data ?? []
  const deals = dealsRes.data ?? []
  const deliverables = deliverablesRes.data ?? []
  const expenses = expensesRes.data ?? []
  const recentPayments = paymentsRes.data ?? []

  const paidInvoices = invoices.filter(i => i.status === 'paid')
  const totalEarned = paidInvoices.reduce((s, i) => s + i.amount, 0) / 100
  const monthEarned = paidInvoices
    .filter(i => i.created_at >= startOfMonth)
    .reduce((s, i) => s + i.amount, 0) / 100
  const yearEarned = paidInvoices
    .filter(i => i.created_at >= startOfYear)
    .reduce((s, i) => s + i.amount, 0) / 100

  const pendingInvoices = invoices.filter(i => ['sent', 'viewed'].includes(i.status))
  const pendingPayout = pendingInvoices.reduce((s, i) => s + i.amount, 0) / 100

  const today = now.toISOString().split('T')[0]
  const overdueInvoices = invoices.filter(i => i.status !== 'paid' && i.status !== 'draft')
  const activeDeals = deals.filter(d => !['completed', 'cancelled', 'paid'].includes(d.status))

  const monthExpenses = expenses
    .filter(e => e.date >= startOfMonth.split('T')[0])
    .reduce((s, e) => s + Number(e.amount), 0)
  const yearExpenses = expenses
    .filter(e => e.date >= startOfYear.split('T')[0])
    .reduce((s, e) => s + Number(e.amount), 0)

  const monthProfit = monthEarned - monthExpenses
  const taxReserve = Math.round(yearEarned * 0.25)

  return NextResponse.json({
    totalEarned,
    monthEarned,
    yearEarned,
    pendingPayout,
    overdueCount: overdueInvoices.length,
    activeDeals: activeDeals.length,
    monthExpenses,
    yearExpenses,
    monthProfit,
    taxReserve,
    upcomingDeliverables: deliverables,
    recentPayments,
    recentInvoices: invoices.slice(0, 5),
  })
}
