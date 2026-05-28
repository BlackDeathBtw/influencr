import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: existing, error: fetchError } = await supabase
    .from('creator_pipeline')
    .select('id, creator_id')
    .eq('id', id)
    .single()

  if (fetchError || !existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (existing.creator_id !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await request.json()
  const updates: Record<string, unknown> = {}
  if ('stage' in body) updates.stage = body.stage
  if ('notes' in body) updates.notes = body.notes
  if ('amount_estimate' in body) updates.amount_estimate = body.amount_estimate

  const { data, error } = await supabase
    .from('creator_pipeline')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: existing, error: fetchError } = await supabase
    .from('creator_pipeline')
    .select('id, creator_id')
    .eq('id', id)
    .single()

  if (fetchError || !existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (existing.creator_id !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { error } = await supabase
    .from('creator_pipeline')
    .delete()
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
