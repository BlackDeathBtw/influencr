import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import CampaignForm from '@/components/campaign-form'
import CampaignInfluencers from '@/components/campaign-influencers'
import CampaignBrief from '@/components/campaign-brief'
import ContentList from '@/components/content-list'
import CampaignROI from '@/components/campaign-roi'
import CampaignExport from '@/components/campaign-export'
import CampaignBudget from '@/components/campaign-budget'

export default async function CampaignDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [{ data: campaign }, { data: campaignInfluencers }, { data: content }, { data: allInfluencers }, { data: payments }, { data: campaignResults }] = await Promise.all([
    supabase.from('campaigns').select('*').eq('id', id).eq('user_id', user!.id).single(),
    supabase.from('campaign_influencers').select('*, influencer:influencers(*)').eq('campaign_id', id),
    supabase.from('content').select('*, influencer:influencers(name)').eq('campaign_id', id).order('due_date', { ascending: true }),
    supabase.from('influencers').select('id, name').eq('user_id', user!.id).eq('status', 'active'),
    supabase.from('payments').select('*, influencer:influencers(name)').eq('campaign_id', id).eq('user_id', user!.id),
    supabase.from('campaign_results').select('*, influencer:influencers(name)').eq('campaign_id', id).eq('user_id', user!.id).order('logged_at', { ascending: false }),
  ])

  if (!campaign) notFound()

  const confirmedInfluencers = (campaignInfluencers ?? []).filter((ci: any) => ci.status === 'confirmed')
  const estimatedReach = confirmedInfluencers.reduce((s: number, ci: any) => s + (ci.influencer?.followers ?? 0), 0)
  const totalSpend = (payments ?? []).filter((p: any) => p.status === 'paid').reduce((s: number, p: any) => s + Number(p.amount), 0)
  const totalCommitted = (campaignInfluencers ?? []).reduce((s: number, ci: any) => s + Number(ci.fee ?? 0), 0)
  const totalPaid = (payments ?? []).filter((p: any) => p.status === 'paid').reduce((s: number, p: any) => s + Number(p.amount), 0)

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <Link href="/campaigns" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ChevronLeft size={14} /> Back to campaigns
        </Link>
        <CampaignExport
          campaign={campaign}
          influencers={campaignInfluencers ?? []}
          content={content ?? []}
          payments={payments ?? []}
        />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-card border border-border rounded-xl p-6">
            <h2 className="font-semibold text-foreground mb-4">Campaign details</h2>
            <CampaignForm campaign={campaign} />
          </div>
          <CampaignBrief campaignId={id} brief={campaign.brief ?? {}} />
          <CampaignBudget
            campaignId={id}
            budget={campaign.budget ?? null}
            currency={campaign.currency}
            committed={totalCommitted}
            paid={totalPaid}
          />
          <CampaignROI
            campaignId={id}
            totalSpend={totalSpend}
            estimatedReach={estimatedReach}
            revenueTarget={campaign.revenue_target ?? null}
            revenueAttributed={campaign.revenue_attributed ?? null}
            currency={campaign.currency}
            campaignInfluencers={(campaignInfluencers ?? []).map((ci: any) => ({ id: ci.influencer_id, name: ci.influencer?.name ?? '' }))}
            results={campaignResults ?? []}
          />
        </div>

        <div className="lg:col-span-2 space-y-6">
          <CampaignInfluencers
            campaignId={id}
            campaignInfluencers={campaignInfluencers ?? []}
            allInfluencers={allInfluencers ?? []}
          />
          <ContentList
            campaignId={id}
            userId={user!.id}
            content={content ?? []}
            influencers={allInfluencers ?? []}
          />
        </div>
      </div>
    </div>
  )
}
