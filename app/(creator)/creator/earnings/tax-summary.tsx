'use client'

import { Download } from 'lucide-react'

interface Invoice {
  id: string
  brand_name: string
  description: string
  amount: number // cents
  paid_at: string | null
}

interface Expense {
  id: string
  amount_cents: number
  category: string
  description: string
  date: string
}

function fmtDollars(cents: number) {
  return '$' + (Math.abs(cents) / 100).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
}

const QUARTERS = [
  { label: 'Q1', months: [0, 1, 2] },
  { label: 'Q2', months: [3, 4, 5] },
  { label: 'Q3', months: [6, 7, 8] },
  { label: 'Q4', months: [9, 10, 11] },
]

export default function TaxSummary({ invoices, expenses }: { invoices: Invoice[]; expenses: Expense[] }) {
  const now = new Date()
  const year = now.getFullYear()

  const quarterData = QUARTERS.map(q => {
    const income = invoices
      .filter(i => {
        if (!i.paid_at) return false
        const d = new Date(i.paid_at)
        return d.getFullYear() === year && q.months.includes(d.getMonth())
      })
      .reduce((s, i) => s + i.amount, 0)

    const expenseTotal = expenses
      .filter(e => {
        const d = new Date(e.date)
        return d.getFullYear() === year && q.months.includes(d.getMonth())
      })
      .reduce((s, e) => s + e.amount_cents, 0)

    return { label: q.label, income, expenseTotal, net: income - expenseTotal }
  })

  function downloadCsv() {
    const rows: string[][] = [['Date', 'Type', 'Description', 'Amount']]
    for (const inv of invoices) {
      if (inv.paid_at) {
        rows.push([inv.paid_at.slice(0, 10), 'Income', `${inv.brand_name} — ${inv.description}`, (inv.amount / 100).toFixed(2)])
      }
    }
    for (const exp of expenses) {
      rows.push([exp.date, 'Expense', `${exp.category} — ${exp.description}`, (-exp.amount_cents / 100).toFixed(2)])
    }
    const csv = rows.map(r => r.map(v => `"${v.replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `influencr-pnl-${year}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const totalIncome = quarterData.reduce((s, q) => s + q.income, 0)
  const totalExpenses = quarterData.reduce((s, q) => s + q.expenseTotal, 0)
  const totalNet = totalIncome - totalExpenses

  return (
    <div className="bg-card border border-border rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="font-semibold text-foreground">Tax Summary — {year}</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Income from paid invoices minus logged expenses</p>
        </div>
        <button
          onClick={downloadCsv}
          className="flex items-center gap-1.5 text-xs px-3 py-1.5 border border-border rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        >
          <Download size={12} />
          Export CSV
        </button>
      </div>

      <div className="overflow-hidden rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead className="bg-muted/40">
            <tr>
              <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Quarter</th>
              <th className="text-right px-4 py-2.5 text-xs font-medium text-muted-foreground">Income</th>
              <th className="text-right px-4 py-2.5 text-xs font-medium text-muted-foreground">Expenses</th>
              <th className="text-right px-4 py-2.5 text-xs font-medium text-muted-foreground">Net</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {quarterData.map(q => (
              <tr key={q.label} className="hover:bg-muted/20">
                <td className="px-4 py-2.5 font-medium text-foreground">{q.label}</td>
                <td className="px-4 py-2.5 text-right text-foreground">{q.income > 0 ? fmtDollars(q.income) : '—'}</td>
                <td className="px-4 py-2.5 text-right text-muted-foreground">{q.expenseTotal > 0 ? fmtDollars(q.expenseTotal) : '—'}</td>
                <td className={`px-4 py-2.5 text-right font-semibold ${q.net >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {q.income === 0 && q.expenseTotal === 0 ? '—' : (q.net < 0 ? '-' : '') + fmtDollars(q.net)}
                </td>
              </tr>
            ))}
            <tr className="bg-muted/20 border-t-2 border-border">
              <td className="px-4 py-2.5 font-semibold text-foreground">Total</td>
              <td className="px-4 py-2.5 text-right font-semibold text-foreground">{totalIncome > 0 ? fmtDollars(totalIncome) : '—'}</td>
              <td className="px-4 py-2.5 text-right font-semibold text-muted-foreground">{totalExpenses > 0 ? fmtDollars(totalExpenses) : '—'}</td>
              <td className={`px-4 py-2.5 text-right font-bold ${totalNet >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {totalIncome === 0 && totalExpenses === 0 ? '—' : (totalNet < 0 ? '-' : '') + fmtDollars(totalNet)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}
