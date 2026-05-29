import { createClient } from '@/lib/supabase/server'
import { getCampaignAnalytics } from '@/lib/analytics-data'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, BarChart2 } from 'lucide-react'

const statusColors: Record<string, string> = {
  planning: 'bg-blue-500/15 text-blue-400',
  active: 'bg-green-500/15 text-green-400',
  completed: 'bg-purple-500/15 text-purple-400',
  paused: 'bg-amber-500/15 text-amber-400',
}

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return n.toLocaleString()
}

function formatCurrency(n: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)
}

export default async function CampaignAnalyticsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) notFound()

  const analytics = await getCampaignAnalytics(user.id, id)
  if (!analytics) notFound()

  const ctr = analytics.total_impressions > 0
    ? ((analytics.total_clicks / analytics.total_impressions) * 100).toFixed(2)
    : '0.00'

  const hasData = analytics.total_impressions > 0 || analytics.total_clicks > 0 || analytics.total_conversions > 0 || analytics.total_spend > 0

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <Link
            href={`/campaigns/${id}`}
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <ChevronLeft size={14} /> Back to campaign
          </Link>
          <div className="flex items-center gap-3 mt-1">
            <h1 className="text-2xl font-bold text-foreground">{analytics.name}</h1>
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusColors[analytics.status] ?? 'bg-muted text-muted-foreground'}`}>
              {analytics.status}
            </span>
          </div>
          <p className="text-sm text-muted-foreground flex items-center gap-1">
            <BarChart2 size={14} /> Campaign Analytics
          </p>
        </div>
        <Link
          href={`/campaigns/${id}/analytics/edit`}
          className="text-sm px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          Update metrics
        </Link>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-xs text-muted-foreground mb-1">Impressions</p>
          <p className="text-2xl font-bold text-foreground">{formatNumber(analytics.total_impressions)}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-xs text-muted-foreground mb-1">Clicks</p>
          <p className="text-2xl font-bold text-foreground">{formatNumber(analytics.total_clicks)}</p>
          <p className="text-xs text-muted-foreground mt-0.5">CTR {ctr}%</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-xs text-muted-foreground mb-1">Conversions</p>
          <p className="text-2xl font-bold text-foreground">{formatNumber(analytics.total_conversions)}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-xs text-muted-foreground mb-1">Spend</p>
          <p className="text-2xl font-bold text-foreground">{formatCurrency(analytics.total_spend)}</p>
        </div>
      </div>

      {/* ROI / Budget Card */}
      <div className="bg-card border border-border rounded-xl p-4">
        <p className="text-xs text-muted-foreground mb-2">Budget vs Spend</p>
        <div className="flex items-end gap-6">
          {analytics.budget != null ? (
            <>
              <div>
                <p className="text-2xl font-bold text-foreground">{formatCurrency(analytics.total_spend)}</p>
                <p className="text-xs text-muted-foreground">spent of {formatCurrency(analytics.budget)} budget</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">
                  {analytics.budget > 0 ? `${((analytics.total_spend / analytics.budget) * 100).toFixed(0)}%` : '—'}
                </p>
                <p className="text-xs text-muted-foreground">utilization</p>
              </div>
              {analytics.total_conversions > 0 && analytics.total_spend > 0 && (
                <div>
                  <p className="text-2xl font-bold text-foreground">
                    {formatCurrency(analytics.total_spend / analytics.total_conversions)}
                  </p>
                  <p className="text-xs text-muted-foreground">cost per conversion</p>
                </div>
              )}
            </>
          ) : (
            <p className="text-sm text-muted-foreground">No budget set for this campaign.</p>
          )}
        </div>
      </div>

      {/* Per-creator breakdown */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-border">
          <h2 className="font-semibold text-foreground text-sm">Creator breakdown</h2>
        </div>

        {!hasData || analytics.creators.length === 0 ? (
          <div className="px-4 py-10 text-center">
            <p className="text-sm text-muted-foreground">No analytics data yet — update creator metrics below</p>
            <Link
              href={`/campaigns/${id}/analytics/edit`}
              className="mt-3 inline-block text-sm text-primary hover:underline"
            >
              Add creator metrics
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left px-4 py-2 text-xs text-muted-foreground font-medium">Creator</th>
                  <th className="text-left px-4 py-2 text-xs text-muted-foreground font-medium">Platform</th>
                  <th className="text-right px-4 py-2 text-xs text-muted-foreground font-medium">Followers</th>
                  <th className="text-right px-4 py-2 text-xs text-muted-foreground font-medium">Impressions</th>
                  <th className="text-right px-4 py-2 text-xs text-muted-foreground font-medium">Clicks</th>
                  <th className="text-right px-4 py-2 text-xs text-muted-foreground font-medium">Conversions</th>
                  <th className="text-right px-4 py-2 text-xs text-muted-foreground font-medium">Spend</th>
                  <th className="text-left px-4 py-2 text-xs text-muted-foreground font-medium">Notes</th>
                </tr>
              </thead>
              <tbody>
                {analytics.creators.map((creator) => (
                  <tr key={creator.influencer_id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 text-foreground font-medium">{creator.name}</td>
                    <td className="px-4 py-3 text-muted-foreground capitalize">{creator.platform ?? '—'}</td>
                    <td className="px-4 py-3 text-right text-muted-foreground">
                      {creator.followers != null ? formatNumber(creator.followers) : '—'}
                    </td>
                    <td className="px-4 py-3 text-right text-foreground">{formatNumber(creator.impressions)}</td>
                    <td className="px-4 py-3 text-right text-foreground">{formatNumber(creator.clicks)}</td>
                    <td className="px-4 py-3 text-right text-foreground">{formatNumber(creator.conversions)}</td>
                    <td className="px-4 py-3 text-right text-foreground">{formatCurrency(creator.spend)}</td>
                    <td className="px-4 py-3 text-muted-foreground max-w-[200px] truncate">{creator.notes ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="flex justify-end">
        <Link
          href={`/campaigns/${id}`}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          Back to campaign details
        </Link>
      </div>
    </div>
  )
}
