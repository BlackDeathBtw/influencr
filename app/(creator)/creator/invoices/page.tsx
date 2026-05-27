import { createClient } from '@/lib/supabase/server'
import { Plus, ExternalLink } from 'lucide-react'
import Link from 'next/link'

interface CreatorInvoice {
  id: string
  brand_name: string
  brand_email: string
  description: string
  amount: number
  status: string
  pay_token: string
  sent_at: string | null
  paid_at: string | null
  created_at: string
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    draft: 'bg-muted text-muted-foreground',
    sent: 'bg-blue-100 text-blue-700',
    viewed: 'bg-amber-100 text-amber-700',
    paid: 'bg-green-100 text-green-700',
  }
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${map[status] ?? 'bg-muted text-muted-foreground'}`}>
      {status}
    </span>
  )
}

export default async function InvoicesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: invoices } = await supabase
    .from('creator_invoices')
    .select('*')
    .eq('creator_id', user!.id)
    .order('created_at', { ascending: false })

  const allInvoices = (invoices ?? []) as CreatorInvoice[]

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Invoices</h1>
          <p className="text-sm text-muted-foreground mt-1">Send invoices to brands and track payments</p>
        </div>
        <Link
          href="/creator/invoices/new"
          className="inline-flex items-center gap-2 bg-foreground/90 text-background px-4 py-2 rounded-lg text-sm font-semibold hover:bg-foreground transition-colors"
        >
          <Plus size={14} />
          New invoice
        </Link>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        {allInvoices.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-sm text-muted-foreground mb-4">No invoices yet — create your first one</p>
            <Link
              href="/creator/invoices/new"
              className="inline-flex items-center gap-2 bg-foreground/90 text-background px-4 py-2 rounded-lg text-sm font-medium hover:bg-foreground transition-colors"
            >
              <Plus size={14} />
              Create invoice
            </Link>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Brand</th>
                <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Description</th>
                <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Amount</th>
                <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Status</th>
                <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Date</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody>
              {allInvoices.map(invoice => (
                <tr key={invoice.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                  <td className="px-5 py-3.5">
                    <p className="font-medium text-foreground">{invoice.brand_name}</p>
                    <p className="text-xs text-muted-foreground">{invoice.brand_email}</p>
                  </td>
                  <td className="px-5 py-3.5">
                    <p className="text-muted-foreground truncate max-w-52">{invoice.description}</p>
                  </td>
                  <td className="px-5 py-3.5 font-semibold text-foreground">
                    ${(invoice.amount / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-5 py-3.5">
                    <StatusBadge status={invoice.status} />
                  </td>
                  <td className="px-5 py-3.5 text-muted-foreground">
                    {new Date(invoice.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </td>
                  <td className="px-5 py-3.5">
                    <Link
                      href={`/pay/${invoice.pay_token}`}
                      target="_blank"
                      className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <ExternalLink size={12} />
                      View link
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
