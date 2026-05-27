import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const influencer_id = searchParams.get('influencer_id')
  if (!influencer_id) return NextResponse.json({ error: 'influencer_id is required' }, { status: 400 })

  const { count } = await supabase
    .from('influencers')
    .select('id', { count: 'exact', head: true })
    .eq('id', influencer_id)
    .eq('user_id', user.id)

  if (!count) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const { data, error } = await supabase
    .from('crm_notes')
    .select('*')
    .eq('influencer_id', influencer_id)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json() as { influencer_id?: unknown; body?: unknown }
  const influencer_id = typeof body.influencer_id === 'string' ? body.influencer_id : undefined
  const noteBody = typeof body.body === 'string' ? body.body : undefined

  if (!influencer_id) return NextResponse.json({ error: 'influencer_id is required' }, { status: 400 })
  if (!noteBody?.trim()) return NextResponse.json({ error: 'body is required' }, { status: 400 })

  const { count } = await supabase
    .from('influencers')
    .select('id', { count: 'exact', head: true })
    .eq('id', influencer_id)
    .eq('user_id', user.id)

  if (!count) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const { data: note, error: noteError } = await supabase
    .from('crm_notes')
    .insert({ user_id: user.id, influencer_id, body: noteBody.trim() })
    .select()
    .single()

  if (noteError) return NextResponse.json({ error: noteError.message }, { status: 500 })

  await supabase.from('crm_activities').insert({
    user_id: user.id,
    influencer_id,
    type: 'note_added',
    payload: { body: note.body },
  })

  return NextResponse.json(note, { status: 201 })
}
