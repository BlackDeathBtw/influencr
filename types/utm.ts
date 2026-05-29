export interface UTMLink {
  id: string
  user_id: string
  campaign_id: string | null
  influencer_id: string
  slug: string
  destination: string
  promo_code: string | null
  utm_campaign: string | null
  utm_content: string | null
  clicks: number
  created_at: string
  influencer?: { name: string; handle: string | null }
  campaign?: { name: string }
}
