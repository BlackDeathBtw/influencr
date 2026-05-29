import { createClient } from '@/lib/supabase/server'
import { getUTMLinks } from '@/lib/utm-data'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const links = await getUTMLinks(user.id)
  return NextResponse.json(links)
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { influencer_id, campaign_id, destination, promo_code, utm_campaign, utm_content } = body

  if (!influencer_id || !destination) {
    return NextResponse.json({ error: 'influencer_id and destination are required' }, { status: 400 })
  }

  const slug = crypto.randomUUID().replace(/-/g, '').slice(0, 8)

  const { data, error } = await supabase
    .from('utm_links')
    .insert({
      user_id: user.id,
      influencer_id,
      campaign_id: campaign_id || null,
      destination,
      slug,
      promo_code: promo_code || null,
      utm_campaign: utm_campaign || null,
      utm_content: utm_content || null,
    })
    .select('*, influencer:influencers(name, handle), campaign:campaigns(name)')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json(data, { status: 201 })
}
