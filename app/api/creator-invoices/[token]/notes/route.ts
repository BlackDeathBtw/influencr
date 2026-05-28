import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { NextResponse } from 'next/server'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const admin = createServiceClient()

  const { data: invoice, error } = await admin
    .from('creator_invoices')
    .select('id, creator_id')
    .eq('pay_token', token)
    .single()

  if (error || !invoice) {
    return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
  }

  if (invoice.creator_id !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await request.json()
  const { brand_rating, brand_notes } = body as { brand_rating?: number | null; brand_notes?: string | null }

  const { error: updateError } = await admin
    .from('creator_invoices')
    .update({ brand_rating: brand_rating ?? null, brand_notes: brand_notes ?? null })
    .eq('pay_token', token)

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
