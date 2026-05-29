import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Verify contract ownership
  const { data: contract } = await supabase
    .from('contracts')
    .select('id')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (!contract) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const body = await request.json()
  const { title, metric, target_value, bonus_amount, due_date } = body

  if (!title?.trim() || !metric || !target_value) {
    return NextResponse.json({ error: 'title, metric and target_value are required' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('contract_milestones')
    .insert({
      contract_id: id,
      title,
      metric,
      target_value,
      bonus_amount: bonus_amount ?? 0,
      due_date: due_date ?? null,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
