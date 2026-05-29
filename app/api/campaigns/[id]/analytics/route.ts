import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

interface CreatorUpdate {
  influencer_id: string
  impressions: number
  clicks: number
  conversions: number
  spend: number
  notes: string | null
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: campaignId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Verify the campaign belongs to the user
  const { data: campaign } = await supabase
    .from('campaigns')
    .select('id')
    .eq('id', campaignId)
    .eq('user_id', user.id)
    .single()

  if (!campaign) {
    return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
  }

  const body = await request.json()
  const creatorUpdates: CreatorUpdate[] = body.creator_updates ?? []

  if (!Array.isArray(creatorUpdates) || creatorUpdates.length === 0) {
    return NextResponse.json({ error: 'No creator_updates provided' }, { status: 400 })
  }

  for (const update of creatorUpdates) {
    const { error } = await supabase
      .from('campaign_influencers')
      .update({
        impressions: update.impressions ?? 0,
        clicks: update.clicks ?? 0,
        conversions: update.conversions ?? 0,
        spend: update.spend ?? 0,
        notes: update.notes ?? null,
      })
      .eq('campaign_id', campaignId)
      .eq('influencer_id', update.influencer_id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
  }

  return NextResponse.json({ success: true })
}
