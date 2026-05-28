'use client'

import { useState } from 'react'
import { Sparkles, Copy, Check, Loader2 } from 'lucide-react'

const PLATFORMS = ['Instagram', 'TikTok', 'YouTube', 'Twitter/X'] as const
type Platform = (typeof PLATFORMS)[number]

const TONES = ['Casual', 'Professional', 'Funny', 'Inspiring'] as const
type Tone = (typeof TONES)[number]

function SkeletonCard() {
  return (
    <div className="bg-card border border-border rounded-xl p-5 space-y-2 animate-pulse">
      <div className="h-3 bg-muted rounded w-3/4" />
      <div className="h-3 bg-muted rounded w-full" />
      <div className="h-3 bg-muted rounded w-5/6" />
      <div className="h-3 bg-muted rounded w-1/2" />
    </div>
  )
}

function CaptionCard({ caption, index }: { caption: string; index: number }) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(caption)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // clipboard not available
    }
  }

  return (
    <div className="bg-card border border-border rounded-xl p-5 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Option {index + 1}
        </span>
        <button
          onClick={handleCopy}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          {copied ? (
            <>
              <Check size={13} className="text-green-500" />
              <span className="text-green-600">Copied</span>
            </>
          ) : (
            <>
              <Copy size={13} />
              Copy
            </>
          )}
        </button>
      </div>
      <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{caption}</p>
    </div>
  )
}

export default function CaptionsPage() {
  const [platform, setPlatform] = useState<Platform>('Instagram')
  const [topic, setTopic] = useState('')
  const [tone, setTone] = useState<Tone>('Casual')
  const [keywords, setKeywords] = useState('')
  const [loading, setLoading] = useState(false)
  const [captions, setCaptions] = useState<string[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isMock, setIsMock] = useState(false)

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault()
    if (!topic.trim()) return
    setLoading(true)
    setError(null)
    setCaptions(null)
    setIsMock(false)

    try {
      const res = await fetch('/api/ai-captions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platform, topic, tone, keywords }),
      })
      const json = await res.json()
      if (!res.ok) {
        setError(json.error ?? 'Generation failed')
        return
      }
      setCaptions(json.captions)
      setIsMock(json.mock === true)
    } catch {
      setError('Network error — please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-8 space-y-6 max-w-2xl">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Sparkles size={18} className="text-brand" />
          <h1 className="text-2xl font-bold text-foreground">AI Caption Generator</h1>
        </div>
        <p className="text-sm text-muted-foreground">Generate platform-optimized captions for your posts</p>
      </div>

      <form onSubmit={handleGenerate} className="bg-card border border-border rounded-xl p-6 space-y-5">
        {/* Platform selector */}
        <div>
          <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            Platform
          </label>
          <div className="flex flex-wrap gap-2">
            {PLATFORMS.map(p => (
              <button
                key={p}
                type="button"
                onClick={() => setPlatform(p)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  platform === p
                    ? 'bg-brand text-brand-foreground'
                    : 'bg-muted text-muted-foreground hover:text-foreground'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* Topic */}
        <div>
          <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            What&apos;s this post about?
          </label>
          <textarea
            value={topic}
            onChange={e => setTopic(e.target.value)}
            required
            rows={3}
            placeholder="e.g. My morning routine for productivity, unboxing my new camera gear, tips for growing on social media…"
            className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-brand/50 resize-none"
          />
        </div>

        {/* Tone */}
        <div>
          <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            Tone
          </label>
          <div className="flex flex-wrap gap-2">
            {TONES.map(t => (
              <button
                key={t}
                type="button"
                onClick={() => setTone(t)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  tone === t
                    ? 'bg-brand text-brand-foreground'
                    : 'bg-muted text-muted-foreground hover:text-foreground'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Keywords */}
        <div>
          <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            Keywords / Hashtag Topics{' '}
            <span className="normal-case font-normal text-muted-foreground">(optional)</span>
          </label>
          <input
            value={keywords}
            onChange={e => setKeywords(e.target.value)}
            placeholder="travel, budgeting, wellness, photography…"
            className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-brand/50"
          />
        </div>

        <button
          type="submit"
          disabled={loading || !topic.trim()}
          className="w-full inline-flex items-center justify-center gap-2 bg-brand text-brand-foreground px-4 py-2.5 rounded-lg text-sm font-semibold hover:opacity-90 disabled:opacity-50 transition-opacity"
        >
          {loading ? (
            <>
              <Loader2 size={14} className="animate-spin" />
              Generating…
            </>
          ) : (
            <>
              <Sparkles size={14} />
              Generate Captions
            </>
          )}
        </button>
      </form>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading && (
        <div className="space-y-3">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      )}

      {captions && !loading && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground">Generated Captions</h2>
            {isMock && (
              <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                Sample (no API key)
              </span>
            )}
          </div>
          {captions.map((caption, i) => (
            <CaptionCard key={i} caption={caption} index={i} />
          ))}
        </div>
      )}
    </div>
  )
}
