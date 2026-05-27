'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search, UserPlus, Check } from 'lucide-react'
import type { CreatorProfile } from '@/types'

interface Props {
  creators: CreatorProfile[]
  existingUserIds: string[]
}

const PLATFORM_COLORS: Record<string, string> = {
  instagram: 'bg-pink-100 text-pink-700',
  tiktok: 'bg-foreground/90 text-background',
  youtube: 'bg-red-100 text-red-700',
  twitter: 'bg-sky-100 text-sky-700',
  linkedin: 'bg-blue-100 text-blue-700',
}

function formatFollowers(n: number | null | undefined): string {
  if (!n) return '—'
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`
  return String(n)
}

export default function DiscoverClient({ creators, existingUserIds }: Props) {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [nicheFilter, setNicheFilter] = useState<string | null>(null)
  const [adding, setAdding] = useState<string | null>(null)
  const [added, setAdded] = useState<Set<string>>(new Set(existingUserIds))

  const allNiches = Array.from(
    new Set(creators.flatMap(c => c.niches ?? []))
  ).sort()

  const filtered = creators.filter(c => {
    const q = query.toLowerCase()
    const matchesQuery =
      !q ||
      (c.display_name ?? c.username).toLowerCase().includes(q) ||
      (c.niches ?? []).some(n => n.toLowerCase().includes(q)) ||
      (c.location ?? '').toLowerCase().includes(q)
    const matchesNiche = !nicheFilter || (c.niches ?? []).includes(nicheFilter)
    return matchesQuery && matchesNiche
  })

  async function addToCRM(creator: CreatorProfile) {
    setAdding(creator.id)
    const primaryStat = creator.platform_stats?.[0]

    await fetch('/api/influencers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: creator.display_name ?? creator.username,
        handle: primaryStat?.handle ?? creator.username,
        platform: primaryStat?.platform ?? null,
        niche: (creator.niches ?? []).join(', ') || null,
        followers: primaryStat?.followers ?? null,
        engagement_rate: primaryStat?.engagement_rate ?? null,
        notes: creator.bio ?? null,
        status: 'prospect',
      }),
    })

    setAdded(prev => new Set([...prev, creator.id]))
    setAdding(null)
    router.refresh()
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Discover creators</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {filtered.length} creator{filtered.length !== 1 ? 's' : ''} available
          </p>
        </div>
      </div>

      {/* Search + filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/70" />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search by name, niche, location…"
            className="w-full pl-9 pr-3 py-2 border border-border rounded-lg text-sm"
          />
        </div>
        {allNiches.length > 0 && (
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setNicheFilter(null)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                !nicheFilter ? 'bg-foreground/90 text-background' : 'bg-muted text-muted-foreground hover:bg-border'
              }`}
            >
              All
            </button>
            {allNiches.slice(0, 8).map(n => (
              <button
                key={n}
                onClick={() => setNicheFilter(nicheFilter === n ? null : n)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  nicheFilter === n ? 'bg-foreground/90 text-background' : 'bg-muted text-muted-foreground hover:bg-border'
                }`}
              >
                {n}
              </button>
            ))}
          </div>
        )}
      </div>

      {creators.length === 0 ? (
        <div className="bg-card border border-border rounded-xl py-16 text-center">
          <p className="text-muted-foreground/70 text-sm mb-2">No creator profiles yet</p>
          <p className="text-muted-foreground/70 text-xs">
            Creators who sign up at influencr.com/signup will appear here
          </p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-card border border-border rounded-xl py-16 text-center">
          <p className="text-muted-foreground/70 text-sm">No creators match your search</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(creator => {
            const primaryStat = creator.platform_stats?.[0]
            const isAdded = added.has(creator.id)

            return (
              <div key={creator.id} className="bg-card border border-border rounded-xl p-5 flex flex-col gap-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-brand/20 flex items-center justify-center text-sm font-bold text-brand-foreground shrink-0">
                      {(creator.display_name ?? creator.username).slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold text-foreground text-sm leading-tight">
                        {creator.display_name ?? creator.username}
                      </p>
                      <p className="text-xs text-muted-foreground/70">@{creator.username}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => !isAdded && addToCRM(creator)}
                    disabled={isAdded || adding === creator.id}
                    className={`flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg font-medium transition-colors shrink-0 ${
                      isAdded
                        ? 'bg-green-50 text-green-700 cursor-default'
                        : 'bg-foreground/90 text-background hover:bg-foreground disabled:opacity-50'
                    }`}
                  >
                    {isAdded ? (
                      <><Check size={11} /> Added</>
                    ) : adding === creator.id ? (
                      'Adding…'
                    ) : (
                      <><UserPlus size={11} /> Add</>
                    )}
                  </button>
                </div>

                {creator.bio && (
                  <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">{creator.bio}</p>
                )}

                <div className="flex flex-wrap gap-1.5">
                  {(creator.niches ?? []).map(n => (
                    <span key={n} className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full">
                      {n}
                    </span>
                  ))}
                </div>

                {primaryStat && (
                  <div className="flex items-center gap-3 pt-1 border-t border-border">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${PLATFORM_COLORS[primaryStat.platform] ?? 'bg-muted text-muted-foreground'}`}>
                      {primaryStat.platform}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {formatFollowers(primaryStat.followers)} followers
                    </span>
                    {primaryStat.engagement_rate && (
                      <span className="text-xs text-muted-foreground/70">
                        {primaryStat.engagement_rate.toFixed(1)}% eng.
                      </span>
                    )}
                  </div>
                )}

                {creator.rate_min != null && (
                  <p className="text-xs text-muted-foreground/70">
                    Rate: ${creator.rate_min}
                    {creator.rate_max ? `–$${creator.rate_max}` : '+'}
                  </p>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
