import { createServiceClient } from '@/lib/supabase/service'
import { NextResponse } from 'next/server'

interface OverdueInvoice {
  id: string
  brand_name: string
  brand_email: string
  description: string
  amount: number
  pay_token: string
  due_date: string
  sent_at: string | null
  creator_id: string
}

export async function GET(request: Request) {
  const auth = request.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!process.env.RESEND_API_KEY || process.env.RESEND_API_KEY === 're_placeholder') {
    return NextResponse.json({ sent: 0, note: 'Resend not configured' })
  }

  const admin = createServiceClient()
  const today = new Date().toISOString().slice(0, 10)

  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
  const sevenDaysAgoIso = sevenDaysAgo.toISOString()

  const { data: overdueInvoices } = await admin
    .from('creator_invoices')
    .select('*')
    .in('status', ['sent', 'viewed'])
    .not('due_date', 'is', null)
    .lt('due_date', today)
    .or(`sent_at.is.null,sent_at.lt.${sevenDaysAgoIso}`)

  if (!overdueInvoices || overdueInvoices.length === 0) {
    return NextResponse.json({ sent: 0 })
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://influencr.app'
  let sent = 0

  for (const row of overdueInvoices as OverdueInvoice[]) {
    const payLink = `${baseUrl}/pay/${row.pay_token}`
    const amountFormatted = `$${(row.amount / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}`

    const dueDate = new Date(row.due_date)
    const daysOverdue = Math.floor((Date.now() - dueDate.getTime()) / (1000 * 60 * 60 * 24))

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'invoices@influencr.app',
        to: row.brand_email,
        subject: `Friendly reminder: Invoice overdue — ${amountFormatted}`,
        html: `
          <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:32px 24px">
            <h2 style="font-size:20px;font-weight:700;margin-bottom:8px">Invoice payment reminder</h2>
            <p style="color:#555;margin-bottom:16px">
              Your invoice of <strong>${amountFormatted}</strong> from ${row.brand_name} is now
              <strong>${daysOverdue} day${daysOverdue !== 1 ? 's' : ''} overdue</strong>.
            </p>
            <p style="color:#555;margin-bottom:24px">${row.description}</p>
            <a href="${payLink}" style="display:inline-block;background:#18181b;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600">
              Pay now
            </a>
            <p style="margin-top:32px;color:#888;font-size:12px">
              Sent via <a href="${baseUrl}" style="color:#888">influencr</a>
            </p>
          </div>
        `,
      }),
    })

    if (res.ok) {
      await admin
        .from('creator_invoices')
        .update({ sent_at: new Date().toISOString() })
        .eq('id', row.id)
      sent++
    }
  }

  return NextResponse.json({ sent })
}
