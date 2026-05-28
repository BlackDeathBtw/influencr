import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

async function verifyOwnership(supabase: Awaited<ReturnType<typeof createClient>>, linkId: string, userId: string) {
  const { data } = await supabase
    .from('creator_links')
    .select('id, profile_id, creator_profiles!inner(user_id)')
    .eq('id', linkId)
    .single()

  if (!data) return null

  const profile = data.creator_profiles as { user_id: string } | { user_id: string }[]
  const ownerId = Array.isArray(profile) ? profile[0]?.user_id : profile?.user_id
  if (ownerId !== userId) return null

  return data
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const link = await verifyOwnership(supabase, id, user.id)
  if (!link) return NextResponse.json({ error: 'Not found or forbidden' }, { status: 404 })

  const { error } = await supabase.from('creator_links').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const link = await verifyOwnership(supabase, id, user.id)
  if (!link) return NextResponse.json({ error: 'Not found or forbidden' }, { status: 404 })

  const body = await request.json()
  const updates: Record<string, unknown> = {}
  if ('title' in body) updates.title = body.title
  if ('url' in body) updates.url = body.url
  if ('sort_order' in body) updates.sort_order = body.sort_order

  const { data, error } = await supabase
    .from('creator_links')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
