import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const pipelineId = searchParams.get('pipeline_id')
  if (!pipelineId) return NextResponse.json({ error: 'pipeline_id required' }, { status: 400 })

  const { data, error } = await supabase
    .from('creator_deliverables')
    .select('*')
    .eq('creator_id', user.id)
    .eq('pipeline_id', pipelineId)
    .order('sort_order')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { pipeline_id, title, due_date } = body
  if (!pipeline_id || !title?.trim()) return NextResponse.json({ error: 'pipeline_id and title required' }, { status: 400 })

  const { data, error } = await supabase
    .from('creator_deliverables')
    .insert({ pipeline_id, creator_id: user.id, title: title.trim(), due_date: due_date || null })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
