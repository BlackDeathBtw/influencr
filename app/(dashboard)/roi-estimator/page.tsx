'use client'

import { useState, useMemo } from 'react'
import { Calculator, Info, ChevronDown, ChevronUp } from 'lucide-react'

type Platform = 'instagram' | 'tiktok' | 'youtube'

const EMV_RATES: Record<Platform, number> = {
  instagram: 0.08,
  tiktok: 0.04,
  youtube: 0.20,
}

const PRESETS = {
  conservative: { label: 'Conservative', desc: 'Lower engagement, lower CVR — realistic worst case', engagementRate: '2', conversionRate: '0.8', color: 'text-muted-foreground border-border' },
  realistic:    { label: 'Realistic',    desc: 'Industry average for mid-tier influencers',          engagementRate: '3', conversionRate: '1.5', color: 'text-amber-400 border-amber-500/30' },
  optimistic:   { label: 'Optimistic',   desc: 'High engagement, niche-matched audience',            engagementRate: '5', conversionRate: '3',   color: 'text-green-400 border-green-500/30' },
}

const PLATFORM_BENCHMARKS: Record<Platform, { cvr: string; er: string }> = {
  instagram: { cvr: '1–2%', er: '2–5%' },
  tiktok:    { cvr: '1–3%', er: '4–8%' },
  youtube:   { cvr: '2–5%', er: '2–4%' },
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
        <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 z-10 w-56 bg-card border border-border text-xs text-muted-foreground rounded-lg px-2.5 py-1.5 shadow-lg leading-relaxed pointer-events-none">
          {text}
        </span>
      )}
    </span>
  )
}

function CalcStep({ label, formula, result }: { label: string; formula: string; result: string }) {
  return (
    <div className="flex items-start gap-3 py-2 border-b border-border last:border-0">
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-foreground">{label}</p>
        <p className="text-[11px] text-muted-foreground font-mono mt-0.5 break-all">{formula}</p>
      </div>
      <p className="text-sm font-bold text-brand shrink-0">{result}</p>
    </div>
  )
}

export default function ROIEstimatorPage() {
  const [fee, setFee] = useState('')
  const [reach, setReach] = useState('')
  const [engagementRate, setEngagementRate] = useState('3')
  const [productPrice, setProductPrice] = useState('')
  const [conversionRate, setConversionRate] = useState('1.5')
  const [platform, setPlatform] = useState<Platform>('instagram')
  const [showFormulas, setShowFormulas] = useState(true)

  function applyPreset(key: keyof typeof PRESETS) {
    const p = PRESETS[key]
    setEngagementRate(p.engagementRate)
    setConversionRate(p.conversionRate)
  }

  const r = useMemo(() => {
    const feeNum = parseFloat(fee) || 0
    const reachNum = parseFloat(reach) || 0
    const engNum = parseFloat(engagementRate) || 0
    const priceNum = parseFloat(productPrice) || 0
    const convNum = parseFloat(conversionRate) || 0

    const engagements = reachNum * (engNum / 100)
    const estimatedSales = engagements * (convNum / 100)
    const estimatedRevenue = estimatedSales * priceNum
    const roas = feeNum > 0 ? estimatedRevenue / feeNum : null
    const cpm = reachNum > 0 && feeNum > 0 ? (feeNum / reachNum) * 1000 : null
    const emv = reachNum * EMV_RATES[platform]
    const breakEven = priceNum > 0 ? feeNum / priceNum : null

    return { engagements, estimatedSales, estimatedRevenue, roas, cpm, emv, breakEven, feeNum, reachNum, engNum, priceNum, convNum }
  }, [fee, reach, engagementRate, productPrice, conversionRate, platform])

  function roasColor(): string {
    if (r.roas == null) return 'text-foreground'
    if (r.roas < 1) return 'text-red-400'
    if (r.roas < 2) return 'text-amber-400'
    return 'text-green-400'
  }

  const inputClass = 'w-full px-3 py-2 bg-muted border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-brand/50'
  const labelClass = 'block text-xs font-medium text-muted-foreground mb-1'
  const benchmarks = PLATFORM_BENCHMARKS[platform]
  const hasInputs = r.reachNum > 0 && r.feeNum > 0

  return (
    <div className="p-8 max-w-5xl">
      <div className="flex items-center gap-3 mb-2">
        <Calculator size={20} className="text-brand" />
        <h1 className="text-2xl font-bold text-foreground">ROI Estimator</h1>
      </div>
      <p className="text-sm text-muted-foreground mb-6">Forecast returns before committing to a creator deal. All calculations are shown so you can trust the numbers.</p>

      {/* Preset scenarios */}
      <div className="mb-6">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Quick scenarios — fill engagement &amp; CVR</p>
        <div className="grid grid-cols-3 gap-3">
          {(Object.entries(PRESETS) as [keyof typeof PRESETS, typeof PRESETS[keyof typeof PRESETS]][]).map(([key, p]) => (
            <button
              key={key}
              onClick={() => applyPreset(key)}
              className={`text-left px-4 py-3 rounded-xl border transition-colors hover:bg-muted/40 ${p.color}`}
            >
              <p className="text-sm font-semibold">{p.label}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{p.desc}</p>
              <p className="text-[11px] font-mono text-muted-foreground mt-1.5">ER {p.engagementRate}% · CVR {p.conversionRate}%</p>
            </button>
          ))}
        </div>
      </div>

      <div className="grid lg:grid-cols-5 gap-6">
        {/* Inputs */}
        <div className="lg:col-span-2 bg-card border border-border rounded-xl p-6 space-y-4">
          <h2 className="font-semibold text-foreground text-sm">Campaign inputs</h2>

          <div>
            <label className={labelClass}>Creator fee ($)</label>
            <input type="number" min="0" value={fee} onChange={e => setFee(e.target.value)} placeholder="e.g. 2000" className={inputClass} />
          </div>

          <div>
            <label className={labelClass}>Platform</label>
            <select value={platform} onChange={e => setPlatform(e.target.value as Platform)} className={inputClass}>
              <option value="instagram">Instagram</option>
              <option value="tiktok">TikTok</option>
              <option value="youtube">YouTube</option>
            </select>
            <p className="text-[11px] text-muted-foreground mt-1">Typical ER: {benchmarks.er} · Typical CVR: {benchmarks.cvr}</p>
          </div>

          <div>
            <label className={labelClass}>Estimated reach (followers / views)</label>
            <input type="number" min="0" value={reach} onChange={e => setReach(e.target.value)} placeholder="e.g. 50000" className={inputClass} />
          </div>

          <div>
            <label className={labelClass}>
              Engagement rate (%)
              <Tooltip text="Likes + comments + shares ÷ reach. Industry avg: 3% Instagram, 6% TikTok, 3% YouTube." />
            </label>
            <input type="number" min="0" max="100" step="0.1" value={engagementRate} onChange={e => setEngagementRate(e.target.value)} className={inputClass} />
          </div>

          <div>
            <label className={labelClass}>Product price ($)</label>
            <input type="number" min="0" value={productPrice} onChange={e => setProductPrice(e.target.value)} placeholder="e.g. 49" className={inputClass} />
          </div>

          <div>
            <label className={labelClass}>
              Conversion rate (%)
              <Tooltip text="Of the people who engage, what % buy? Industry avg: 1–2% for mid-tier. Nano can reach 3–5% due to higher trust." />
            </label>
            <input type="number" min="0" max="100" step="0.1" value={conversionRate} onChange={e => setConversionRate(e.target.value)} className={inputClass} />
          </div>
        </div>

        {/* Results */}
        <div className="lg:col-span-3 space-y-4">
          {/* Key numbers */}
          <div className="bg-card border border-border rounded-xl p-6">
            <h2 className="font-semibold text-foreground text-sm mb-4">Projected results</h2>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Estimated sales', value: fmt(r.estimatedSales, r.estimatedSales >= 1 ? 0 : 2), sub: 'units', color: '' },
                { label: 'Estimated revenue', value: fmtCurrency(r.estimatedRevenue), sub: '', color: '' },
                { label: 'ROAS', value: r.roas != null ? `${r.roas.toFixed(2)}×` : '—', sub: r.roas != null ? (r.roas >= 2 ? 'Healthy' : r.roas >= 1 ? 'Break-even zone' : 'Loss-making') : undefined, color: roasColor() },
                { label: 'CPM', value: r.cpm != null ? fmtCurrency(r.cpm) : '—', sub: 'per 1,000 views', color: '' },
                { label: 'EMV', value: fmtCurrency(r.emv), sub: `${platform} benchmark`, color: 'text-green-400' },
                { label: 'Break-even sales', value: r.breakEven != null ? fmt(Math.ceil(r.breakEven)) : '—', sub: 'units to cover fee', color: '' },
              ].map(({ label, value, sub, color }) => (
                <div key={label} className="bg-muted border border-border rounded-xl p-4">
                  <p className="text-xs text-muted-foreground mb-1">{label}</p>
                  <p className={`text-xl font-bold ${color || 'text-foreground'}`}>{value}</p>
                  {sub && <p className="text-xs text-muted-foreground/60 mt-0.5">{sub}</p>}
                </div>
              ))}
            </div>
          </div>

          {/* Calculation chain */}
          <div className="bg-card border border-border rounded-xl p-6">
            <button
              onClick={() => setShowFormulas(v => !v)}
              className="flex items-center justify-between w-full text-left"
            >
              <h2 className="font-semibold text-foreground text-sm">How it&apos;s calculated</h2>
              {showFormulas ? <ChevronUp size={15} className="text-muted-foreground" /> : <ChevronDown size={15} className="text-muted-foreground" />}
            </button>
            {showFormulas && (
              <div className="mt-4">
                {hasInputs ? (
                  <>
                    <CalcStep
                      label="Engagements"
                      formula={`Reach × ER = ${fmt(r.reachNum)} × ${r.engNum}% = ${fmt(r.engagements)}`}
                      result={fmt(r.engagements)}
                    />
                    <CalcStep
                      label="Estimated sales"
                      formula={`Engagements × CVR = ${fmt(r.engagements)} × ${r.convNum}% = ${fmt(r.estimatedSales, 1)}`}
                      result={fmt(r.estimatedSales, 1)}
                    />
                    <CalcStep
                      label="Estimated revenue"
                      formula={`Sales × Price = ${fmt(r.estimatedSales, 1)} × $${r.priceNum} = ${fmtCurrency(r.estimatedRevenue)}`}
                      result={fmtCurrency(r.estimatedRevenue)}
                    />
                    {r.roas != null && (
                      <CalcStep
                        label="ROAS"
                        formula={`Revenue ÷ Fee = ${fmtCurrency(r.estimatedRevenue)} ÷ $${fmt(r.feeNum)} = ${r.roas.toFixed(2)}×`}
                        result={`${r.roas.toFixed(2)}×`}
                      />
                    )}
                    {r.cpm != null && (
                      <CalcStep
                        label="CPM"
                        formula={`(Fee ÷ Reach) × 1,000 = ($${fmt(r.feeNum)} ÷ ${fmt(r.reachNum)}) × 1,000`}
                        result={fmtCurrency(r.cpm)}
                      />
                    )}
                    <CalcStep
                      label="EMV"
                      formula={`Reach × $${EMV_RATES[platform]}/view (${platform} benchmark) = ${fmt(r.reachNum)} × $${EMV_RATES[platform]}`}
                      result={fmtCurrency(r.emv)}
                    />
                  </>
                ) : (
                  <p className="text-xs text-muted-foreground">Fill in creator fee and reach above to see the step-by-step calculation.</p>
                )}
                <div className="mt-4 pt-4 border-t border-border space-y-2">
                  <p className="text-xs font-semibold text-foreground">What these terms mean</p>
                  {[
                    ['ROAS', 'Revenue ÷ spend. Above 1× you cover costs. Above 2× is healthy. Below 1× you lose money.'],
                    ['CPM', 'Cost per 1,000 views. Lower = more efficient. Compare across creators to find better value.'],
                    ['EMV', 'Earned Media Value — a proxy for the organic value of the attention generated, using platform benchmarks ($0.08/view Instagram, $0.04 TikTok, $0.20 YouTube).'],
                    ['CVR', 'Conversion rate. Of the people who engage, how many buy? Avg 1–2% for mid-tier, 3–5% for nano (higher trust).'],
                  ].map(([term, desc]) => (
                    <div key={term}>
                      <span className="text-xs font-semibold text-foreground">{term} — </span>
                      <span className="text-xs text-muted-foreground">{desc}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
