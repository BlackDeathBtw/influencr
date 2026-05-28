import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabase
    .from('creator_goals')
    .select('monthly_revenue_goal')
    .eq('creator_id', user.id)
    .maybeSingle()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ monthly_revenue_goal: data?.monthly_revenue_goal ?? null })
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { monthly_revenue_goal } = body

  if (!monthly_revenue_goal || isNaN(Number(monthly_revenue_goal)) || Number(monthly_revenue_goal) <= 0) {
    return NextResponse.json({ error: 'monthly_revenue_goal must be a positive number' }, { status: 400 })
  }

  const { error } = await supabase
    .from('creator_goals')
    .upsert(
      { creator_id: user.id, monthly_revenue_goal: Number(monthly_revenue_goal) },
      { onConflict: 'creator_id' }
    )

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
