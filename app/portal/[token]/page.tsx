import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { Calendar, CreditCard, CheckCircle, Clock, AlertCircle } from 'lucide-react'

const contentStatusIcon: Record<string, React.ReactNode> = {
  briefed: <Clock size={14} className="text-zinc-400" />,
  in_review: <Clock size={14} className="text-amber-500" />,
  approved: <CheckCircle size={14} className="text-blue-500" />,
  posted: <CheckCircle size={14} className="text-green-500" />,
}

const paymentStatusColors: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-700',
  paid: 'bg-green-100 text-green-700',
  overdue: 'bg-red-100 text-red-700',
}

export default async function PortalPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params

  // Use service role via server client to look up by token (no auth needed)
  const supabase = await createClient()

  const { data: influencer } = await supabase
    .from('influencers')
    .select('id, name, handle, platform, niche, portal_token')
    .eq('portal_token', token)
    .single()

  if (!influencer) notFound()

  const [{ data: campaignInfluencers }, { data: content }, { data: payments }] = await Promise.all([
    supabase
      .from('campaign_influencers')
      .select('*, campaign:campaigns(name, status, start_date, end_date)')
      .eq('influencer_id', influencer.id),
    supabase
      .from('content')
      .select('*')
      .eq('influencer_id', influencer.id)
      .order('due_date', { ascending: true }),
    supabase
      .from('payments')
      .select('*')
      .eq('influencer_id', influencer.id)
      .order('due_date', { ascending: false }),
  ])

  const activeCampaigns = (campaignInfluencers ?? []).filter((ci: any) =>
    ci.campaign?.status === 'active' || ci.campaign?.status === 'planning'
  )

  return (
    <div className="min-h-screen bg-zinc-50">
      <div className="max-w-2xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 bg-zinc-900 text-white px-3 py-1 rounded-full text-xs font-medium mb-4">
            influencr portal
          </div>
          <h1 className="text-3xl font-bold text-zinc-900">{influencer.name}</h1>
          {influencer.handle && <p className="text-zinc-500 mt-1">{influencer.handle}</p>}
          {influencer.platform && (
            <p className="text-sm text-zinc-400 mt-0.5 capitalize">{influencer.platform} · {influencer.niche ?? 'Creator'}</p>
          )}
        </div>

        {/* Active campaigns */}
        {activeCampaigns.length > 0 && (
          <section className="mb-6">
            <h2 className="text-sm font-semibold text-zinc-500 uppercase tracking-wide mb-3">Active Campaigns</h2>
            <div className="space-y-3">
              {activeCampaigns.map((ci: any) => (
                <div key={ci.id} className="bg-white border border-zinc-200 rounded-xl p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold text-zinc-900">{ci.campaign?.name}</p>
                      {ci.campaign?.start_date && ci.campaign?.end_date && (
                        <p className="text-xs text-zinc-400 mt-0.5">
                          {new Date(ci.campaign.start_date).toLocaleDateString()} – {new Date(ci.campaign.end_date).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      {ci.fee && (
                        <p className="font-semibold text-zinc-900">${Number(ci.fee).toLocaleString()}</p>
                      )}
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${
                        ci.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                        ci.status === 'negotiating' ? 'bg-amber-100 text-amber-700' :
                        'bg-zinc-100 text-zinc-600'
                      }`}>{ci.status}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Content deadlines */}
        {(content ?? []).length > 0 && (
          <section className="mb-6">
            <h2 className="text-sm font-semibold text-zinc-500 uppercase tracking-wide mb-3">Content Assignments</h2>
            <div className="bg-white border border-zinc-200 rounded-xl divide-y divide-zinc-100">
              {(content ?? []).map((c: any) => (
                <div key={c.id} className="flex items-center justify-between px-4 py-3">
                  <div className="flex items-center gap-3">
                    {contentStatusIcon[c.status] ?? <Clock size={14} className="text-zinc-400" />}
                    <div>
                      <p className="text-sm font-medium text-zinc-800 capitalize">{c.type}</p>
                      {c.due_date && (
                        <div className="flex items-center gap-1 mt-0.5">
                          <Calendar size={11} className="text-zinc-400" />
                          <span className="text-xs text-zinc-400">Due {new Date(c.due_date).toLocaleDateString()}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {c.url && (
                      <a href={c.url} target="_blank" rel="noopener noreferrer"
                        className="text-xs text-blue-600 hover:underline">View post</a>
                    )}
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${
                      c.status === 'posted' ? 'bg-green-100 text-green-700' :
                      c.status === 'approved' ? 'bg-blue-100 text-blue-700' :
                      c.status === 'in_review' ? 'bg-amber-100 text-amber-700' :
                      'bg-zinc-100 text-zinc-600'
                    }`}>{c.status.replace('_', ' ')}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Payments */}
        {(payments ?? []).length > 0 && (
          <section className="mb-6">
            <h2 className="text-sm font-semibold text-zinc-500 uppercase tracking-wide mb-3">Payments</h2>
            <div className="bg-white border border-zinc-200 rounded-xl divide-y divide-zinc-100">
              {(payments ?? []).map((p: any) => (
                <div key={p.id} className="flex items-center justify-between px-4 py-3">
                  <div className="flex items-center gap-3">
                    <CreditCard size={14} className="text-zinc-400" />
                    <div>
                      <p className="text-sm font-semibold text-zinc-800">
                        {p.currency} {Number(p.amount).toLocaleString()}
                      </p>
                      {p.due_date && p.status !== 'paid' && (
                        <p className="text-xs text-zinc-400">Due {new Date(p.due_date).toLocaleDateString()}</p>
                      )}
                      {p.paid_at && (
                        <p className="text-xs text-zinc-400">Paid {new Date(p.paid_at).toLocaleDateString()}</p>
                      )}
                    </div>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${paymentStatusColors[p.status] ?? 'bg-zinc-100 text-zinc-600'}`}>
                    {p.status}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}

        {activeCampaigns.length === 0 && (content ?? []).length === 0 && (payments ?? []).length === 0 && (
          <div className="text-center py-12 text-zinc-400 text-sm">No active assignments yet.</div>
        )}

        <p className="text-center text-xs text-zinc-300 mt-12">Powered by influencr</p>
      </div>
    </div>
  )
}
