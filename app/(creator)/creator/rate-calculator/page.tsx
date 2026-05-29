'use client'

import { useState, useMemo } from 'react'
import { Copy, Check, ChevronDown, ChevronUp, Info } from 'lucide-react'

const CPM: Record<string, { low: number; high: number; note: string }> = {
  'Instagram Post':        { low: 10, high: 25, note: 'Static image; lower reach than Reels but strong for lifestyle/fashion' },
  'Instagram Reel':        { low: 12, high: 30, note: 'Boosted by algorithm; best for discovery and high engagement' },
  'Instagram Story':       { low: 4,  high: 10, note: '24h lifespan; high intent audience but smaller scale' },
  'TikTok Video':          { low: 5,  high: 15, note: 'Wide reach potential; younger demographic; very high ER' },
  'YouTube Integration':   { low: 15, high: 40, note: 'Mid-roll or end-of-video mention; evergreen content' },
  'YouTube Dedicated':     { low: 25, high: 60, note: 'Full video focused on the brand; highest trust and depth' },
  'Twitter Thread':        { low: 3,  high: 10, note: 'Niche audiences; works well for B2B and tech' },
  'Twitter Tweet':         { low: 2,  high: 6,  note: 'Low CPM; best as part of a larger campaign' },
  'LinkedIn Post':         { low: 8,  high: 20, note: 'B2B sweet spot; professional audience, high intent' },
  'Newsletter Dedicated':  { low: 20, high: 50, note: 'Highest trust; subscribers opted in — great conversion' },
  'Newsletter Mention':    { low: 8,  high: 20, note: 'Shorter mention in a regular send; lower commitment' },
}

const CONTENT_TYPES: Record<string, string[]> = {
  Instagram: ['Instagram Post', 'Instagram Reel', 'Instagram Story'],
  TikTok: ['TikTok Video'],
  YouTube: ['YouTube Integration', 'YouTube Dedicated'],
  'Twitter/X': ['Twitter Thread', 'Twitter Tweet'],
  LinkedIn: ['LinkedIn Post'],
  Newsletter: ['Newsletter Dedicated', 'Newsletter Mention'],
}

const ER_TIERS = [
  { min: 6,   mult: 1.5,  label: 'Excellent (≥6%)',  desc: 'Top 10% of creators — command a premium', color: 'text-green-400' },
  { min: 4,   mult: 1.25, label: 'Good (4–6%)',       desc: 'Above average — justify higher rates',    color: 'text-sky-400' },
  { min: 2,   mult: 1.0,  label: 'Average (2–4%)',    desc: 'Industry standard — standard CPM applies', color: 'text-foreground' },
  { min: 1,   mult: 0.85, label: 'Below avg (1–2%)', desc: 'Lower engagement — negotiate accordingly', color: 'text-amber-400' },
  { min: 0,   mult: 0.7,  label: 'Low (<1%)',         desc: 'Audience may be inflated — buyers beware', color: 'text-red-400' },
]

const ADDONS = [
  { id: 'usage',       label: 'Usage rights (3 months)',  pct: 20,  desc: 'Brand wants to repurpose content in ads or their own channels' },
  { id: 'exclusivity', label: 'Category exclusivity',     pct: 30,  desc: "You won't work with competitors for the campaign period" },
  { id: 'rush',        label: 'Rush delivery (<1 week)',   pct: 25,  desc: 'Turnaround faster than your standard timeline' },
  { id: 'revisions',   label: 'Unlimited revisions',       pct: 15,  desc: 'More than 2 rounds of edits included' },
]

const FOLLOWER_TIERS = [
  { max: 10_000,    label: 'Nano',  color: 'bg-muted text-muted-foreground' },
  { max: 100_000,   label: 'Micro', color: 'bg-sky-500/15 text-sky-400' },
  { max: 1_000_000, label: 'Macro', color: 'bg-violet-500/15 text-violet-400' },
  { max: Infinity,  label: 'Mega',  color: 'bg-amber-500/15 text-amber-400' },
]

const PLATFORMS = Object.keys(CONTENT_TYPES)

function erMultiplier(er: number) {
  return ER_TIERS.find(t => er >= t.min)?.mult ?? 0.7
}

function round50(n: number): number {
  return Math.max(50, Math.round(n / 50) * 50)
}

function followerTier(f: number) {
  return FOLLOWER_TIERS.find(t => f < t.max) ?? FOLLOWER_TIERS[FOLLOWER_TIERS.length - 1]
}

const inputClass = 'w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand/40'
const labelClass = 'block text-sm font-medium text-foreground mb-1.5'

export default function RateCalculatorPage() {
  const [platform, setPlatform] = useState('Instagram')
  const [contentType, setContentType] = useState('Instagram Post')
  const [followers, setFollowers] = useState('')
  const [engagementRate, setEngagementRate] = useState('')
  const [activeAddons, setActiveAddons] = useState<Set<string>>(new Set())
  const [showFormula, setShowFormula] = useState(false)
  const [showErTable, setShowErTable] = useState(false)
  const [copied, setCopied] = useState(false)

  function handlePlatformChange(p: string) {
    setPlatform(p)
    setContentType(CONTENT_TYPES[p][0])
  }

  function toggleAddon(id: string) {
    setActiveAddons(prev => {
      const n = new Set(prev)
      n.has(id) ? n.delete(id) : n.add(id)
      return n
    })
  }

  const result = useMemo(() => {
    const f = parseFloat(followers)
    if (!f || f <= 0) return null

    const er = parseFloat(engagementRate) || 2
    const cpmRange = CPM[contentType]
    const mult = erMultiplier(er)
    const thousands = f / 1000

    const baseLow = round50(thousands * cpmRange.low * mult)
    const baseHigh = round50(thousands * cpmRange.high * mult)

    const addonPct = [...activeAddons].reduce((sum, id) => {
      const a = ADDONS.find(x => x.id === id)
      return sum + (a?.pct ?? 0)
    }, 0)

    const multiplier = 1 + addonPct / 100
    const low = round50(baseLow * multiplier)
    const high = round50(baseHigh * multiplier)
    const mid = round50((low + high) / 2)

    const currentErTier = ER_TIERS.find(t => er >= t.min) ?? ER_TIERS[ER_TIERS.length - 1]
    const tier = followerTier(f)

    return { low, mid, high, baseLow, baseHigh, followers: f, er, contentType, platform, mult, cpmRange, addonPct, multiplier, currentErTier, tier, thousands }
  }, [followers, engagementRate, contentType, platform, activeAddons])

  function handleCopy() {
    if (!result) return
    const addonsText = activeAddons.size > 0 ? ` (incl. ${[...activeAddons].map(id => ADDONS.find(a => a.id === id)?.label).join(', ')})` : ''
    const text = `My rate for ${result.contentType}: $${result.low.toLocaleString()} – $${result.high.toLocaleString()}${addonsText} · influencr rate calculator`
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const cpmInfo = CPM[contentType]

  return (
    <div className="p-8 max-w-2xl">
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-foreground">Rate calculator</h1>
        <p className="text-sm text-muted-foreground mt-1">Industry CPM benchmarks × your audience size × engagement multiplier</p>
      </div>

      <div className="bg-card border border-border rounded-xl p-6 space-y-5">
        <div>
          <label className={labelClass}>Platform</label>
          <select value={platform} onChange={e => handlePlatformChange(e.target.value)} className={inputClass}>
            {PLATFORMS.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>

        <div>
          <label className={labelClass}>Content type</label>
          <select value={contentType} onChange={e => setContentType(e.target.value)} className={inputClass}>
            {CONTENT_TYPES[platform].map(ct => <option key={ct} value={ct}>{ct.replace(`${platform} `, '')}</option>)}
          </select>
          <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">{cpmInfo?.note}</p>
          <p className="text-xs text-muted-foreground/70 mt-0.5 font-mono">CPM benchmark: ${cpmInfo?.low}–${cpmInfo?.high} per 1,000 followers</p>
        </div>

        <div>
          <label className={labelClass}>Followers / subscribers</label>
          <div className="flex items-center gap-2">
            <input type="number" min="0" placeholder="50000" value={followers} onChange={e => setFollowers(e.target.value)} className={inputClass} />
            {result && (
              <span className={`shrink-0 text-xs font-semibold px-2.5 py-1.5 rounded-full ${result.tier.color}`}>{result.tier.label}</span>
            )}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className={labelClass + ' mb-0'}>Engagement rate (%) <span className="text-muted-foreground font-normal">optional</span></label>
            <button onClick={() => setShowErTable(v => !v)} className="text-[11px] text-brand hover:underline flex items-center gap-0.5">
              How this affects rate {showErTable ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
            </button>
          </div>
          <input type="number" min="0" step="0.1" placeholder="3.5 (defaults to 2%)" value={engagementRate} onChange={e => setEngagementRate(e.target.value)} className={inputClass} />
          {result && (
            <p className={`text-xs mt-1.5 font-medium ${result.currentErTier.color}`}>
              {result.currentErTier.label} — {result.currentErTier.desc} (×{result.mult} multiplier)
            </p>
          )}
          {showErTable && (
            <div className="mt-3 rounded-lg border border-border overflow-hidden text-xs">
              {ER_TIERS.map(t => (
                <div key={t.label} className={`flex items-center justify-between px-3 py-2 border-b border-border last:border-0 ${result && result.currentErTier.min === t.min ? 'bg-brand/5' : ''}`}>
                  <div>
                    <span className={`font-semibold ${t.color}`}>{t.label}</span>
                    <span className="text-muted-foreground ml-2">{t.desc}</span>
                  </div>
                  <span className="font-mono text-muted-foreground shrink-0 ml-3">×{t.mult}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Add-ons */}
      <div className="mt-4 bg-card border border-border rounded-xl p-5">
        <p className="text-sm font-semibold text-foreground mb-1">Add-ons &amp; premium factors</p>
        <p className="text-xs text-muted-foreground mb-4">Each factor adds a % to your base rate. Check everything that applies to this deal.</p>
        <div className="space-y-2">
          {ADDONS.map(addon => (
            <label key={addon.id} className="flex items-start gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={activeAddons.has(addon.id)}
                onChange={() => toggleAddon(addon.id)}
                className="mt-0.5 accent-brand"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-foreground group-hover:text-brand transition-colors">{addon.label}</span>
                  <span className="text-xs font-semibold text-brand">+{addon.pct}%</span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">{addon.desc}</p>
              </div>
            </label>
          ))}
        </div>
      </div>

      {result && (
        <div className="mt-4 bg-card border border-border rounded-xl p-6 space-y-5">
          <div>
            <p className="text-xs text-muted-foreground mb-1">
              {result.followers.toLocaleString()} followers · {result.contentType} · {result.er}% ER
              {result.addonPct > 0 && ` · +${result.addonPct}% add-ons`}
            </p>
            <p className="font-display text-3xl font-bold text-foreground">
              ${result.low.toLocaleString()} – ${result.high.toLocaleString()}
            </p>
            <p className="text-sm text-muted-foreground mt-0.5">Suggested rate</p>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Budget-friendly', value: result.low },
              { label: 'Market rate', value: result.mid },
              { label: 'Premium', value: result.high },
            ].map(({ label, value }) => (
              <div key={label} className="rounded-lg border border-border bg-muted/40 px-3 py-3">
                <p className="text-[11px] text-muted-foreground mb-1">{label}</p>
                <p className="text-sm font-semibold text-foreground">${value.toLocaleString()}</p>
              </div>
            ))}
          </div>

          {/* Formula breakdown */}
          <div>
            <button onClick={() => setShowFormula(v => !v)} className="text-xs text-brand hover:underline flex items-center gap-1">
              {showFormula ? 'Hide' : 'Show'} calculation breakdown {showFormula ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
            </button>
            {showFormula && (
              <div className="mt-3 bg-muted/40 rounded-lg p-4 text-xs font-mono space-y-1.5 text-muted-foreground leading-relaxed">
                <p>Followers ÷ 1,000 = <span className="text-foreground">{result.thousands.toLocaleString(undefined, { maximumFractionDigits: 1 })}K</span></p>
                <p>CPM range = <span className="text-foreground">${result.cpmRange.low}–${result.cpmRange.high}</span> per 1K ({result.contentType})</p>
                <p>ER multiplier = <span className="text-foreground">×{result.mult}</span> ({result.er}% engagement rate)</p>
                <p>Base rate = <span className="text-foreground">${result.baseLow.toLocaleString()}–${result.baseHigh.toLocaleString()}</span></p>
                {result.addonPct > 0 && (
                  <p>Add-ons (+{result.addonPct}%) = <span className="text-foreground">×{result.multiplier.toFixed(2)}</span></p>
                )}
                <p className="pt-1 border-t border-border text-foreground font-semibold">
                  Final: ${result.low.toLocaleString()}–${result.high.toLocaleString()}
                </p>
              </div>
            )}
          </div>

          <button
            onClick={handleCopy}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-border text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
            {copied ? 'Copied!' : 'Copy result'}
          </button>
        </div>
      )}
    </div>
  )
}
