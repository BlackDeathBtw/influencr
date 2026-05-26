import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, Plus } from 'lucide-react'
import CampaignForm from '@/components/campaign-form'
import CampaignInfluencers from '@/components/campaign-influencers'
import ContentList from '@/components/content-list'

export default async function CampaignDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [{ data: campaign }, { data: campaignInfluencers }, { data: content }, { data: allInfluencers }] = await Promise.all([
    supabase.from('campaigns').select('*').eq('id', id).eq('user_id', user!.id).single(),
    supabase.from('campaign_influencers').select('*, influencer:influencers(*)').eq('campaign_id', id),
    supabase.from('content').select('*, influencer:influencers(name)').eq('campaign_id', id).order('due_date', { ascending: true }),
    supabase.from('influencers').select('id, name').eq('user_id', user!.id).eq('status', 'active'),
  ])

  if (!campaign) notFound()

  return (
    <div className="p-8 space-y-6">
      <Link href="/campaigns" className="inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-700">
        <ChevronLeft size={14} /> Back to campaigns
      </Link>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left: Campaign details */}
        <div className="lg:col-span-1 bg-white border border-zinc-200 rounded-xl p-6">
          <h2 className="font-semibold text-zinc-900 mb-4">Campaign details</h2>
          <CampaignForm campaign={campaign} />
        </div>

        {/* Right: Influencers + Content */}
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
