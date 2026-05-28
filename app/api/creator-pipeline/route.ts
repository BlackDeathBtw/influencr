import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabase
    .from('creator_pipeline')
    .select('*')
    .eq('creator_id', user.id)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { brand_name, amount_estimate, notes, stage } = body

  if (!brand_name?.trim()) return NextResponse.json({ error: 'brand_name is required' }, { status: 400 })

  const { data, error } = await supabase
    .from('creator_pipeline')
    .insert({
      creator_id: user.id,
      brand_name: brand_name.trim(),
      amount_estimate: amount_estimate ?? null,
      notes: notes ?? null,
      stage: stage ?? 'prospecting',
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
