import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { searchParams } = new URL(request.url)
  const type = searchParams.get('type')
  const niche = searchParams.get('niche')
  const platform = searchParams.get('platform')

  let query = supabase
    .from('marketplace_listings')
    .select('*')
    .eq('is_active', true)
    .order('is_featured', { ascending: false })
    .order('created_at', { ascending: false })

  if (type && type !== 'all') {
    query = query.eq('type', type)
  }
  if (niche) {
    query = query.contains('niches', [niche])
  }
  if (platform) {
    query = query.contains('platforms', [platform])
  }

  const { data: listings, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  let appliedIds: string[] = []
  if (user) {
    const { data: applications } = await supabase
      .from('marketplace_applications')
      .select('listing_id')
      .eq('applicant_id', user.id)

    appliedIds = (applications ?? []).map((a: { listing_id: string }) => a.listing_id)
  }

  return NextResponse.json({ listings: listings ?? [], appliedIds })
}
