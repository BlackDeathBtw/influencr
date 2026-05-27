import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id: listingId } = await params
  const body = await request.json() as { message?: unknown }
  const message = typeof body.message === 'string' ? body.message.trim() : null

  const { data: existing } = await supabase
    .from('marketplace_applications')
    .select('id')
    .eq('listing_id', listingId)
    .eq('applicant_id', user.id)
    .maybeSingle()

  if (existing) {
    return NextResponse.json({ error: 'Already applied' }, { status: 409 })
  }

  const { error } = await supabase
    .from('marketplace_applications')
    .insert({ listing_id: listingId, applicant_id: user.id, message })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true }, { status: 201 })
}
