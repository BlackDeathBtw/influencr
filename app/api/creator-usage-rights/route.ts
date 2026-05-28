import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabase
    .from('creator_usage_rights')
    .select('*, creator_deals(title), creator_deliverables(title)')
    .eq('creator_id', user.id)
    .order('end_date', { ascending: true, nullsFirst: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  if (!body.brand?.trim()) return NextResponse.json({ error: 'brand required' }, { status: 400 })

  // compute status based on end_date
  let status = 'active'
  if (body.end_date) {
    const end = new Date(body.end_date)
    const now = new Date()
    const diffDays = Math.ceil((end.getTime() - now.getTime()) / 86400000)
    if (diffDays < 0) status = 'expired'
    else if (diffDays <= 30) status = 'expiring_soon'
  }

  const { data, error } = await supabase
    .from('creator_usage_rights')
    .insert({ ...body, creator_id: user.id, status })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
