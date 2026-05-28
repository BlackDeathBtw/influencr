'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { ExternalLink, Download } from 'lucide-react'
import type { CreatorInvoice } from './page'
import { RatingPrompt } from './rating-prompt'
import { CopyButton } from './copy-button'

function exportCSV(invoices: CreatorInvoice[]) {
  const paid = invoices.filter(i => i.status === 'paid' && i.paid_at)
  const rows = [
    ['Date Paid', 'Brand', 'Description', 'Amount (USD)', 'Status'],
    ...paid.map(i => [
      i.paid_at!.slice(0, 10),
      i.brand_name,
      i.description,
      (i.amount / 100).toFixed(2),
      'paid',
    ]),
  ]
  const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `invoices-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
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

function isOverdue(invoice: CreatorInvoice): boolean {
  if (!invoice.due_date || invoice.status === 'paid') return false
  return new Date(invoice.due_date) < new Date(new Date().toDateString())
}

export default function InvoicesClient({ invoices }: { invoices: CreatorInvoice[] }) {
  const router = useRouter()
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [ratingFor, setRatingFor] = useState<string | null>(null)

  const unpaid = invoices.filter(i => i.status !== 'paid')
  const outstandingCents = unpaid.reduce((sum, i) => sum + i.amount, 0)

  const handleSend = useCallback(async (invoice: CreatorInvoice) => {
    setLoadingId(`send-${invoice.id}`)
    try {
      await fetch(`/api/creator-invoices/${invoice.pay_token}/send`, { method: 'POST' })
      router.refresh()
    } finally {
      setLoadingId(null)
    }
  }, [router])

  const handleMarkPaid = useCallback(async (invoice: CreatorInvoice) => {
    setLoadingId(`paid-${invoice.id}`)
    try {
      const res = await fetch(`/api/creator-invoices/${invoice.pay_token}/mark-paid`, { method: 'POST' })
      if (res.ok) {
        setRatingFor(invoice.id)
      } else {
        router.refresh()
      }
    } finally {
      setLoadingId(null)
    }
  }, [router])

  const handleRatingDone = useCallback(() => {
    setRatingFor(null)
    router.refresh()
  }, [router])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        {outstandingCents > 0 ? (
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-5 py-3 text-sm flex-1 mr-4">
            <span className="font-semibold text-amber-800">Outstanding: </span>
            <span className="text-amber-700">
              ${(outstandingCents / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })} across {unpaid.length} invoice{unpaid.length !== 1 ? 's' : ''}
            </span>
          </div>
        ) : (
          <div />
        )}
        <button
          onClick={() => exportCSV(invoices)}
          className="inline-flex items-center gap-2 border border-border text-foreground px-4 py-2 rounded-lg text-sm font-semibold hover:bg-muted transition-colors shrink-0"
        >
          <Download size={14} />
          Export CSV
        </button>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
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
            {invoices.map(invoice => (
              <>
                <tr key={invoice.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                  <td className="px-5 py-3.5">
                    <p className="font-medium text-foreground">{invoice.brand_name}</p>
                    <p className="text-xs text-muted-foreground">{invoice.brand_email}</p>
                  </td>
                  <td className="px-5 py-3.5 text-muted-foreground truncate max-w-52">{invoice.description}</td>
                  <td className="px-5 py-3.5 font-semibold text-foreground">
                    ${(invoice.amount / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <StatusBadge status={invoice.status} />
                      {isOverdue(invoice) && (
                        <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-red-100 text-red-700">Overdue</span>
                      )}
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-muted-foreground">
                    {new Date(invoice.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <a href={`/pay/${invoice.pay_token}`} target="_blank" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
                        <ExternalLink size={12} />View
                      </a>
                      <CopyButton token={invoice.pay_token} />
                      {invoice.status === 'draft' && (
                        <button onClick={() => handleSend(invoice)} disabled={loadingId === `send-${invoice.id}`} className="text-xs text-blue-600 hover:text-blue-800 font-medium disabled:opacity-50 transition-colors">
                          {loadingId === `send-${invoice.id}` ? 'Sending…' : 'Send'}
                        </button>
                      )}
                      {invoice.status !== 'paid' && (
                        <button onClick={() => handleMarkPaid(invoice)} disabled={loadingId === `paid-${invoice.id}`} className="text-xs text-green-600 hover:text-green-800 font-medium disabled:opacity-50 transition-colors">
                          {loadingId === `paid-${invoice.id}` ? 'Saving…' : 'Mark paid'}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
                {ratingFor === invoice.id && (
                  <RatingPrompt key={`rating-${invoice.id}`} invoice={invoice} onDone={handleRatingDone} />
                )}
              </>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
