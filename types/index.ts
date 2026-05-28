export type Platform = 'instagram' | 'tiktok' | 'youtube' | 'twitter' | 'linkedin' | 'other'
export type CrmStage = 'prospect' | 'outreach' | 'negotiating' | 'contracted' | 'delivered' | 'paid'
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
  crm_stage: CrmStage
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
  revenue_target: number | null
  revenue_attributed: number | null
  brief: Record<string, string> | null
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
  promo_code: string | null
  affiliate_link: string | null
  revenue_attributed: number | null
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

export interface OutreachTemplate {
  id: string
  user_id: string
  name: string
  subject: string | null
  body: string
  platform: string | null
  created_at: string
  updated_at: string
}

export interface Contract {
  id: string
  user_id: string
  influencer_id: string | null
  campaign_id: string | null
  title: string
  content: string
  sign_token: string | null
  status: 'draft' | 'sent' | 'signed' | 'declined'
  sent_at: string | null
  signed_at: string | null
  signer_name: string | null
  signer_ip: string | null
  signer_email: string | null
  signature_data_url: string | null
  created_at: string
  updated_at: string
  influencer?: Influencer
  campaign?: Campaign
}

export interface CreatorProfile {
  id: string
  user_id: string
  username: string
  display_name: string | null
  bio: string | null
  location: string | null
  niches: string[] | null
  rate_min: number | null
  rate_max: number | null
  is_public: boolean
  created_at: string
  updated_at: string
  platform_stats?: CreatorPlatformStat[]
}

export interface CreatorPlatformStat {
  id: string
  profile_id: string
  platform: string
  handle: string | null
  followers: number | null
  engagement_rate: number | null
}

export interface OutreachLog {
  id: string
  user_id: string
  template_id: string | null
  influencer_id: string | null
  to_email: string
  subject: string
  body: string
  status: string
  resend_id: string | null
  sent_at: string
  opened_at: string | null
  clicked_at: string | null
  influencer?: { name: string } | null
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

export interface CrmNote {
  id: string
  user_id: string
  influencer_id: string
  body: string
  created_at: string
}

export interface CrmActivity {
  id: string
  user_id: string
  influencer_id: string
  type: 'stage_change' | 'note_added' | 'outreach_sent' | 'contract_signed' | 'payment_made'
  payload: Record<string, unknown>
  created_at: string
}

export type MarketplaceListingType = 'brand_deal' | 'affiliate' | 'collab'

export interface MarketplaceListing {
  id: string
  posted_by: string | null
  type: MarketplaceListingType
  title: string
  description: string | null
  brand_name: string | null
  niches: string[] | null
  platforms: string[] | null
  budget_min: number | null
  budget_max: number | null
  commission_rate: number | null
  min_followers: number | null
  location: string | null
  deadline: string | null
  is_active: boolean
  is_featured: boolean
  created_at: string
}

export interface EmailSequenceStep {
  delay_days: number
  subject: string
  body: string
}

export interface EmailSequence {
  id: string
  user_id: string
  name: string
  description: string | null
  steps: EmailSequenceStep[]
  created_at: string
}

export interface SequenceEnrollment {
  id: string
  user_id: string
  sequence_id: string
  influencer_id: string
  current_step: number
  status: 'active' | 'completed' | 'paused'
  next_send_at: string | null
  last_sent_at: string | null
  created_at: string
  influencer?: { name: string; handle: string | null; contact_email: string | null }
}

export interface CampaignResult {
  id: string
  user_id: string
  campaign_id: string
  influencer_id: string | null
  views: number | null
  reach: number | null
  clicks: number | null
  conversions: number | null
  revenue_generated: number | null
  notes: string | null
  logged_at: string
  influencer?: { name: string } | null
}

export interface BrandDeal {
  id: string
  source: string
  brand_name: string
  logo_url: string | null
  title: string
  description: string | null
  type: MarketplaceListingType
  niches: string[]
  platforms: string[]
  commission_rate: number | null
  budget_min: number | null
  budget_max: number | null
  min_followers: number | null
  apply_url: string
  is_featured: boolean
  is_active: boolean
  scraped_at: string
}
