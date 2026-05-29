import type { CampaignStatus, Platform } from './index'

export interface CreatorAnalyticsRow {
  influencer_id: string
  name: string
  platform: Platform | null
  followers: number | null
  impressions: number
  clicks: number
  conversions: number
  spend: number
  notes: string | null
}

export interface CampaignAnalytics {
  id: string
  name: string
  status: CampaignStatus
  budget: number | null
  start_date: string | null
  end_date: string | null
  total_impressions: number
  total_clicks: number
  total_conversions: number
  total_spend: number
  creator_count: number
  creators: CreatorAnalyticsRow[]
}

export interface AnalyticsSnapshot {
  id: string
  campaign_id: string
  snapshot_date: string
  total_impressions: number
  total_clicks: number
  total_conversions: number
  total_spend: number
  creator_count: number
}
