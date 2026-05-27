import { createClient as createAdminClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params
  const body = await request.json()
  const { signer_name } = body

  const admin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  if (!signer_name?.trim()) {
    return NextResponse.json({ error: 'signer_name is required' }, { status: 400 })
  }

  const { data: contract, error: fetchError } = await admin
    .from('contracts')
    .select('id, status')
    .eq('sign_token', token)
    .single()

  if (fetchError || !contract) {
    return NextResponse.json({ error: 'Contract not found' }, { status: 404 })
  }

  if (contract.status === 'signed') {
    return NextResponse.json({ error: 'Already signed' }, { status: 400 })
  }

  const signer_ip = request.headers.get('x-forwarded-for') ?? ''

  const { error: updateError } = await admin
    .from('contracts')
    .update({
      status: 'signed',
      signer_name: signer_name.trim(),
      signer_ip,
      signed_at: new Date().toISOString(),
    })
    .eq('id', contract.id)

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
