import { createClient as createAdminClient } from '@supabase/supabase-js'
import { notFound } from 'next/navigation'
import PayButton from './pay-button'

export default async function PayPage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const { token } = await params
  const sp = await searchParams
  const justPaid = sp.paid === '1'

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
    notFound()
  }

  if (invoice.status === 'sent') {
    admin
      .from('creator_invoices')
      .update({ status: 'viewed', viewed_at: new Date().toISOString() })
      .eq('id', invoice.id)
      .then(() => {})
  }

  const isPaid = invoice.status === 'paid'
  const amount = (invoice.amount / 100).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
  const currency = (invoice.currency ?? 'USD').toUpperCase()

  const dueDateFormatted = invoice.due_date
    ? new Date(invoice.due_date).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      })
    : null

  return (
    <div className="min-h-screen bg-background py-12 px-4 flex flex-col">
      <div className="max-w-md mx-auto w-full flex-1">
        <div className="mb-8">
          <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">
            influencr · invoice
          </p>
        </div>

        {justPaid && (
          <div className="mb-4 rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700 font-medium">
            Payment received — thank you!
          </div>
        )}

        <div className="bg-card border border-border rounded-xl p-8 space-y-6">
          <div className="space-y-4">
            <div>
              <p className="text-xs text-muted-foreground mb-1">To</p>
              <p className="text-foreground font-medium">{invoice.brand_name}</p>
            </div>

            <div>
              <p className="text-xs text-muted-foreground mb-1">For</p>
              <p className="text-foreground text-sm">{invoice.description}</p>
            </div>

            {dueDateFormatted && (
              <div>
                <p className="text-xs text-muted-foreground mb-1">Due date</p>
                <p className="text-foreground text-sm">{dueDateFormatted}</p>
              </div>
            )}
          </div>

          <div className="border-t border-border pt-6 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Total</p>
              <p className="text-2xl font-bold text-foreground">
                {currency === 'USD' ? '$' : currency + ' '}
                {amount}
              </p>
            </div>

            <PayButton token={token} isPaid={isPaid} />
          </div>
        </div>
      </div>

      <footer className="mt-12 text-center">
        <p className="text-xs text-muted-foreground/60">Powered by influencr</p>
      </footer>
    </div>
  )
}
