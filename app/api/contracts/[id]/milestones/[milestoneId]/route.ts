import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; milestoneId: string }> }
) {
  const { id, milestoneId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Verify contract ownership via RLS-compatible check
  const { data: contract } = await supabase
    .from('contracts')
    .select('id')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (!contract) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const body = await request.json()
  const { achieved_value, status } = body

  const updatePayload: Record<string, unknown> = {}
  if (achieved_value !== undefined) updatePayload.achieved_value = achieved_value
  if (status !== undefined) updatePayload.status = status
  if (status === 'achieved' && !body.achieved_at) {
    updatePayload.achieved_at = new Date().toISOString()
  }

  const { data, error } = await supabase
    .from('contract_milestones')
    .update(updatePayload)
    .eq('id', milestoneId)
    .eq('contract_id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
