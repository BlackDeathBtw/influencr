import { createClient } from '@/lib/supabase/server'
import { getDashboardStats } from '@/lib/data'
import { Users, BarChart3, Calendar, CreditCard } from 'lucide-react'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { influencers, campaigns, upcomingContent, pendingPayments } = await getDashboardStats(user!.id)

  const totalInfluencers = influencers.length
  const activeInfluencers = influencers.filter((i: any) => i.status === 'active').length
  const totalCampaigns = campaigns.length
  const activeCampaigns = campaigns.filter((c: any) => c.status === 'active').length
  const pendingTotal = pendingPayments.reduce((sum: number, p: any) => sum + (Number(p.amount) ?? 0), 0)

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-zinc-900">Dashboard</h1>
        <p className="text-sm text-zinc-500 mt-1">Overview of your influencer relationships</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Influencers', value: totalInfluencers, sub: `${activeInfluencers} active`, icon: Users, href: '/influencers' },
          { label: 'Campaigns', value: totalCampaigns, sub: `${activeCampaigns} active`, icon: BarChart3, href: '/campaigns' },
          { label: 'Upcoming content', value: upcomingContent.length, sub: 'to be posted', icon: Calendar, href: '/campaigns' },
          { label: 'Pending payments', value: `$${pendingTotal.toLocaleString()}`, sub: `${pendingPayments.length} invoices`, icon: CreditCard, href: '/payments' },
        ].map(({ label, value, sub, icon: Icon, href }) => (
          <Link key={label} href={href} className="bg-white border border-zinc-200 rounded-xl p-5 hover:border-zinc-300 transition-colors">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-zinc-500">{label}</span>
              <div className="w-8 h-8 bg-zinc-100 rounded-lg flex items-center justify-center">
                <Icon size={15} className="text-zinc-600" />
              </div>
            </div>
            <p className="text-2xl font-bold text-zinc-900">{value}</p>
            <p className="text-xs text-zinc-400 mt-0.5">{sub}</p>
          </Link>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Upcoming content */}
        <div className="bg-white border border-zinc-200 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-zinc-900">Content due soon</h2>
            <Link href="/campaigns" className="text-xs text-zinc-500 hover:text-zinc-700">View all →</Link>
          </div>
          {upcomingContent.length === 0 ? (
            <p className="text-sm text-zinc-400 py-4 text-center">No upcoming content</p>
          ) : (
            <div className="space-y-3">
              {upcomingContent.map((c: any) => (
                <div key={c.id} className="flex items-center justify-between py-2 border-b border-zinc-100 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-zinc-800">{c.influencers?.name ?? '—'}</p>
                    <p className="text-xs text-zinc-400 capitalize">{c.type}</p>
                  </div>
                  {c.due_date && (
                    <span className="text-xs text-zinc-500">
                      {formatDistanceToNow(new Date(c.due_date), { addSuffix: true })}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pending payments */}
        <div className="bg-white border border-zinc-200 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-zinc-900">Pending payments</h2>
            <Link href="/payments" className="text-xs text-zinc-500 hover:text-zinc-700">View all →</Link>
          </div>
          {pendingPayments.length === 0 ? (
            <p className="text-sm text-zinc-400 py-4 text-center">No pending payments</p>
          ) : (
            <div className="space-y-3">
              {pendingPayments.map((p: any) => (
                <div key={p.id} className="flex items-center justify-between py-2 border-b border-zinc-100 last:border-0">
                  <p className="text-sm font-medium text-zinc-800">{p.influencers?.name ?? '—'}</p>
                  <div className="flex items-center gap-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      p.status === 'overdue' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                    }`}>{p.status}</span>
                    <span className="text-sm font-semibold text-zinc-900">
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
        <div className="mt-6 bg-zinc-900 text-white rounded-xl p-6 flex items-center justify-between">
          <div>
            <h3 className="font-semibold mb-1">Get started — add your first influencer</h3>
            <p className="text-sm text-zinc-400">Import your contacts or add them one by one.</p>
          </div>
          <Link
            href="/influencers/new"
            className="shrink-0 bg-white text-zinc-900 px-4 py-2 rounded-lg text-sm font-medium hover:bg-zinc-100 transition-colors"
          >
            Add influencer
          </Link>
        </div>
      )}
    </div>
  )
}
