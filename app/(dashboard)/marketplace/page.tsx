import { createClient } from '@/lib/supabase/server'
import MarketplaceClient from './client'
import type { BrandDeal } from '@/types'

export default async function MarketplacePage() {
  const supabase = await createClient()

  const { data: deals } = await supabase
    .from('brand_deals')
    .select('*')
    .eq('is_active', true)
    .order('is_featured', { ascending: false })
    .order('scraped_at', { ascending: false })

  return <MarketplaceClient deals={(deals ?? []) as BrandDeal[]} />
}
