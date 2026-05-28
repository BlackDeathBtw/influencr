'use client'

import { useState, useMemo } from 'react'
import { Calculator, Info } from 'lucide-react'

type Platform = 'instagram' | 'tiktok' | 'youtube'

const EMV_RATES: Record<Platform, number> = {
  instagram: 0.08,
  tiktok: 0.04,
  youtube: 0.20,
}

function fmt(n: number, decimals = 0): string {
  return n.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
}

function fmtCurrency(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}K`
  return `$${n.toFixed(2)}`
}

function Tooltip({ text }: { text: string }) {
  const [open, setOpen] = useState(false)
  return (
    <span className="relative inline-flex ml-1">
      <button
        type="button"
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        className="text-muted-foreground/50 hover:text-muted-foreground transition-colors"
        aria-label="More info"
      >
        <Info size={12} />
      </button>
      {open && (
        <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 z-10 w-48 bg-card border border-border text-xs text-muted-foreground rounded-lg px-2.5 py-1.5 shadow-lg leading-relaxed pointer-events-none">
          {text}
        </span>
      )}
    </span>
  )
}

interface StatCardProps {
  label: string
  value: string
  sub?: string
  color?: 'default' | 'green' | 'red' | 'amber'
}

function StatCard({ label, value, sub, color = 'default' }: StatCardProps) {
  const valueClass = {
    default: 'text-foreground',
    green: 'text-green-400',
    red: 'text-red-400',
    amber: 'text-amber-400',
  }[color]

  return (
    <div className="bg-muted border border-border rounded-xl p-4">
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      <p className={`text-xl font-bold ${valueClass}`}>{value}</p>
      {sub && <p className="text-xs text-muted-foreground/60 mt-0.5">{sub}</p>}
    </div>
  )
}

const EXPLANATIONS = [
  {
    term: 'Estimated Sales',
    desc: 'How many units you might sell, based on who sees the content, how many engage, and what share buy.',
  },
  {
    term: 'Estimated Revenue',
    desc: 'Estimated sales × your product price. This is the gross revenue the campaign could generate.',
  },
  {
    term: 'ROAS (Return on Ad Spend)',
    desc: 'Revenue divided by what you paid the creator. A ROAS of 2× means you earn $2 for every $1 spent. Above 1× you break even; above 2× is healthy.',
  },
  {
    term: 'CPM (Cost per 1,000 Views)',
    desc: 'How much you pay for every 1,000 people who see the content. Lower is more efficient.',
  },
  {
    term: 'EMV (Earned Media Value)',
    desc: 'A rough dollar value for the organic attention the content generates, based on industry benchmarks per platform view.',
  },
  {
    term: 'Break-even Sales',
    desc: 'The minimum number of units you must sell to cover the creator\'s fee. If estimated sales exceed this, the campaign is profitable.',
  },
]

export default function ROIEstimatorPage() {
  const [fee, setFee] = useState('')
  const [reach, setReach] = useState('')
  const [engagementRate, setEngagementRate] = useState('3')
  const [productPrice, setProductPrice] = useState('')
  const [conversionRate, setConversionRate] = useState('1.5')
  const [platform, setPlatform] = useState<Platform>('instagram')

  const results = useMemo(() => {
    const feeNum = parseFloat(fee) || 0
    const reachNum = parseFloat(reach) || 0
    const engNum = parseFloat(engagementRate) || 0
    const priceNum = parseFloat(productPrice) || 0
    const convNum = parseFloat(conversionRate) || 0

    const estimatedSales = reachNum * (engNum / 100) * (convNum / 100)
    const estimatedRevenue = estimatedSales * priceNum
    const roas = feeNum > 0 ? estimatedRevenue / feeNum : null
    const cpm = reachNum > 0 && feeNum > 0 ? (feeNum / reachNum) * 1000 : null
    const emv = reachNum * EMV_RATES[platform]
    const breakEven = priceNum > 0 ? feeNum / priceNum : null

    return { estimatedSales, estimatedRevenue, roas, cpm, emv, breakEven }
  }, [fee, reach, engagementRate, productPrice, conversionRate, platform])

  function roasColor(): 'red' | 'amber' | 'green' | 'default' {
    if (results.roas == null) return 'default'
    if (results.roas < 1) return 'red'
    if (results.roas < 2) return 'amber'
    return 'green'
  }

  const inputClass = 'w-full px-3 py-2 bg-muted border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-brand/50'
  const labelClass = 'block text-xs font-medium text-muted-foreground mb-1'

  return (
    <div className="p-8 max-w-5xl">
      <div className="flex items-center gap-3 mb-6">
        <Calculator size={20} className="text-brand" />
        <div>
          <h1 className="text-2xl font-bold text-foreground">ROI Estimator</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Forecast returns before committing to a creator deal</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-5 gap-6">
        {/* Inputs */}
        <div className="lg:col-span-2 bg-card border border-border rounded-xl p-6 space-y-4">
          <h2 className="font-semibold text-foreground text-sm">Campaign inputs</h2>

          <div>
            <label className={labelClass}>Creator fee ($)</label>
            <input
              type="number"
              min="0"
              value={fee}
              onChange={e => setFee(e.target.value)}
              placeholder="e.g. 2000"
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>Estimated reach (followers / views)</label>
            <input
              type="number"
              min="0"
              value={reach}
              onChange={e => setReach(e.target.value)}
              placeholder="e.g. 50000"
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>Engagement rate (%)</label>
            <input
              type="number"
              min="0"
              max="100"
              step="0.1"
              value={engagementRate}
              onChange={e => setEngagementRate(e.target.value)}
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>Product price ($)</label>
            <input
              type="number"
              min="0"
              value={productPrice}
              onChange={e => setProductPrice(e.target.value)}
              placeholder="e.g. 49"
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>
              Conversion rate (%)
              <Tooltip text="Industry avg for micro-influencers is ~1–2%. Nano-influencers can reach 3–5%." />
            </label>
            <input
              type="number"
              min="0"
              max="100"
              step="0.1"
              value={conversionRate}
              onChange={e => setConversionRate(e.target.value)}
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>Platform</label>
            <select
              value={platform}
              onChange={e => setPlatform(e.target.value as Platform)}
              className={inputClass}
            >
              <option value="instagram">Instagram ($0.08 EMV/view)</option>
              <option value="tiktok">TikTok ($0.04 EMV/view)</option>
              <option value="youtube">YouTube ($0.20 EMV/view)</option>
            </select>
          </div>
        </div>

        {/* Results */}
        <div className="lg:col-span-3 space-y-4">
          <div className="bg-card border border-border rounded-xl p-6">
            <h2 className="font-semibold text-foreground text-sm mb-4">Projected results</h2>
            <div className="grid grid-cols-2 gap-3">
              <StatCard
                label="Estimated sales"
                value={fmt(results.estimatedSales, results.estimatedSales >= 1 ? 0 : 2)}
                sub="units"
              />
              <StatCard
                label="Estimated revenue"
                value={fmtCurrency(results.estimatedRevenue)}
              />
              <StatCard
                label="ROAS"
                value={results.roas != null ? `${results.roas.toFixed(2)}x` : '—'}
                sub={results.roas != null ? (results.roas >= 2 ? 'Healthy' : results.roas >= 1 ? 'Break-even zone' : 'Loss-making') : undefined}
                color={roasColor()}
              />
              <StatCard
                label="CPM"
                value={results.cpm != null ? fmtCurrency(results.cpm) : '—'}
                sub="per 1,000 views"
              />
              <StatCard
                label="EMV"
                value={fmtCurrency(results.emv)}
                sub={`${platform} benchmark`}
                color="green"
              />
              <StatCard
                label="Break-even sales"
                value={results.breakEven != null ? fmt(Math.ceil(results.breakEven)) : '—'}
                sub="units needed to cover fee"
              />
            </div>
          </div>

          {/* Explanations */}
          <div className="bg-card border border-border rounded-xl p-6">
            <h2 className="font-semibold text-foreground text-sm mb-4">What does this mean?</h2>
            <div className="space-y-3">
              {EXPLANATIONS.map(({ term, desc }) => (
                <div key={term}>
                  <p className="text-xs font-semibold text-foreground">{term}</p>
                  <p className="text-xs text-muted-foreground leading-relaxed mt-0.5">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
