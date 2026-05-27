import { createClient } from '@/lib/supabase/server'
import MarketplaceClient from './client'

export default async function MarketplacePage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  const [{ data: listings }, { data: applications }] = await Promise.all([
    supabase
      .from('marketplace_listings')
      .select('*')
      .eq('is_active', true)
      .order('is_featured', { ascending: false })
      .order('created_at', { ascending: false }),
    supabase
      .from('marketplace_applications')
      .select('listing_id')
      .eq('applicant_id', user!.id),
  ])

  const appliedIds = (applications ?? []).map((a: { listing_id: string }) => a.listing_id)

  return <MarketplaceClient listings={listings ?? []} initialAppliedIds={appliedIds} />
}
