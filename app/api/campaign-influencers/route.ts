import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { campaign_id, influencer_id, fee, status, notes } = body

  if (!campaign_id || !influencer_id) {
    return NextResponse.json({ error: 'campaign_id and influencer_id are required' }, { status: 400 })
  }

  // Verify the campaign belongs to the user
  const { data: campaign } = await supabase
    .from('campaigns')
    .select('id')
    .eq('id', campaign_id)
    .eq('user_id', user.id)
    .single()

  if (!campaign) return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })

  const { data, error } = await supabase
    .from('campaign_influencers')
    .insert({ campaign_id, influencer_id, fee, status: status ?? 'outreach', notes })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
