import { createClient } from '@/lib/supabase/server'
import { invalidateTag, tag } from '@/lib/data'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabase
    .from('outreach_templates')
    .select('*')
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
  const { name, subject, body: templateBody, platform } = body

  if (!name?.trim()) return NextResponse.json({ error: 'Name is required' }, { status: 400 })
  if (!templateBody?.trim()) return NextResponse.json({ error: 'Body is required' }, { status: 400 })

  const { data, error } = await supabase
    .from('outreach_templates')
    .insert({ user_id: user.id, name, subject: subject || null, body: templateBody, platform: platform || null })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  invalidateTag(tag.outreach(user.id))
  return NextResponse.json(data, { status: 201 })
}
