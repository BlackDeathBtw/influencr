import { createClient } from '@/lib/supabase/server'
import type { CampaignAnalytics, AnalyticsSnapshot, CreatorAnalyticsRow } from '@/types/analytics'

export async function getCampaignAnalytics(
  userId: string,
  campaignId: string
): Promise<CampaignAnalytics | null> {
  const supabase = await createClient()

  const { data: campaign, error: campaignError } = await supabase
    .from('campaigns')
    .select('id, name, status, budget, start_date, end_date')
    .eq('id', campaignId)
    .eq('user_id', userId)
    .single()

  if (campaignError || !campaign) return null

  const { data: rows } = await supabase
    .from('campaign_influencers')
    .select(
      'influencer_id, impressions, clicks, conversions, spend, notes, influencer:influencers(id, name, platform, followers)'
    )
    .eq('campaign_id', campaignId)

  const creators: CreatorAnalyticsRow[] = (rows ?? []).map((row: any) => ({
    influencer_id: row.influencer_id,
    name: row.influencer?.name ?? 'Unknown',
    platform: row.influencer?.platform ?? null,
    followers: row.influencer?.followers ?? null,
    impressions: row.impressions ?? 0,
    clicks: row.clicks ?? 0,
    conversions: row.conversions ?? 0,
    spend: Number(row.spend ?? 0),
    notes: row.notes ?? null,
  }))

  const total_impressions = creators.reduce((s, c) => s + c.impressions, 0)
  const total_clicks = creators.reduce((s, c) => s + c.clicks, 0)
  const total_conversions = creators.reduce((s, c) => s + c.conversions, 0)
  const total_spend = creators.reduce((s, c) => s + c.spend, 0)

  return {
    id: campaign.id,
    name: campaign.name,
    status: campaign.status,
    budget: campaign.budget ?? null,
    start_date: campaign.start_date ?? null,
    end_date: campaign.end_date ?? null,
    total_impressions,
    total_clicks,
    total_conversions,
    total_spend,
    creator_count: creators.length,
    creators,
  }
}

export async function getAnalyticsSnapshots(
  userId: string,
  campaignId: string
): Promise<AnalyticsSnapshot[]> {
  const supabase = await createClient()

  // Verify campaign ownership first
  const { data: campaign } = await supabase
    .from('campaigns')
    .select('id')
    .eq('id', campaignId)
    .eq('user_id', userId)
    .single()

  if (!campaign) return []

  const { data } = await supabase
    .from('analytics_snapshots')
    .select('id, campaign_id, snapshot_date, total_impressions, total_clicks, total_conversions, total_spend, creator_count')
    .eq('campaign_id', campaignId)
    .order('snapshot_date', { ascending: false })
    .limit(30)

  return (data ?? []).map((row: any) => ({
    id: row.id,
    campaign_id: row.campaign_id,
    snapshot_date: row.snapshot_date,
    total_impressions: row.total_impressions ?? 0,
    total_clicks: row.total_clicks ?? 0,
    total_conversions: row.total_conversions ?? 0,
    total_spend: Number(row.total_spend ?? 0),
    creator_count: row.creator_count ?? 0,
  }))
}
