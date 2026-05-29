import { createClient } from '@/lib/supabase/server'
import type { Influencer } from '@/types'

export async function getInfluencersForComparison(
  userId: string,
  ids: string[]
): Promise<Influencer[]> {
  if (ids.length === 0) return []

  const supabase = await createClient()
  const { data } = await supabase
    .from('influencers')
    .select('*')
    .eq('user_id', userId)
    .in('id', ids.slice(0, 5))

  if (!data) return []

  // Return in same order as ids array
  const map = new Map<string, Influencer>(data.map((inf: Influencer) => [inf.id, inf]))
  return ids.slice(0, 5).flatMap((id) => {
    const inf = map.get(id)
    return inf ? [inf] : []
  })
}
