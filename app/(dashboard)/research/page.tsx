'use client'

import { useState } from 'react'
import { Search, ExternalLink, UserPlus, Check, AlertCircle, Loader2 } from 'lucide-react'

interface Profile {
  handle: string
  platform: string
  display_name: string | null
  bio: string | null
  followers: number | null
  following: number | null
  posts: number | null
  profile_url: string
}

function formatNumber(n: number | null): string {
  if (n === null) return 'N/A'
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return n.toString()
}

export default function ResearchPage() {
  const [handle, setHandle] = useState('')
  const [platform, setPlatform] = useState<'instagram' | 'tiktok'>('instagram')
  const [loading, setLoading] = useState(false)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)

  async function lookup(e: React.FormEvent) {
    e.preventDefault()
    const cleaned = handle.replace(/^@/, '').trim()
    if (!cleaned) return

    setLoading(true)
    setProfile(null)
    setError(null)
    setSaved(false)

    const res = await fetch(
      `/api/influencer-research?handle=${encodeURIComponent(cleaned)}&platform=${platform}`
    )
    const data = await res.json()

    if (!res.ok) {
      setError(data.error ?? 'Something went wrong')
    } else {
      setProfile(data)
    }

    setLoading(false)
  }

  async function saveContact() {
    if (!profile) return
    setSaving(true)

    const res = await fetch('/api/influencers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: profile.display_name ?? profile.handle,
        handle: profile.handle,
        platform: profile.platform,
        followers: profile.followers,
        notes: profile.bio ?? '',
        status: 'prospect',
      }),
    })

    if (res.ok) setSaved(true)
    setSaving(false)
  }

  return (
    <div className="p-8 max-w-2xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">Influencer Research</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Look up any creator&apos;s public stats
        </p>
      </div>

      {/* Search Form */}
      <form onSubmit={lookup} className="bg-card border border-border rounded-xl p-5 mb-6">
        <div className="flex gap-3 mb-4">
          {/* Platform Toggle */}
          <div className="flex rounded-lg border border-border overflow-hidden text-sm shrink-0">
            <button
              type="button"
              onClick={() => setPlatform('instagram')}
              className={`px-3 py-2 font-medium transition-colors ${
                platform === 'instagram'
                  ? 'bg-foreground/90 text-background'
                  : 'text-muted-foreground hover:bg-muted'
              }`}
            >
              Instagram
            </button>
            <button
              type="button"
              onClick={() => setPlatform('tiktok')}
              className={`px-3 py-2 font-medium transition-colors border-l border-border ${
                platform === 'tiktok'
                  ? 'bg-foreground/90 text-background'
                  : 'text-muted-foreground hover:bg-muted'
              }`}
            >
              TikTok
            </button>
          </div>

          {/* Handle Input */}
          <div className="flex-1 relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/50 text-sm select-none">
              @
            </span>
            <input
              value={handle}
              onChange={e => setHandle(e.target.value.replace(/^@/, ''))}
              placeholder="handle"
              className="w-full pl-7 pr-3 py-2 border border-border rounded-lg text-sm bg-background text-foreground placeholder:text-muted-foreground/50"
              autoComplete="off"
              spellCheck={false}
            />
          </div>

          <button
            type="submit"
            disabled={!handle.trim() || loading}
            className="flex items-center gap-2 bg-foreground/90 text-background px-4 py-2 rounded-lg text-sm font-medium hover:bg-foreground transition-colors disabled:opacity-50 shrink-0"
          >
            {loading ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
            Look up
          </button>
        </div>

        <p className="text-xs text-muted-foreground/60">
          Public profiles only. Some accounts may be rate-limited.
        </p>
      </form>

      {/* Error */}
      {error && (
        <div className="flex items-start gap-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 rounded-xl p-4 mb-6">
          <AlertCircle size={16} className="text-red-500 shrink-0 mt-0.5" />
          <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Results */}
      {profile && (
        <div className="bg-card border border-border rounded-xl p-6">
          <div className="flex items-start justify-between mb-5">
            <div>
              {profile.display_name && (
                <h2 className="text-lg font-semibold text-foreground">{profile.display_name}</h2>
              )}
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-sm text-muted-foreground">@{profile.handle}</span>
                <span className="text-xs px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground capitalize">
                  {profile.platform}
                </span>
              </div>
            </div>
            <a
              href={profile.profile_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors border border-border px-3 py-1.5 rounded-lg"
            >
              <ExternalLink size={12} />
              Profile
            </a>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3 mb-5">
            <div className="bg-muted/40 rounded-xl p-4 text-center">
              <p className="text-xl font-bold text-foreground">{formatNumber(profile.followers)}</p>
              <p className="text-xs text-muted-foreground mt-0.5">Followers</p>
            </div>
            <div className="bg-muted/40 rounded-xl p-4 text-center">
              <p className="text-xl font-bold text-foreground">{formatNumber(profile.following)}</p>
              <p className="text-xs text-muted-foreground mt-0.5">Following</p>
            </div>
            <div className="bg-muted/40 rounded-xl p-4 text-center">
              <p className="text-xl font-bold text-foreground">{formatNumber(profile.posts)}</p>
              <p className="text-xs text-muted-foreground mt-0.5">Posts</p>
            </div>
          </div>

          {profile.bio && (
            <p className="text-sm text-foreground/80 leading-relaxed mb-5 whitespace-pre-wrap">
              {profile.bio}
            </p>
          )}

          <div className="flex items-center gap-3 pt-1">
            <button
              onClick={saveContact}
              disabled={saving || saved}
              className="flex items-center gap-2 bg-foreground/90 text-background px-4 py-2 rounded-lg text-sm font-medium hover:bg-foreground transition-colors disabled:opacity-50"
            >
              {saved
                ? <><Check size={14} /> Saved to Contacts</>
                : saving
                ? <><Loader2 size={14} className="animate-spin" /> Saving…</>
                : <><UserPlus size={14} /> Save to Contacts</>
              }
            </button>
            {saved && (
              <span className="text-xs text-muted-foreground">
                Added to your Contacts list
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
