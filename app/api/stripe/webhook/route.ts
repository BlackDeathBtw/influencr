import Stripe from 'stripe'
import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)
  const body = await request.text()
  const sig = request.headers.get('stripe-signature')!

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch {
    return NextResponse.json({ error: 'Webhook signature verification failed' }, { status: 400 })
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { getAll: () => [], setAll: () => {} } }
  )

  switch (event.type) {
    case 'customer.subscription.created':
    case 'customer.subscription.updated': {
      const sub = event.data.object as Stripe.Subscription
      const userId = sub.metadata.supabase_user_id
      if (!userId) break

      const item = sub.items.data[0]
      const periodEnd = item?.current_period_end
        ? new Date(item.current_period_end * 1000).toISOString()
        : null

      await supabase.from('subscriptions').upsert({
        user_id: userId,
        stripe_customer_id: sub.customer as string,
        stripe_subscription_id: sub.id,
        status: sub.status,
        price_id: item?.price.id ?? null,
        current_period_end: periodEnd,
      }, { onConflict: 'user_id' })
      break
    }

    case 'customer.subscription.deleted': {
      const sub = event.data.object as Stripe.Subscription
      const userId = sub.metadata.supabase_user_id
      if (!userId) break

      await supabase
        .from('subscriptions')
        .update({ status: 'canceled' })
        .eq('user_id', userId)
      break
    }

    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session
      if (session.metadata?.invoice_type !== 'creator_invoice') break
      const payToken = session.metadata?.pay_token
      if (!payToken) break

      await supabase
        .from('creator_invoices')
        .update({ status: 'paid', paid_at: new Date().toISOString() })
        .eq('pay_token', payToken)
        .neq('status', 'paid')
      break
    }
  }

  return NextResponse.json({ received: true })
}
