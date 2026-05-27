import { createClient } from '@/lib/supabase/server'
import DiscoverClient from './client'

export default async function DiscoverPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [{ data: creators }, { data: influencers }] = await Promise.all([
    supabase
      .from('creator_profiles')
      .select('*, platform_stats:creator_platform_stats(*)')
      .eq('is_public', true)
      .order('created_at', { ascending: false }),
    supabase
      .from('influencers')
      .select('id')
      .eq('user_id', user!.id),
  ])

  const existingUserIds = new Set((influencers ?? []).map((i: { id: string }) => i.id))

  return <DiscoverClient creators={creators ?? []} existingUserIds={[...existingUserIds] as string[]} />
}
