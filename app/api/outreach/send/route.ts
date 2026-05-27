import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { Resend } from 'resend'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { template_id, influencer_id, to_email, subject, body: emailBody } = body

  if (!to_email?.trim()) return NextResponse.json({ error: 'Recipient email is required' }, { status: 400 })
  if (!subject?.trim()) return NextResponse.json({ error: 'Subject is required' }, { status: 400 })
  if (!emailBody?.trim()) return NextResponse.json({ error: 'Email body is required' }, { status: 400 })

  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json({ error: 'Email sending is not configured (missing RESEND_API_KEY)' }, { status: 503 })
  }

  // Best-effort email validation (non-blocking)
  let emailWarning: string | null = null
  if (process.env.ABSTRACT_API_KEY) {
    try {
      const valRes = await fetch(
        `https://emailvalidation.abstractapi.com/v1/?api_key=${process.env.ABSTRACT_API_KEY}&email=${encodeURIComponent(to_email)}`,
        { signal: AbortSignal.timeout(3000) }
      )
      if (valRes.ok) {
        const valData = await valRes.json()
        if (valData.deliverability === 'UNDELIVERABLE') {
          emailWarning = 'Email address appears undeliverable — check it before sending'
        } else if (!valData.is_valid_format?.value) {
          return NextResponse.json({ error: 'Invalid email format' }, { status: 400 })
        }
      }
    } catch {
      // validation timeout — continue anyway
    }
  }

  const resend = new Resend(process.env.RESEND_API_KEY)

  const { data: sent, error: sendError } = await resend.emails.send({
    from: 'influencr outreach <onboarding@resend.dev>',
    to: [to_email],
    subject,
    text: emailBody,
  })

  if (sendError) {
    return NextResponse.json({ error: sendError.message }, { status: 500 })
  }

  await supabase.from('outreach_logs').insert({
    user_id: user.id,
    template_id: template_id || null,
    influencer_id: influencer_id || null,
    to_email,
    subject,
    body: emailBody,
    status: 'sent',
    resend_id: sent?.id ?? null,
  })

  return NextResponse.json({ success: true, id: sent?.id, warning: emailWarning ?? undefined })
}
