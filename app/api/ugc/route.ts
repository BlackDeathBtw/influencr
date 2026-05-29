import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const {
    title,
    asset_type,
    storage_path,
    external_url,
    thumbnail_url,
    platform,
    tags,
    notes,
    rights_status,
    influencer_id,
    campaign_id,
  } = body

  if (!title?.trim()) return NextResponse.json({ error: 'Title is required' }, { status: 400 })
  if (!asset_type) return NextResponse.json({ error: 'Asset type is required' }, { status: 400 })

  const { data, error } = await supabase
    .from('ugc_assets')
    .insert({
      user_id: user.id,
      title: title.trim(),
      asset_type,
      storage_path: storage_path ?? null,
      external_url: external_url ?? null,
      thumbnail_url: thumbnail_url ?? null,
      platform: platform ?? null,
      tags: tags ?? [],
      notes: notes ?? null,
      rights_status: rights_status ?? 'pending',
      influencer_id: influencer_id ?? null,
      campaign_id: campaign_id ?? null,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json(data, { status: 201 })
}
