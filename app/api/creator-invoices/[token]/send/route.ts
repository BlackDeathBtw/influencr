import { createClient as createAdminClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

interface InvoiceRow {
  id: string
  brand_name: string
  brand_email: string
  description: string
  amount: number
  pay_token: string
  status: string
}

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params

  const admin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  const { data: invoice, error } = await admin
    .from('creator_invoices')
    .select('*')
    .eq('pay_token', token)
    .single()

  if (error || !invoice) {
    return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
  }

  const row = invoice as InvoiceRow

  const { error: updateError } = await admin
    .from('creator_invoices')
    .update({ status: 'sent', sent_at: new Date().toISOString() })
    .eq('pay_token', token)

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 })
  }

  const resendKey = process.env.RESEND_API_KEY
  if (resendKey && resendKey !== 're_placeholder') {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://influencr.app'
    const payLink = `${baseUrl}/pay/${token}`
    const amountFormatted = `$${(row.amount / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}`

    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${resendKey}`,
      },
      body: JSON.stringify({
        from: 'invoices@influencr.app',
        to: row.brand_email,
        subject: `Invoice from influencr — ${amountFormatted}`,
        html: `
          <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:32px 24px">
            <h2 style="font-size:20px;font-weight:700;margin-bottom:8px">You have a new invoice</h2>
            <p style="color:#555;margin-bottom:24px">
              ${row.description}
            </p>
            <p style="font-size:28px;font-weight:700;margin-bottom:24px">${amountFormatted}</p>
            <a href="${payLink}" style="display:inline-block;background:#18181b;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600">
              View invoice
            </a>
            <p style="margin-top:32px;color:#888;font-size:12px">
              Sent via <a href="${baseUrl}" style="color:#888">influencr</a>
            </p>
          </div>
        `,
      }),
    })
  }

  return NextResponse.json({ ok: true })
}
