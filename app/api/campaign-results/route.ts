import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const campaignId = searchParams.get('campaign_id')

  if (!campaignId) return NextResponse.json({ error: 'campaign_id is required' }, { status: 400 })

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabase
    .from('campaign_results')
    .select('*, influencer:influencers(name)')
    .eq('campaign_id', campaignId)
    .eq('user_id', user.id)
    .order('logged_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { campaign_id, influencer_id, views, reach, clicks, conversions, revenue_generated, notes } = body

  if (!campaign_id) return NextResponse.json({ error: 'campaign_id is required' }, { status: 400 })

  const { data, error } = await supabase
    .from('campaign_results')
    .insert({
      user_id: user.id,
      campaign_id,
      influencer_id: influencer_id || null,
      views: views ?? null,
      reach: reach ?? null,
      clicks: clicks ?? null,
      conversions: conversions ?? null,
      revenue_generated: revenue_generated ?? null,
      notes: notes || null,
      logged_at: new Date().toISOString(),
    })
    .select('*, influencer:influencers(name)')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')

  if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 })

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { error } = await supabase
    .from('campaign_results')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return new Response(null, { status: 204 })
}
