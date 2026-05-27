'use client'

import { Download } from 'lucide-react'

interface Props {
  campaign: {
    name: string
    status: string
    start_date?: string | null
    end_date?: string | null
    budget?: number | null
    currency: string
    revenue_target?: number | null
    revenue_attributed?: number | null
  }
  influencers: any[]
  content: any[]
  payments: any[]
}

function toCSV(rows: (string | number | null | undefined)[][]): string {
  return rows
    .map(row => row.map(cell => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(','))
    .join('\n')
}

export default function CampaignExport({ campaign, influencers, content, payments }: Props) {
  function download() {
    const rows: (string | number | null | undefined)[][] = []

    rows.push(['CAMPAIGN SUMMARY'])
    rows.push(['Name', campaign.name])
    rows.push(['Status', campaign.status])
    rows.push(['Start date', campaign.start_date ?? '—'])
    rows.push(['End date', campaign.end_date ?? '—'])
    rows.push(['Budget', campaign.budget != null ? `${campaign.currency} ${campaign.budget}` : '—'])
    rows.push(['Revenue target', campaign.revenue_target != null ? `${campaign.currency} ${campaign.revenue_target}` : '—'])
    rows.push(['Revenue attributed', campaign.revenue_attributed != null ? `${campaign.currency} ${campaign.revenue_attributed}` : '—'])
    rows.push([])

    const totalSpend = payments.filter((p: any) => p.status === 'paid').reduce((s: number, p: any) => s + Number(p.amount), 0)
    const confirmedInfluencers = influencers.filter((ci: any) => ci.status === 'confirmed')
    const estimatedReach = confirmedInfluencers.reduce((s: number, ci: any) => s + (ci.influencer?.followers ?? 0), 0)
    rows.push(['PERFORMANCE'])
    rows.push(['Total paid', `${campaign.currency} ${totalSpend.toLocaleString()}`])
    rows.push(['Estimated reach', estimatedReach > 0 ? `${(estimatedReach / 1000).toFixed(0)}K` : '—'])
    if (campaign.revenue_attributed && totalSpend > 0) {
      rows.push(['ROAS', `${(Number(campaign.revenue_attributed) / totalSpend).toFixed(2)}x`])
      rows.push(['ROI', `${(((Number(campaign.revenue_attributed) - totalSpend) / totalSpend) * 100).toFixed(1)}%`])
    }
    rows.push([])

    rows.push(['INFLUENCERS'])
    rows.push(['Name', 'Handle', 'Platform', 'Followers', 'Engagement', 'Deal status', 'Fee', 'Promo code', 'Revenue attributed'])
    for (const ci of influencers) {
      rows.push([
        ci.influencer?.name ?? '—',
        ci.influencer?.handle ? `@${ci.influencer.handle}` : '—',
        ci.influencer?.platform ?? '—',
        ci.influencer?.followers ?? '—',
        ci.influencer?.engagement_rate != null ? `${ci.influencer.engagement_rate}%` : '—',
        ci.status,
        ci.fee != null ? `${campaign.currency} ${ci.fee}` : '—',
        ci.promo_code ?? '—',
        ci.revenue_attributed != null ? `${campaign.currency} ${ci.revenue_attributed}` : '—',
      ])
    }
    rows.push([])

    rows.push(['CONTENT'])
    rows.push(['Influencer', 'Type', 'Due date', 'Status', 'URL', 'Views', 'Reach', 'Likes', 'Comments'])
    for (const c of content) {
      rows.push([
        c.influencer?.name ?? '—',
        c.type,
        c.due_date ?? '—',
        c.status,
        c.url ?? '—',
        c.views ?? '—',
        c.reach ?? '—',
        c.likes ?? '—',
        c.comments ?? '—',
      ])
    }
    rows.push([])

    rows.push(['PAYMENTS'])
    rows.push(['Influencer', 'Amount', 'Currency', 'Status', 'Invoice', 'Due date', 'Paid at'])
    for (const p of payments) {
      rows.push([
        p.influencer?.name ?? p.influencers?.name ?? '—',
        p.amount,
        p.currency,
        p.status,
        p.invoice_number ?? '—',
        p.due_date ?? '—',
        p.paid_at ?? '—',
      ])
    }

    const csv = toCSV(rows)
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${campaign.name.replace(/[^a-z0-9]/gi, '-').toLowerCase()}-report.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <button
      onClick={download}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-muted-foreground border border-border hover:text-foreground hover:bg-muted transition-colors"
    >
      <Download size={13} /> Export CSV
    </button>
  )
}
