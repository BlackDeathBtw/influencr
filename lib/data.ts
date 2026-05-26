import { unstable_cache, revalidateTag } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export function invalidateTag(tagValue: string) {
  revalidateTag(tagValue, 'max')
}

// Cache tags per-user so we can revalidate selectively
export const tag = {
  influencers: (userId: string) => `influencers-${userId}`,
  campaigns: (userId: string) => `campaigns-${userId}`,
  payments: (userId: string) => `payments-${userId}`,
  dashboard: (userId: string) => `dashboard-${userId}`,
  content: (userId: string) => `content-${userId}`,
}

export async function getInfluencers(userId: string) {
  return unstable_cache(
    async () => {
      const supabase = await createClient()
      const { data } = await supabase
        .from('influencers')
        .select('id, name, handle, platform, niche, followers, contact_email, status, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
      return data ?? []
    },
    [`influencers-${userId}`],
    { tags: [tag.influencers(userId)], revalidate: 30 }
  )()
}

export async function getCampaigns(userId: string) {
  return unstable_cache(
    async () => {
      const supabase = await createClient()
      const { data } = await supabase
        .from('campaigns')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
      return data ?? []
    },
    [`campaigns-${userId}`],
    { tags: [tag.campaigns(userId)], revalidate: 30 }
  )()
}

export async function getDashboardStats(userId: string) {
  return unstable_cache(
    async () => {
      const supabase = await createClient()
      const [influencersRes, campaignsRes, contentRes, paymentsRes] = await Promise.all([
        supabase.from('influencers').select('id, status').eq('user_id', userId),
        supabase.from('campaigns').select('id, status').eq('user_id', userId),
        supabase
          .from('content')
          .select('id, due_date, type, influencer_id, influencers(name)')
          .eq('user_id', userId)
          .eq('status', 'briefed')
          .order('due_date', { ascending: true })
          .limit(5),
        supabase
          .from('payments')
          .select('id, amount, currency, status, due_date, influencer_id, influencers(name)')
          .eq('user_id', userId)
          .in('status', ['pending', 'overdue'])
          .order('due_date', { ascending: true })
          .limit(5),
      ])
      return {
        influencers: influencersRes.data ?? [],
        campaigns: campaignsRes.data ?? [],
        upcomingContent: contentRes.data ?? [],
        pendingPayments: paymentsRes.data ?? [],
      }
    },
    [`dashboard-${userId}`],
    { tags: [tag.dashboard(userId), tag.influencers(userId), tag.campaigns(userId), tag.payments(userId), tag.content(userId)], revalidate: 60 }
  )()
}

export async function getPayments(userId: string) {
  return unstable_cache(
    async () => {
      const supabase = await createClient()
      const { data } = await supabase
        .from('payments')
        .select('*, influencer:influencers(name), campaign:campaigns(name)')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
      return data ?? []
    },
    [`payments-${userId}`],
    { tags: [tag.payments(userId)], revalidate: 30 }
  )()
}
