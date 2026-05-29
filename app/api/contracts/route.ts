import { createClient } from '@/lib/supabase/server'
import { invalidateTag, tag } from '@/lib/data'
import { NextResponse } from 'next/server'
import type { ContractMilestone } from '@/types/contracts'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabase
    .from('contracts')
    .select('*, influencer:influencers(name), campaign:campaigns(name)')
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
  const { title, content, influencer_id, campaign_id, payment_model, base_fee, currency, milestones } = body

  if (!title?.trim()) return NextResponse.json({ error: 'Title is required' }, { status: 400 })

  const { data, error } = await supabase
    .from('contracts')
    .insert({
      user_id: user.id,
      title,
      content: content ?? '',
      influencer_id: influencer_id || null,
      campaign_id: campaign_id || null,
      payment_model: payment_model ?? 'flat',
      base_fee: base_fee ?? 0,
      currency: currency ?? 'USD',
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  if (milestones && Array.isArray(milestones) && milestones.length > 0) {
    const rows = milestones.map((m: Partial<ContractMilestone>) => ({
      contract_id: data.id,
      title: m.title,
      metric: m.metric,
      target_value: m.target_value,
      bonus_amount: m.bonus_amount ?? 0,
      due_date: m.due_date ?? null,
    }))
    await supabase.from('contract_milestones').insert(rows)
  }

  invalidateTag(tag.contracts(user.id))
  return NextResponse.json(data, { status: 201 })
}
