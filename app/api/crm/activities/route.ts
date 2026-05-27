import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const influencer_id = searchParams.get('influencer_id')
  if (!influencer_id) return NextResponse.json({ error: 'influencer_id is required' }, { status: 400 })

  const { data, error } = await supabase
    .from('crm_activities')
    .select('*')
    .eq('influencer_id', influencer_id)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
