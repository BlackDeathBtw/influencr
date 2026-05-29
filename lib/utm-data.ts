import { createClient } from '@/lib/supabase/server'
import type { UTMLink } from '@/types/utm'

export async function getUTMLinks(userId: string, campaignId?: string): Promise<UTMLink[]> {
  const supabase = await createClient()
  let query = supabase
    .from('utm_links')
    .select('*, influencer:influencers(name, handle), campaign:campaigns(name)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (campaignId) {
    query = query.eq('campaign_id', campaignId)
  }

  const { data } = await query
  return (data ?? []) as UTMLink[]
}
