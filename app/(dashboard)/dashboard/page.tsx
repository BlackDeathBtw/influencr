import { createClient } from '@/lib/supabase/server'
import { getDashboardStats } from '@/lib/data'
import { Users, BarChart3, Calendar, CreditCard } from 'lucide-react'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import DashboardCharts from '@/components/dashboard-charts'

const CAMPAIGN_STATUSES = ['planning', 'active', 'paused', 'completed']
const DEAL_STATUSES = ['outreach', 'negotiating', 'confirmed', 'declined']

function getLastSixMonths(): { key: string; label: string }[] {
  const months = []
  for (let i = 5; i >= 0; i--) {
    const d = new Date()
    d.setMonth(d.getMonth() - i)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    const label = d.toLocaleString('en-US', { month: 'short' })
    months.push({ key, label })
  }
  return months
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const sixMonthsAgo = new Date()
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

  const [statsData, { data: allCampaigns }, { data: paidPayments }] = await Promise.all([
    getDashboardStats(user!.id),
    supabase.from('campaigns').select('id, status').eq('user_id', user!.id),
    supabase.from('payments').select('amount, paid_at').eq('user_id', user!.id).eq('status', 'paid').gte('paid_at', sixMonthsAgo.toISOString()),
  ])

  const campaignIds = (allCampaigns ?? []).map((c: { id: string }) => c.id)
  const { data: allDeals } = campaignIds.length > 0
    ? await supabase.from('campaign_influencers').select('status').in('campaign_id', campaignIds)
    : { data: [] }

  const { influencers, campaigns, upcomingContent, pendingPayments } = statsData

  // Spend trend
  const months = getLastSixMonths()
  const spendByMonth = (paidPayments ?? []).reduce((acc: Record<string, number>, p: any) => {
    const key = p.paid_at?.slice(0, 7)
    if (key) acc[key] = (acc[key] ?? 0) + Number(p.amount)
    return acc
  }, {})
  const spendTrend = months.map(m => ({ month: m.label, amount: Math.round(spendByMonth[m.key] ?? 0) }))

  // Campaign status breakdown
  const campaignCounts = (allCampaigns ?? []).reduce((acc: Record<string, number>, c: any) => {
    acc[c.status] = (acc[c.status] ?? 0) + 1
    return acc
  }, {})
  const campaignStatuses = CAMPAIGN_STATUSES.map(s => ({ name: s, value: campaignCounts[s] ?? 0 })).filter(s => s.value > 0)

  // Deal pipeline
  const dealCounts = (allDeals ?? []).reduce((acc: Record<string, number>, d: any) => {
    acc[d.status] = (acc[d.status] ?? 0) + 1
    return acc
  }, {})
  const dealPipeline = DEAL_STATUSES.map(s => ({ name: s, value: dealCounts[s] ?? 0 }))

  const totalInfluencers = influencers.length
  const activeInfluencers = influencers.filter((i: any) => i.status === 'active').length
  const totalCampaigns = campaigns.length
  const activeCampaigns = campaigns.filter((c: any) => c.status === 'active').length
  const pendingTotal = pendingPayments.reduce((sum: number, p: any) => sum + (Number(p.amount) ?? 0), 0)

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="font-display text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">Overview of your influencer relationships</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Influencers', value: totalInfluencers, sub: `${activeInfluencers} active`, icon: Users, href: '/influencers' },
          { label: 'Campaigns', value: totalCampaigns, sub: `${activeCampaigns} active`, icon: BarChart3, href: '/campaigns' },
          { label: 'Upcoming content', value: upcomingContent.length, sub: 'to be posted', icon: Calendar, href: '/campaigns' },
          { label: 'Pending payments', value: `$${pendingTotal.toLocaleString()}`, sub: `${pendingPayments.length} invoices`, icon: CreditCard, href: '/payments' },
        ].map(({ label, value, sub, icon: Icon, href }) => (
          <Link
            key={label}
            href={href}
            className="bg-card border border-border rounded-xl p-5 hover:border-brand/40 transition-colors group"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-muted-foreground">{label}</span>
              <div className="w-8 h-8 bg-muted rounded-lg flex items-center justify-center group-hover:bg-brand/10 transition-colors">
                <Icon size={15} className="text-muted-foreground group-hover:text-brand transition-colors" />
              </div>
            </div>
            <p className="text-2xl font-bold text-foreground">{value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>
          </Link>
        ))}
      </div>

      <DashboardCharts spendTrend={spendTrend} campaignStatuses={campaignStatuses} dealPipeline={dealPipeline} />

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Upcoming content */}
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-foreground">Content due soon</h2>
            <Link href="/campaigns" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
              View all
            </Link>
          </div>
          {upcomingContent.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">No upcoming content</p>
          ) : (
            <div className="space-y-0">
              {upcomingContent.map((c: any) => (
                <div key={c.id} className="flex items-center justify-between py-3 border-b border-border last:border-0">
                  <div>
                    <p className="text-sm font-medium text-foreground">{c.influencers?.name ?? '—'}</p>
                    <p className="text-xs text-muted-foreground capitalize">{c.type}</p>
                  </div>
                  {c.due_date && (
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(c.due_date), { addSuffix: true })}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pending payments */}
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-foreground">Pending payments</h2>
            <Link href="/payments" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
              View all
            </Link>
          </div>
          {pendingPayments.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">No pending payments</p>
          ) : (
            <div className="space-y-0">
              {pendingPayments.map((p: any) => (
                <div key={p.id} className="flex items-center justify-between py-3 border-b border-border last:border-0">
                  <p className="text-sm font-medium text-foreground">{p.influencers?.name ?? '—'}</p>
                  <div className="flex items-center gap-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      p.status === 'overdue' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                    }`}>
                      {p.status}
                    </span>
                    <span className="text-sm font-semibold text-foreground">
                      {p.currency} {Number(p.amount).toLocaleString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {totalInfluencers === 0 && (
        <div className="mt-6 bg-brand-dark rounded-xl p-6 flex items-center justify-between gap-4">
          <div>
            <h3 className="font-semibold text-white mb-1">Get started — add your first influencer</h3>
            <p className="text-sm text-white/50">Import your contacts or add them one by one.</p>
          </div>
          <Link
            href="/influencers/new"
            className="shrink-0 bg-brand text-brand-foreground px-4 py-2 rounded-lg text-sm font-bold hover:brightness-110 transition-all"
          >
            Add influencer
          </Link>
        </div>
      )}
    </div>
  )
}
