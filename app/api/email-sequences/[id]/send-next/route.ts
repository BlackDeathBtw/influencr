import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { Resend } from 'resend'

function substituteVars(text: string, name: string, handle: string, niche: string) {
  return text
    .replace(/\{\{name\}\}/g, name)
    .replace(/\{\{handle\}\}/g, handle)
    .replace(/\{\{niche\}\}/g, niche)
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: sequence_id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { enrollment_id } = await request.json()
  if (!enrollment_id) return NextResponse.json({ error: 'enrollment_id required' }, { status: 400 })

  const { data: enrollment } = await supabase
    .from('sequence_enrollments')
    .select('*, sequence:email_sequences(*), influencer:influencers(id, name, handle, niche, contact_email)')
    .eq('id', enrollment_id)
    .eq('sequence_id', sequence_id)
    .eq('user_id', user.id)
    .single()

  if (!enrollment) return NextResponse.json({ error: 'Enrollment not found' }, { status: 404 })

  const steps = (enrollment.sequence as { steps: Array<{ delay_days: number; subject: string; body: string }> }).steps
  const stepIndex: number = enrollment.current_step

  if (stepIndex >= steps.length) {
    await supabase.from('sequence_enrollments').update({ status: 'completed' }).eq('id', enrollment_id)
    return NextResponse.json({ status: 'completed' })
  }

  const step = steps[stepIndex]
  const inf = enrollment.influencer as { id: string; name: string; handle: string | null; niche: string | null; contact_email: string | null }

  if (!inf?.contact_email) return NextResponse.json({ error: 'Influencer has no email address' }, { status: 400 })
  if (!process.env.RESEND_API_KEY) return NextResponse.json({ error: 'Email sending not configured' }, { status: 503 })

  const subject = substituteVars(step.subject, inf.name, inf.handle ?? '', inf.niche ?? '')
  const body = substituteVars(step.body, inf.name, inf.handle ?? '', inf.niche ?? '')

  const resend = new Resend(process.env.RESEND_API_KEY)
  const { data: sent, error: sendError } = await resend.emails.send({
    from: 'influencr outreach <onboarding@resend.dev>',
    to: [inf.contact_email],
    subject,
    text: body,
  })

  if (sendError) return NextResponse.json({ error: sendError.message }, { status: 500 })

  await supabase.from('outreach_logs').insert({
    user_id: user.id,
    influencer_id: inf.id,
    to_email: inf.contact_email,
    subject,
    body,
    status: 'sent',
    resend_id: sent?.id ?? null,
  })

  const nextStep = stepIndex + 1
  const isLast = nextStep >= steps.length
  const nextSendAt = isLast ? null : new Date(Date.now() + steps[nextStep].delay_days * 86_400_000).toISOString()

  await supabase.from('sequence_enrollments').update({
    current_step: nextStep,
    status: isLast ? 'completed' : 'active',
    last_sent_at: new Date().toISOString(),
    next_send_at: nextSendAt,
  }).eq('id', enrollment_id)

  return NextResponse.json({ success: true, step: stepIndex, next_step: nextStep, is_last: isLast })
}
