import { createClient } from '@/lib/supabase/server'
import { Plus } from 'lucide-react'
import Link from 'next/link'
import InvoicesClient from './client'

export interface CreatorInvoice {
  id: string
  brand_name: string
  brand_email: string
  description: string
  amount: number
  status: string
  pay_token: string
  due_date: string | null
  sent_at: string | null
  paid_at: string | null
  created_at: string
  currency: string | null
  brand_rating: number | null
  brand_notes: string | null
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

      {allInvoices.length === 0 ? (
        <div className="bg-card border border-border rounded-xl py-16 text-center">
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
        <InvoicesClient invoices={allInvoices} />
      )}
    </div>
  )
}
