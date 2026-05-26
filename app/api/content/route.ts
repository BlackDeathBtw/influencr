import { createClient } from '@/lib/supabase/server'
import { invalidateTag, tag } from '@/lib/data'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { campaign_id, influencer_id, type, due_date, status, url, notes } = body

  if (!campaign_id || !influencer_id) {
    return NextResponse.json({ error: 'campaign_id and influencer_id are required' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('content')
    .insert({
      user_id: user.id,
      campaign_id,
      influencer_id,
      type: type ?? 'post',
      due_date,
      status: status ?? 'briefed',
      url,
      notes,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  invalidateTag(tag.content(user.id))
  invalidateTag(tag.dashboard(user.id))

  return NextResponse.json(data, { status: 201 })
}
