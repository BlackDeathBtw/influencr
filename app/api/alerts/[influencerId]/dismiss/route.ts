import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ influencerId: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { influencerId } = await params
  const body = await request.json()
  const { alert_type } = body

  if (!alert_type) return NextResponse.json({ error: 'alert_type is required' }, { status: 400 })

  const { error } = await supabase
    .from('alert_dismissals')
    .insert({
      user_id: user.id,
      influencer_id: influencerId,
      alert_type,
    })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}
