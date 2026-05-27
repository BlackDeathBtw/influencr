import type { MarketplaceListingType } from '@/types'

export interface ScrapedDeal {
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
}
