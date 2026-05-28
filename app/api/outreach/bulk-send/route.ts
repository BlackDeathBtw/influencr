import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { Resend } from 'resend'

function sub(text: string, name: string, handle: string, niche: string) {
  return text
    .replace(/\{\{name\}\}/g, name)
    .replace(/\{\{handle\}\}/g, handle)
    .replace(/\{\{niche\}\}/g, niche)
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { template_id, influencer_ids } = body

  if (!template_id) return NextResponse.json({ error: 'template_id required' }, { status: 400 })
  if (!Array.isArray(influencer_ids) || influencer_ids.length === 0) {
    return NextResponse.json({ error: 'Select at least one influencer' }, { status: 400 })
  }
  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json({ error: 'Email sending not configured' }, { status: 503 })
  }

  const { data: template } = await supabase
    .from('outreach_templates')
    .select('*')
    .eq('id', template_id)
    .eq('user_id', user.id)
    .single()
  if (!template) return NextResponse.json({ error: 'Template not found' }, { status: 404 })

  const { data: influencers } = await supabase
    .from('influencers')
    .select('id, name, handle, niche, contact_email')
    .in('id', influencer_ids)
    .eq('user_id', user.id)

  const resend = new Resend(process.env.RESEND_API_KEY)
  const results = { sent: 0, skipped: 0, failed: 0 }
  const errors: string[] = []

  for (const inf of influencers ?? []) {
    if (!inf.contact_email) { results.skipped++; continue }

    const subject = sub(template.subject ?? '', inf.name, inf.handle ?? '', inf.niche ?? '')
    const emailBody = sub(template.body, inf.name, inf.handle ?? '', inf.niche ?? '')

    const { data: sent, error } = await resend.emails.send({
      from: 'influencr outreach <onboarding@resend.dev>',
      to: [inf.contact_email],
      subject,
      text: emailBody,
    })

    if (error) {
      results.failed++
      errors.push(`${inf.name}: ${error.message}`)
      continue
    }

    await supabase.from('outreach_logs').insert({
      user_id: user.id,
      template_id,
      influencer_id: inf.id,
      to_email: inf.contact_email,
      subject,
      body: emailBody,
      status: 'sent',
      resend_id: sent?.id ?? null,
    })
    results.sent++
  }

  return NextResponse.json({ ...results, errors })
}
