import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { Webhook } from 'svix'

export async function POST(request: Request) {
  const secret = process.env.RESEND_WEBHOOK_SECRET
  if (!secret) return NextResponse.json({ error: 'Webhook not configured' }, { status: 503 })

  const payload = await request.text()
  const headers = {
    'svix-id': request.headers.get('svix-id') ?? '',
    'svix-timestamp': request.headers.get('svix-timestamp') ?? '',
    'svix-signature': request.headers.get('svix-signature') ?? '',
  }

  let event: { type: string; data: { email_id?: string; [key: string]: unknown } }
  try {
    const wh = new Webhook(secret)
    event = wh.verify(payload, headers) as typeof event
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  if (event.type !== 'email.opened' && event.type !== 'email.clicked') {
    return NextResponse.json({ ok: true })
  }

  const resendId = event.data.email_id
  if (!resendId) return NextResponse.json({ ok: true })

  const supabase = await createClient()

  // Find the log entry for this email
  const { data: log } = await supabase
    .from('outreach_logs')
    .select('id, influencer_id, user_id')
    .eq('resend_id', resendId)
    .single()

  if (!log) return NextResponse.json({ ok: true })

  // Update the log status
  const newStatus = event.type === 'email.clicked' ? 'clicked' : 'opened'
  await supabase
    .from('outreach_logs')
    .update({ status: newStatus })
    .eq('id', log.id)

  // Mark influencer as responded
  if (log.influencer_id) {
    await supabase
      .from('influencers')
      .update({ outreach_status: 'responded' })
      .eq('id', log.influencer_id)
      .eq('user_id', log.user_id)
  }

  return NextResponse.json({ ok: true })
}
