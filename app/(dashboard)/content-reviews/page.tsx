import { createClient } from '@/lib/supabase/server'
import ContentReviewsClient from './client'

export default async function ContentReviewsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [{ data: reviews }, { data: campaigns }, { data: influencers }] = await Promise.all([
    supabase
      .from('content_reviews')
      .select('*, influencer:influencers(name), campaign:campaigns(name)')
      .eq('user_id', user!.id)
      .order('created_at', { ascending: false }),
    supabase.from('campaigns').select('id, name').eq('user_id', user!.id).order('name'),
    supabase.from('influencers').select('id, name').eq('user_id', user!.id).order('name'),
  ])

  return (
    <ContentReviewsClient
      reviews={reviews ?? []}
      campaigns={campaigns ?? []}
      influencers={influencers ?? []}
    />
  )
}
