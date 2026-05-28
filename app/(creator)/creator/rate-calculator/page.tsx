'use client'

import { useState, useMemo } from 'react'
import { Copy, Check } from 'lucide-react'

const CPM: Record<string, { low: number; high: number }> = {
  'Instagram Post': { low: 10, high: 25 },
  'Instagram Reel': { low: 12, high: 30 },
  'Instagram Story': { low: 4, high: 10 },
  'TikTok Video': { low: 5, high: 15 },
  'YouTube Integration': { low: 15, high: 40 },
  'YouTube Dedicated': { low: 25, high: 60 },
  'Twitter Thread': { low: 3, high: 10 },
  'Twitter Tweet': { low: 2, high: 6 },
  'LinkedIn Post': { low: 8, high: 20 },
  'Newsletter Dedicated': { low: 20, high: 50 },
  'Newsletter Mention': { low: 8, high: 20 },
}

const CONTENT_TYPES: Record<string, string[]> = {
  Instagram: ['Instagram Post', 'Instagram Reel', 'Instagram Story'],
  TikTok: ['TikTok Video'],
  YouTube: ['YouTube Integration', 'YouTube Dedicated'],
  'Twitter/X': ['Twitter Thread', 'Twitter Tweet'],
  LinkedIn: ['LinkedIn Post'],
  Newsletter: ['Newsletter Dedicated', 'Newsletter Mention'],
}

const PLATFORMS = Object.keys(CONTENT_TYPES)

function erMultiplier(er: number): number {
  if (er >= 6) return 1.5
  if (er >= 4) return 1.25
  if (er >= 2) return 1.0
  if (er >= 1) return 0.85
  return 0.7
}

function round50(n: number): number {
  return Math.round(n / 50) * 50
}

const inputClass =
  'w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand/40'

const labelClass = 'block text-sm font-medium text-foreground mb-1.5'

export default function RateCalculatorPage() {
  const [platform, setPlatform] = useState('Instagram')
  const [contentType, setContentType] = useState('Instagram Post')
  const [followers, setFollowers] = useState('')
  const [engagementRate, setEngagementRate] = useState('')
  const [copied, setCopied] = useState(false)

  function handlePlatformChange(p: string) {
    setPlatform(p)
    setContentType(CONTENT_TYPES[p][0])
  }

  const result = useMemo(() => {
    const f = parseFloat(followers)
    if (!f || f <= 0) return null

    const er = parseFloat(engagementRate) || 2
    const cpm = CPM[contentType]
    const mult = erMultiplier(er)
    const thousands = f / 1000

    const low = round50(thousands * cpm.low * mult)
    const high = round50(thousands * cpm.high * mult)
    const mid = round50((low + high) / 2)

    return { low, mid, high, followers: f, er, contentType, platform }
  }, [followers, engagementRate, contentType, platform])

  function handleCopy() {
    if (!result) return
    const text = `My rate for ${result.contentType} on ${result.platform}: $${result.low.toLocaleString()} – $${result.high.toLocaleString()} (influencr rate calculator)`
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="p-8 max-w-xl">
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-foreground">Rate calculator</h1>
        <p className="text-sm text-muted-foreground mt-1">Estimate your sponsorship rate in seconds</p>
      </div>

      <div className="bg-card border border-border rounded-xl p-6 space-y-5">
        <div>
          <label className={labelClass}>Platform</label>
          <select
            value={platform}
            onChange={e => handlePlatformChange(e.target.value)}
            className={inputClass}
          >
            {PLATFORMS.map(p => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </div>

        <div>
          <label className={labelClass}>Content type</label>
          <select
            value={contentType}
            onChange={e => setContentType(e.target.value)}
            className={inputClass}
          >
            {CONTENT_TYPES[platform].map(ct => (
              <option key={ct} value={ct}>{ct.replace(`${platform} `, '')}</option>
            ))}
          </select>
        </div>

        <div>
          <label className={labelClass}>Followers / subscribers</label>
          <input
            type="number"
            min="0"
            placeholder="50000"
            value={followers}
            onChange={e => setFollowers(e.target.value)}
            className={inputClass}
          />
        </div>

        <div>
          <label className={labelClass}>Engagement rate (%) <span className="text-muted-foreground font-normal">optional</span></label>
          <input
            type="number"
            min="0"
            step="0.1"
            placeholder="3.5"
            value={engagementRate}
            onChange={e => setEngagementRate(e.target.value)}
            className={inputClass}
          />
        </div>
      </div>

      {result && (
        <div className="mt-6 bg-card border border-border rounded-xl p-6 space-y-5">
          <div>
            <p className="text-xs text-muted-foreground mb-1">
              Based on {result.followers.toLocaleString()} followers on {result.platform} with {result.er}% engagement
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
