import { createClient as createAdminClient } from '@supabase/supabase-js'
import Stripe from 'stripe'
import { NextResponse } from 'next/server'

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

  if (invoice.status === 'paid') {
    return NextResponse.json({ error: 'Invoice already paid' }, { status: 400 })
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    mode: 'payment',
    customer_email: invoice.brand_email,
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: (invoice.currency ?? 'usd').toLowerCase(),
          unit_amount: invoice.amount,
          product_data: { name: invoice.description },
        },
      },
    ],
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/pay/${token}?paid=1`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/pay/${token}`,
    metadata: { pay_token: token, invoice_type: 'creator_invoice' },
  })

  return NextResponse.json({ url: session.url })
}
