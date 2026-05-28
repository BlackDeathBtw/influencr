import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import ReviewSubmitClient from './submit-client'

export default async function ReviewPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const supabase = await createClient()

  const { data: review } = await supabase
    .from('content_reviews')
    .select('*')
    .eq('review_token', token)
    .single()

  if (!review) notFound()

  return <ReviewSubmitClient review={review} />
}
