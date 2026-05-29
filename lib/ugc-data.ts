import { createClient } from '@/lib/supabase/server'
import type { UGCAsset, UGCFilter } from '@/types/ugc'

export async function getUGCAssets(userId: string, filter?: UGCFilter): Promise<UGCAsset[]> {
  const supabase = await createClient()

  let query = supabase
    .from('ugc_assets')
    .select('*, influencer:influencers(id, name), campaign:campaigns(id, name)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (filter?.campaign_id) query = query.eq('campaign_id', filter.campaign_id)
  if (filter?.influencer_id) query = query.eq('influencer_id', filter.influencer_id)
  if (filter?.asset_type) query = query.eq('asset_type', filter.asset_type)
  if (filter?.rights_status) query = query.eq('rights_status', filter.rights_status)
  if (filter?.tag) query = query.contains('tags', [filter.tag])

  const { data, error } = await query

  if (error) {
    console.error('getUGCAssets error:', error)
    return []
  }

  return (data ?? []) as UGCAsset[]
}

export async function getUGCAsset(userId: string, assetId: string): Promise<UGCAsset | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('ugc_assets')
    .select('*, influencer:influencers(id, name), campaign:campaigns(id, name)')
    .eq('id', assetId)
    .eq('user_id', userId)
    .single()

  if (error) return null

  return data as UGCAsset
}
