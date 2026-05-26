export type Platform = 'instagram' | 'tiktok' | 'youtube' | 'twitter' | 'linkedin' | 'other'
export type InfluencerStatus = 'prospect' | 'active' | 'inactive'
export type OutreachStatus = 'not_contacted' | 'reached_out' | 'responded' | 'declined'
export type CampaignStatus = 'planning' | 'active' | 'completed' | 'paused'
export type DealStatus = 'outreach' | 'negotiating' | 'confirmed' | 'declined'
export type ContentType = 'post' | 'story' | 'reel' | 'video' | 'blog'
export type ContentStatus = 'briefed' | 'in_review' | 'approved' | 'posted'
export type PaymentStatus = 'pending' | 'paid' | 'overdue'
export type SubscriptionStatus = 'trialing' | 'active' | 'past_due' | 'canceled' | 'incomplete'

export interface Influencer {
  id: string
  user_id: string
  name: string
  handle: string | null
  platform: Platform | null
  niche: string | null
  followers: number | null
  engagement_rate: number | null
  contact_email: string | null
  contact_name: string | null
  notes: string | null
  status: InfluencerStatus
  tags: string[] | null
  avatar_url: string | null
  portal_token: string | null
  last_contacted_at: string | null
  outreach_status: OutreachStatus
  brief_url: string | null
  created_at: string
  updated_at: string
}

export interface Campaign {
  id: string
  user_id: string
  name: string
  description: string | null
  start_date: string | null
  end_date: string | null
  budget: number | null
  currency: string
  status: CampaignStatus
  created_at: string
  updated_at: string
}

export interface CampaignInfluencer {
  id: string
  campaign_id: string
  influencer_id: string
  fee: number | null
  status: DealStatus
  notes: string | null
  created_at: string
  influencer?: Influencer
  campaign?: Campaign
}

export interface Content {
  id: string
  campaign_id: string
  influencer_id: string
  user_id: string
  type: ContentType
  due_date: string | null
  posted_at: string | null
  url: string | null
  status: ContentStatus
  notes: string | null
  views: number | null
  reach: number | null
  likes: number | null
  comments: number | null
  created_at: string
  updated_at: string
  influencer?: Influencer
  campaign?: Campaign
}

export interface Payment {
  id: string
  user_id: string
  campaign_id: string | null
  influencer_id: string
  amount: number
  currency: string
  status: PaymentStatus
  due_date: string | null
  paid_at: string | null
  invoice_number: string | null
  notes: string | null
  created_at: string
  updated_at: string
  influencer?: Influencer
  campaign?: Campaign | null
}

export interface Subscription {
  id: string
  user_id: string
  stripe_customer_id: string | null
  stripe_subscription_id: string | null
  status: SubscriptionStatus
  price_id: string | null
  current_period_end: string | null
  created_at: string
  updated_at: string
}
