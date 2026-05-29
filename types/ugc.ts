export type UGCAssetType = 'image' | 'video' | 'link' | 'document'
export type RightsStatus = 'pending' | 'approved' | 'rejected' | 'licensed'

export interface UGCAsset {
  id: string
  user_id: string
  influencer_id: string | null
  campaign_id: string | null
  title: string
  asset_type: UGCAssetType
  storage_path: string | null
  external_url: string | null
  thumbnail_url: string | null
  platform: string | null
  tags: string[]
  notes: string | null
  rights_status: RightsStatus
  created_at: string
  influencer?: { id: string; name: string } | null
  campaign?: { id: string; name: string } | null
}

export interface UGCFilter {
  campaign_id?: string
  influencer_id?: string
  asset_type?: string
  rights_status?: string
  tag?: string
}
