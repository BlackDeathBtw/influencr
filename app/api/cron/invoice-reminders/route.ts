import { createClient as createAdminClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const auth = request.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!process.env.RESEND_API_KEY || process.env.RESEND_API_KEY === 're_placeholder') {
    return NextResponse.json({ reminders_sent: 0, note: 'Resend not configured' })
  }

  const admin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  const now = new Date()

  const sevenDaysAgo = new Date(now)
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

  const fourteenDaysAgo = new Date(now)
  fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14)

  // Fetch all sent invoices that need reminder 1 or reminder 2
  const { data: invoices } = await admin
    .from('creator_invoices')
    .select('id, user_id, brand_name, amount, sent_at, reminder_1_sent_at, reminder_2_sent_at')
    .eq('status', 'sent')
    .not('sent_at', 'is', null)

  if (!invoices || invoices.length === 0) {
    return NextResponse.json({ reminders_sent: 0 })
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://influencr-five.vercel.app'
  let reminders_sent = 0

  for (const invoice of invoices) {
    const sentAt = new Date(invoice.sent_at)
    const needsReminder1 = !invoice.reminder_1_sent_at && sentAt < sevenDaysAgo
    const needsReminder2 = !invoice.reminder_2_sent_at && sentAt < fourteenDaysAgo

    // reminder 2 supersedes reminder 1 if both are due at the same time
    if (!needsReminder1 && !needsReminder2) continue

    const { data: { user } } = await admin.auth.admin.getUserById(invoice.user_id)
    if (!user?.email) continue

    const amountFormatted = `$${(invoice.amount / 100).toLocaleString('en-US', {
      minimumFractionDigits: 2,
    })}`

    const reminderNumber = needsReminder2 ? 2 : 1
    const subject =
      reminderNumber === 1
        ? `Reminder: Your invoice to ${invoice.brand_name} for ${amountFormatted} is overdue`
        : `Final reminder: Invoice to ${invoice.brand_name} for ${amountFormatted} is overdue`

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'influencr <reminders@influencr.app>',
        to: user.email,
        subject,
        html: `
          <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:32px 24px">
            <h2 style="font-size:20px;font-weight:700;margin-bottom:8px">
              Invoice reminder #${reminderNumber}
            </h2>
            <p style="color:#555;margin-bottom:16px">
              Your invoice to <strong>${invoice.brand_name}</strong> for
              <strong>${amountFormatted}</strong> is overdue.
            </p>
            <p style="color:#555;margin-bottom:24px">
              This is reminder #${reminderNumber}.
              ${reminderNumber === 2 ? 'Please follow up promptly to collect payment.' : 'Consider following up with the brand directly.'}
            </p>
            <a href="${baseUrl}/payments" style="display:inline-block;background:#18181b;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600">
              View invoices
            </a>
            <p style="margin-top:32px;color:#888;font-size:12px">
              Sent via <a href="${baseUrl}" style="color:#888">influencr</a>
            </p>
          </div>
        `,
      }),
    })

    if (res.ok) {
      const updateField = needsReminder2 ? 'reminder_2_sent_at' : 'reminder_1_sent_at'
      await admin
        .from('creator_invoices')
        .update({ [updateField]: now.toISOString() })
        .eq('id', invoice.id)
      reminders_sent++
    }
  }

  return NextResponse.json({ reminders_sent })
}
