import { NextResponse } from 'next/server'
import { Webhook } from 'svix'
import { createClient as createAdminClient } from '@supabase/supabase-js'

function makeAdmin() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  )
}

export async function POST(request: Request) {
  const secret = process.env.RESEND_WEBHOOK_SECRET
  if (!secret) {
    return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 })
  }

  const rawBody = await request.text()
  const svixId = request.headers.get('svix-id')
  const svixTimestamp = request.headers.get('svix-timestamp')
  const svixSignature = request.headers.get('svix-signature')

  if (!svixId || !svixTimestamp || !svixSignature) {
    return NextResponse.json({ error: 'Missing svix headers' }, { status: 400 })
  }

  let event: { type: string; data: { email_id: string } }
  try {
    const wh = new Webhook(secret)
    event = wh.verify(rawBody, {
      'svix-id': svixId,
      'svix-timestamp': svixTimestamp,
      'svix-signature': svixSignature,
    }) as typeof event
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const emailId = event.data?.email_id
  if (!emailId) return NextResponse.json({ ok: true })

  const admin = makeAdmin()

  if (event.type === 'email.opened') {
    await admin
      .from('outreach_logs')
      .update({ opened_at: new Date().toISOString(), status: 'opened' })
      .eq('resend_id', emailId)
      .is('opened_at', null)
  } else if (event.type === 'email.clicked') {
    await admin
      .from('outreach_logs')
      .update({ clicked_at: new Date().toISOString(), status: 'clicked' })
      .eq('resend_id', emailId)
      .is('clicked_at', null)
  } else if (event.type === 'email.bounced') {
    await admin
      .from('outreach_logs')
      .update({ status: 'bounced' })
      .eq('resend_id', emailId)
  }

  return NextResponse.json({ ok: true })
}
