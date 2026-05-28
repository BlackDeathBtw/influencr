import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { randomUUID } from 'crypto'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabase
    .from('campaign_briefs')
    .select('*, campaign:campaigns(name)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const {
    title, campaign_id, objective, target_audience,
    key_messages, dos, donts, deliverables, deadline, compensation,
  } = body

  if (!title?.trim()) return NextResponse.json({ error: 'Title is required' }, { status: 400 })

  const share_token = randomUUID()

  const { data, error } = await supabase
    .from('campaign_briefs')
    .insert({
      user_id: user.id,
      share_token,
      title: title.trim(),
      campaign_id: campaign_id || null,
      objective: objective || null,
      target_audience: target_audience || null,
      key_messages: key_messages || null,
      dos: dos || null,
      donts: donts || null,
      deliverables: deliverables || null,
      deadline: deadline || null,
      compensation: compensation || null,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
