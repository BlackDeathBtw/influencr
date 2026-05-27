import { createClient as createAdminClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params

  const admin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  const { data, error } = await admin
    .from('contracts')
    .select('content, status, signer_name, signed_at, title')
    .eq('sign_token', token)
    .single()

  if (error || !data) {
    return NextResponse.json({ error: 'Contract not found' }, { status: 404 })
  }

  return NextResponse.json(data)
}
