import { createClient } from '@/lib/supabase/server'
import { invalidateTag, tag } from '@/lib/data'
import { NextResponse } from 'next/server'
import type { ContractMilestone } from '@/types/contracts'

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { milestones, ...contractFields } = body

  const { data, error } = await supabase
    .from('contracts')
    .update(contractFields)
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  if (Array.isArray(milestones)) {
    await supabase.from('contract_milestones').delete().eq('contract_id', id)
    if (milestones.length > 0) {
      const rows = milestones.map((m: Partial<ContractMilestone>) => ({
        contract_id: id,
        title: m.title,
        metric: m.metric,
        target_value: m.target_value,
        bonus_amount: m.bonus_amount ?? 0,
        due_date: m.due_date ?? null,
      }))
      await supabase.from('contract_milestones').insert(rows)
    }
  }

  invalidateTag(tag.contracts(user.id))
  return NextResponse.json(data)
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { error } = await supabase
    .from('contracts')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  invalidateTag(tag.contracts(user.id))
  return new Response(null, { status: 204 })
}
