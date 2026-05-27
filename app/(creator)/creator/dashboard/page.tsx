import { createClient } from '@/lib/supabase/server'
import { Receipt, Plus } from 'lucide-react'
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

export default async function CreatorDashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: invoices } = await supabase
    .from('creator_invoices')
    .select('*')
    .eq('creator_id', user!.id)
    .order('created_at', { ascending: false })

  const allInvoices = (invoices ?? []) as CreatorInvoice[]
  const unpaid = allInvoices.filter(i => i.status !== 'paid')
  const unpaidTotal = unpaid.reduce((sum, i) => sum + i.amount, 0)
  const recent = allInvoices.slice(0, 5)

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="font-display text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">Your creator overview</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-muted-foreground">Pending invoices</span>
            <div className="w-8 h-8 bg-muted rounded-lg flex items-center justify-center">
              <Receipt size={15} className="text-muted-foreground" />
            </div>
          </div>
          <p className="text-2xl font-bold text-foreground">{unpaid.length}</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            ${(unpaidTotal / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })} outstanding
          </p>
        </div>

        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-muted-foreground">Total invoices</span>
            <div className="w-8 h-8 bg-muted rounded-lg flex items-center justify-center">
              <Receipt size={15} className="text-muted-foreground" />
            </div>
          </div>
          <p className="text-2xl font-bold text-foreground">{allInvoices.length}</p>
          <p className="text-xs text-muted-foreground mt-0.5">all time</p>
        </div>
      </div>

      {/* Recent invoices */}
      <div className="bg-card border border-border rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-foreground">Recent invoices</h2>
          <Link href="/creator/invoices" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
            View all
          </Link>
        </div>

        {recent.length === 0 ? (
          <div className="py-10 text-center">
            <p className="text-sm text-muted-foreground mb-4">No invoices yet</p>
            <Link
              href="/creator/invoices/new"
              className="inline-flex items-center gap-2 bg-foreground/90 text-background px-4 py-2 rounded-lg text-sm font-medium hover:bg-foreground transition-colors"
            >
              <Plus size={14} />
              Create invoice
            </Link>
          </div>
        ) : (
          <div className="space-y-0">
            {recent.map(invoice => (
              <div key={invoice.id} className="flex items-center justify-between py-3 border-b border-border last:border-0">
                <div>
                  <p className="text-sm font-medium text-foreground">{invoice.brand_name}</p>
                  <p className="text-xs text-muted-foreground truncate max-w-48">{invoice.description}</p>
                </div>
                <div className="flex items-center gap-3">
                  <StatusBadge status={invoice.status} />
                  <span className="text-sm font-semibold text-foreground">
                    ${(invoice.amount / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {recent.length > 0 && (
          <div className="mt-4 pt-4 border-t border-border">
            <Link
              href="/creator/invoices/new"
              className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              <Plus size={14} />
              Create invoice
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
