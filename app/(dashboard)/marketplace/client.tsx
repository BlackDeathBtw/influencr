'use client'

import { useState, useMemo } from 'react'
import { Search, Star, DollarSign, Percent, Users, Calendar, Send, Check, ChevronDown, ChevronUp } from 'lucide-react'
import type { MarketplaceListing, MarketplaceListingType } from '@/types'

interface Props {
  listings: MarketplaceListing[]
  initialAppliedIds: string[]
}

const TYPE_LABELS: Record<MarketplaceListingType, string> = {
  brand_deal: 'Brand Deal',
  affiliate: 'Affiliate',
  collab: 'Collab',
}

const TYPE_COLORS: Record<MarketplaceListingType, string> = {
  brand_deal: 'bg-blue-100 text-blue-700',
  affiliate: 'bg-green-100 text-green-700',
  collab: 'bg-purple-100 text-purple-700',
}

const PLATFORM_COLORS: Record<string, string> = {
  instagram: 'bg-pink-50 text-pink-700',
  tiktok: 'bg-foreground/10 text-foreground',
  youtube: 'bg-red-50 text-red-700',
  twitter: 'bg-sky-50 text-sky-700',
  linkedin: 'bg-blue-50 text-blue-700',
  podcast: 'bg-orange-50 text-orange-700',
  blog: 'bg-amber-50 text-amber-700',
}

function formatFollowers(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`
  return String(n)
}

function formatBudget(min: number | null, max: number | null): string | null {
  if (min == null && max == null) return null
  if (min != null && max != null) return `$${min.toLocaleString()}–$${max.toLocaleString()}`
  if (min != null) return `From $${min.toLocaleString()}`
  return `Up to $${max!.toLocaleString()}`
}

function formatDeadline(dateStr: string | null): string | null {
  if (!dateStr) return null
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function ListingCard({
  listing,
  applied,
  onApply,
}: {
  listing: MarketplaceListing
  applied: boolean
  onApply: (id: string, message: string) => Promise<void>
}) {
  const [expanded, setExpanded] = useState(false)
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(applied)

  const budget = formatBudget(listing.budget_min, listing.budget_max)
  const deadline = formatDeadline(listing.deadline)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    await onApply(listing.id, message)
    setDone(true)
    setLoading(false)
    setExpanded(false)
  }

  return (
    <div className={`bg-card border rounded-xl p-5 flex flex-col gap-3 transition-shadow hover:shadow-sm ${listing.is_featured ? 'border-brand/40' : 'border-border'}`}>
      {/* Header row */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${TYPE_COLORS[listing.type]}`}>
            {TYPE_LABELS[listing.type]}
          </span>
          {listing.is_featured && (
            <span className="flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
              <Star size={9} />
              Featured
            </span>
          )}
        </div>
        {listing.brand_name && (
          <p className="text-xs text-muted-foreground shrink-0">{listing.brand_name}</p>
        )}
      </div>

      {/* Title + description */}
      <div>
        <p className="font-semibold text-foreground text-sm leading-snug">{listing.title}</p>
        {listing.description && (
          <p className="text-xs text-muted-foreground mt-1 line-clamp-2 leading-relaxed">{listing.description}</p>
        )}
      </div>

      {/* Key numbers */}
      <div className="flex flex-wrap gap-3">
        {budget && (
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <DollarSign size={11} />
            {budget}
          </span>
        )}
        {listing.commission_rate != null && (
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Percent size={11} />
            {listing.commission_rate}% commission
          </span>
        )}
        {listing.min_followers != null && (
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Users size={11} />
            {formatFollowers(listing.min_followers)}+ followers
          </span>
        )}
        {deadline && (
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Calendar size={11} />
            {deadline}
          </span>
        )}
      </div>

      {/* Niches */}
      {listing.niches && listing.niches.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {listing.niches.map(n => (
            <span key={n} className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full">
              {n}
            </span>
          ))}
        </div>
      )}

      {/* Platforms */}
      {listing.platforms && listing.platforms.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {listing.platforms.map(p => (
            <span key={p} className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${PLATFORM_COLORS[p] ?? 'bg-muted text-muted-foreground'}`}>
              {p}
            </span>
          ))}
        </div>
      )}

      {/* Express Interest */}
      <div className="pt-1 border-t border-border">
        {done ? (
          <div className="flex items-center gap-1.5 text-xs text-green-700 font-medium py-1">
            <Check size={13} />
            Application sent
          </div>
        ) : expanded ? (
          <form onSubmit={handleSubmit} className="space-y-2">
            <textarea
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder="Tell them about yourself and why you're a great fit…"
              rows={3}
              className="w-full text-xs border border-border rounded-lg px-3 py-2 resize-none focus:outline-none focus:ring-1 focus:ring-brand/40"
            />
            <div className="flex items-center gap-2">
              <button
                type="submit"
                disabled={loading}
                className="flex items-center gap-1.5 bg-foreground/90 text-background text-xs font-medium px-3 py-1.5 rounded-lg hover:bg-foreground disabled:opacity-50 transition-colors"
              >
                <Send size={11} />
                {loading ? 'Sending…' : 'Send application'}
              </button>
              <button
                type="button"
                onClick={() => setExpanded(false)}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <button
            onClick={() => setExpanded(true)}
            className="flex items-center gap-1.5 text-xs font-medium text-foreground hover:text-brand transition-colors py-1"
          >
            <ChevronDown size={13} />
            Express interest
          </button>
        )}
      </div>
    </div>
  )
}

const TYPE_TABS: { id: MarketplaceListingType | 'all'; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'brand_deal', label: 'Brand Deals' },
  { id: 'affiliate', label: 'Affiliate' },
  { id: 'collab', label: 'Collabs' },
]

export default function MarketplaceClient({ listings, initialAppliedIds }: Props) {
  const [appliedIds, setAppliedIds] = useState<Set<string>>(new Set(initialAppliedIds))
  const [typeFilter, setTypeFilter] = useState<MarketplaceListingType | 'all'>('all')
  const [nicheFilter, setNicheFilter] = useState<string | null>(null)
  const [platformFilter, setPlatformFilter] = useState<string | null>(null)
  const [query, setQuery] = useState('')

  const allNiches = useMemo(
    () => Array.from(new Set(listings.flatMap(l => l.niches ?? []))).sort(),
    [listings]
  )
  const allPlatforms = useMemo(
    () => Array.from(new Set(listings.flatMap(l => l.platforms ?? []))).sort(),
    [listings]
  )

  const filtered = useMemo(() => {
    const q = query.toLowerCase()
    return listings.filter(l => {
      if (typeFilter !== 'all' && l.type !== typeFilter) return false
      if (nicheFilter && !(l.niches ?? []).includes(nicheFilter)) return false
      if (platformFilter && !(l.platforms ?? []).includes(platformFilter)) return false
      if (q && !l.title.toLowerCase().includes(q) && !(l.description ?? '').toLowerCase().includes(q) && !(l.brand_name ?? '').toLowerCase().includes(q)) return false
      return true
    })
  }, [listings, typeFilter, nicheFilter, platformFilter, query])

  async function handleApply(listingId: string, message: string) {
    const res = await fetch(`/api/marketplace/${listingId}/apply`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message }),
    })
    if (res.ok || res.status === 409) {
      setAppliedIds(prev => new Set([...prev, listingId]))
    }
  }

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Opportunities</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Browse brand deals, affiliate programs, and collaboration opportunities
        </p>
      </div>

      {/* Type tabs */}
      <div className="flex gap-1 bg-muted rounded-lg p-1 w-fit mb-5">
        {TYPE_TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setTypeFilter(tab.id)}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              typeFilter === tab.id
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Search + filters */}
      <div className="space-y-3 mb-6">
        <div className="relative max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/70" />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search opportunities…"
            className="w-full pl-9 pr-3 py-2 border border-border rounded-lg text-sm"
          />
        </div>

        {allNiches.length > 0 && (
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setNicheFilter(null)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                !nicheFilter ? 'bg-foreground/90 text-background' : 'bg-muted text-muted-foreground hover:bg-border'
              }`}
            >
              All niches
            </button>
            {allNiches.map(n => (
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

        {allPlatforms.length > 0 && (
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setPlatformFilter(null)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                !platformFilter ? 'bg-brand/20 text-foreground' : 'bg-muted text-muted-foreground hover:bg-border'
              }`}
            >
              All platforms
            </button>
            {allPlatforms.map(p => (
              <button
                key={p}
                onClick={() => setPlatformFilter(platformFilter === p ? null : p)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium capitalize transition-colors ${
                  platformFilter === p ? 'bg-brand/20 text-foreground' : 'bg-muted text-muted-foreground hover:bg-border'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Result count */}
      <p className="text-xs text-muted-foreground mb-4">
        {filtered.length} opportunit{filtered.length !== 1 ? 'ies' : 'y'}
        {typeFilter !== 'all' ? ` · ${TYPE_LABELS[typeFilter]}` : ''}
        {nicheFilter ? ` · ${nicheFilter}` : ''}
        {platformFilter ? ` · ${platformFilter}` : ''}
      </p>

      {filtered.length === 0 ? (
        <div className="bg-card border border-border rounded-xl py-16 text-center">
          <p className="text-muted-foreground/70 text-sm">No opportunities match your filters</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(listing => (
            <ListingCard
              key={listing.id}
              listing={listing}
              applied={appliedIds.has(listing.id)}
              onApply={handleApply}
            />
          ))}
        </div>
      )}
    </div>
  )
}
