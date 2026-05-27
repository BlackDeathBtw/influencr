import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { Calendar, CreditCard, CheckCircle, Clock, AlertCircle } from 'lucide-react'

const contentStatusIcon: Record<string, React.ReactNode> = {
  briefed: <Clock size={14} className="text-muted-foreground/70" />,
  in_review: <Clock size={14} className="text-amber-500" />,
  approved: <CheckCircle size={14} className="text-blue-400" />,
  posted: <CheckCircle size={14} className="text-green-500" />,
}

const paymentStatusColors: Record<string, string> = {
  pending: 'bg-amber-500/15 text-amber-400',
  paid: 'bg-green-500/15 text-green-400',
  overdue: 'bg-red-500/15 text-red-400',
}

export default async function PortalPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params

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
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 bg-brand/15 text-brand px-3 py-1 rounded-full text-xs font-medium mb-4">
            influencr portal
          </div>
          <h1 className="text-3xl font-bold text-foreground">{influencer.name}</h1>
          {influencer.handle && <p className="text-muted-foreground mt-1">{influencer.handle}</p>}
          {influencer.platform && (
            <p className="text-sm text-muted-foreground/70 mt-0.5 capitalize">{influencer.platform} · {influencer.niche ?? 'Creator'}</p>
          )}
        </div>

        {activeCampaigns.length > 0 && (
          <section className="mb-6">
            <h2 className="text-xs font-semibold text-muted-foreground/60 uppercase tracking-widest mb-3">Active Campaigns</h2>
            <div className="space-y-3">
              {activeCampaigns.map((ci: any) => (
                <div key={ci.id} className="bg-card border border-border rounded-xl p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold text-foreground">{ci.campaign?.name}</p>
                      {ci.campaign?.start_date && ci.campaign?.end_date && (
                        <p className="text-xs text-muted-foreground/70 mt-0.5">
                          {new Date(ci.campaign.start_date).toLocaleDateString()} – {new Date(ci.campaign.end_date).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      {ci.fee && (
                        <p className="font-semibold text-foreground">${Number(ci.fee).toLocaleString()}</p>
                      )}
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${
                        ci.status === 'confirmed' ? 'bg-green-500/15 text-green-400' :
                        ci.status === 'negotiating' ? 'bg-amber-500/15 text-amber-400' :
                        'bg-muted text-muted-foreground'
                      }`}>{ci.status}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {(content ?? []).length > 0 && (
          <section className="mb-6">
            <h2 className="text-xs font-semibold text-muted-foreground/60 uppercase tracking-widest mb-3">Content Assignments</h2>
            <div className="bg-card border border-border rounded-xl divide-y divide-border">
              {(content ?? []).map((c: any) => (
                <div key={c.id} className="flex items-center justify-between px-4 py-3">
                  <div className="flex items-center gap-3">
                    {contentStatusIcon[c.status] ?? <Clock size={14} className="text-muted-foreground/70" />}
                    <div>
                      <p className="text-sm font-medium text-foreground capitalize">{c.type}</p>
                      {c.due_date && (
                        <div className="flex items-center gap-1 mt-0.5">
                          <Calendar size={11} className="text-muted-foreground/70" />
                          <span className="text-xs text-muted-foreground/70">Due {new Date(c.due_date).toLocaleDateString()}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {c.url && (
                      <a href={c.url} target="_blank" rel="noopener noreferrer"
                        className="text-xs text-brand hover:underline">View post</a>
                    )}
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${
                      c.status === 'posted' ? 'bg-green-500/15 text-green-400' :
                      c.status === 'approved' ? 'bg-blue-500/15 text-blue-400' :
                      c.status === 'in_review' ? 'bg-amber-500/15 text-amber-400' :
                      'bg-muted text-muted-foreground'
                    }`}>{c.status.replace('_', ' ')}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {(payments ?? []).length > 0 && (
          <section className="mb-6">
            <h2 className="text-xs font-semibold text-muted-foreground/60 uppercase tracking-widest mb-3">Payments</h2>
            <div className="bg-card border border-border rounded-xl divide-y divide-border">
              {(payments ?? []).map((p: any) => (
                <div key={p.id} className="flex items-center justify-between px-4 py-3">
                  <div className="flex items-center gap-3">
                    <CreditCard size={14} className="text-muted-foreground/70" />
                    <div>
                      <p className="text-sm font-semibold text-foreground">
                        {p.currency} {Number(p.amount).toLocaleString()}
                      </p>
                      {p.due_date && p.status !== 'paid' && (
                        <p className="text-xs text-muted-foreground/70">Due {new Date(p.due_date).toLocaleDateString()}</p>
                      )}
                      {p.paid_at && (
                        <p className="text-xs text-muted-foreground/70">Paid {new Date(p.paid_at).toLocaleDateString()}</p>
                      )}
                    </div>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${paymentStatusColors[p.status] ?? 'bg-muted text-muted-foreground'}`}>
                    {p.status}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}

        {activeCampaigns.length === 0 && (content ?? []).length === 0 && (payments ?? []).length === 0 && (
          <div className="text-center py-12 text-muted-foreground text-sm">No active assignments yet.</div>
        )}

        <p className="text-center text-xs text-muted-foreground/40 mt-12">Powered by influencr</p>
      </div>
    </div>
  )
}
