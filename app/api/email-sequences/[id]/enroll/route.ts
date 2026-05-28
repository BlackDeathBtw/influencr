import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: sequence_id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data } = await supabase
    .from('sequence_enrollments')
    .select('*, influencer:influencers(name, handle, contact_email)')
    .eq('sequence_id', sequence_id)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  return NextResponse.json(data ?? [])
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: sequence_id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { influencer_ids } = await request.json()
  if (!Array.isArray(influencer_ids) || influencer_ids.length === 0) {
    return NextResponse.json({ error: 'influencer_ids required' }, { status: 400 })
  }

  const rows = influencer_ids.map((influencer_id: string) => ({
    user_id: user.id,
    sequence_id,
    influencer_id,
    current_step: 0,
    status: 'active',
    next_send_at: new Date().toISOString(),
  }))

  const { error } = await supabase
    .from('sequence_enrollments')
    .upsert(rows, { onConflict: 'sequence_id,influencer_id' })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ enrolled: influencer_ids.length })
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: sequence_id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const enrollment_id = searchParams.get('enrollment_id')
  if (!enrollment_id) return NextResponse.json({ error: 'enrollment_id required' }, { status: 400 })

  await supabase
    .from('sequence_enrollments')
    .delete()
    .eq('id', enrollment_id)
    .eq('sequence_id', sequence_id)
    .eq('user_id', user.id)

  return NextResponse.json({ success: true })
}
