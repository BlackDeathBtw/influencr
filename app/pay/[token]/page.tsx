import { createClient as createAdminClient } from '@supabase/supabase-js'
import { notFound } from 'next/navigation'

export default async function PayPage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
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

            {isPaid ? (
              <span className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1 rounded-full bg-green-100 text-green-700">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                Paid
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1 rounded-full bg-amber-100 text-amber-700">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                Payment pending
              </span>
            )}
          </div>
        </div>
      </div>

      <footer className="mt-12 text-center">
        <p className="text-xs text-muted-foreground/60">Powered by influencr</p>
      </footer>
    </div>
  )
}
