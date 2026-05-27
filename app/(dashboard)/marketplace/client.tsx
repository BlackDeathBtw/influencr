'use client'

import { useState, useMemo } from 'react'
import { Search, Star, DollarSign, Percent, Users, ExternalLink } from 'lucide-react'
import type { BrandDeal, MarketplaceListingType } from '@/types'

interface Props {
  deals: BrandDeal[]
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

function BrandLogo({ name, logoUrl }: { name: string; logoUrl: string | null }) {
  const [errored, setErrored] = useState(false)
  if (logoUrl && !errored) {
    return (
      <img
        src={logoUrl}
        alt={name}
        className="w-8 h-8 rounded-lg object-contain bg-white border border-border p-0.5"
        onError={() => setErrored(true)}
      />
    )
  }
  return (
    <div className="w-8 h-8 rounded-lg bg-brand/15 flex items-center justify-center text-xs font-bold text-brand border border-border">
      {name[0]?.toUpperCase()}
    </div>
  )
}

function DealCard({ deal }: { deal: BrandDeal }) {
  const [showDesc, setShowDesc] = useState(false)
  const budget = formatBudget(deal.budget_min, deal.budget_max)

  return (
    <div
      className={`bg-card border rounded-xl p-5 flex flex-col gap-3 transition-shadow hover:shadow-sm ${
        deal.is_featured ? 'border-brand/40' : 'border-border'
      }`}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <BrandLogo name={deal.brand_name} logoUrl={deal.logo_url} />
          <div className="flex flex-wrap items-center gap-1.5">
            <span
              className={`text-xs font-medium px-2 py-0.5 rounded-full ${TYPE_COLORS[deal.type]}`}
            >
              {TYPE_LABELS[deal.type]}
            </span>
            {deal.is_featured && (
              <span className="flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
                <Star size={9} />
                Featured
              </span>
            )}
          </div>
        </div>
        <p className="text-xs font-semibold text-foreground shrink-0">{deal.brand_name}</p>
      </div>

      {/* Title + description */}
      <div>
        <p className="font-semibold text-foreground text-sm leading-snug">{deal.title}</p>
        {deal.description && (
          <div className="mt-1">
            <p
              className={`text-xs text-muted-foreground leading-relaxed ${
                showDesc ? '' : 'line-clamp-2'
              }`}
            >
              {deal.description}
            </p>
            <button
              onClick={() => setShowDesc((v) => !v)}
              className="text-xs text-brand/70 hover:text-brand mt-0.5 transition-colors"
            >
              {showDesc ? 'Show less' : 'Read more'}
            </button>
          </div>
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
        {deal.commission_rate != null && (
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Percent size={11} />
            {deal.commission_rate}% commission
          </span>
        )}
        {deal.min_followers != null && (
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Users size={11} />
            {formatFollowers(deal.min_followers)}+ followers
          </span>
        )}
      </div>

      {/* Niches */}
      {deal.niches.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {deal.niches.map((n) => (
            <span
              key={n}
              className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full"
            >
              {n}
            </span>
          ))}
        </div>
      )}

      {/* Platforms */}
      {deal.platforms.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {deal.platforms.map((p) => (
            <span
              key={p}
              className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${
                PLATFORM_COLORS[p] ?? 'bg-muted text-muted-foreground'
              }`}
            >
              {p}
            </span>
          ))}
        </div>
      )}

      {/* Apply */}
      <div className="pt-1 border-t border-border">
        <a
          href={deal.apply_url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 bg-foreground/90 text-background text-xs font-medium px-3 py-1.5 rounded-lg hover:bg-foreground transition-colors"
        >
          Apply <ExternalLink size={11} />
        </a>
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

export default function MarketplaceClient({ deals }: Props) {
  const [typeFilter, setTypeFilter] = useState<MarketplaceListingType | 'all'>('all')
  const [nicheFilter, setNicheFilter] = useState<string | null>(null)
  const [platformFilter, setPlatformFilter] = useState<string | null>(null)
  const [query, setQuery] = useState('')

  const allNiches = useMemo(
    () => Array.from(new Set(deals.flatMap((d) => d.niches))).sort(),
    [deals]
  )
  const allPlatforms = useMemo(
    () => Array.from(new Set(deals.flatMap((d) => d.platforms))).sort(),
    [deals]
  )

  const filtered = useMemo(() => {
    const q = query.toLowerCase()
    return deals.filter((d) => {
      if (typeFilter !== 'all' && d.type !== typeFilter) return false
      if (nicheFilter && !d.niches.includes(nicheFilter)) return false
      if (platformFilter && !d.platforms.includes(platformFilter)) return false
      if (
        q &&
        !d.title.toLowerCase().includes(q) &&
        !(d.description ?? '').toLowerCase().includes(q) &&
        !d.brand_name.toLowerCase().includes(q)
      )
        return false
      return true
    })
  }, [deals, typeFilter, nicheFilter, platformFilter, query])

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Brand Opportunities</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Real brand deals, affiliate programs, and collabs — apply directly
        </p>
      </div>

      {/* Type tabs */}
      <div className="flex gap-1 bg-muted rounded-lg p-1 w-fit mb-5">
        {TYPE_TABS.map((tab) => (
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
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/70"
          />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search brands or programs…"
            className="w-full pl-9 pr-3 py-2 border border-border rounded-lg text-sm"
          />
        </div>

        {allNiches.length > 0 && (
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setNicheFilter(null)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                !nicheFilter
                  ? 'bg-foreground/90 text-background'
                  : 'bg-muted text-muted-foreground hover:bg-border'
              }`}
            >
              All niches
            </button>
            {allNiches.map((n) => (
              <button
                key={n}
                onClick={() => setNicheFilter(nicheFilter === n ? null : n)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  nicheFilter === n
                    ? 'bg-foreground/90 text-background'
                    : 'bg-muted text-muted-foreground hover:bg-border'
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
                !platformFilter
                  ? 'bg-brand/20 text-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-border'
              }`}
            >
              All platforms
            </button>
            {allPlatforms.map((p) => (
              <button
                key={p}
                onClick={() => setPlatformFilter(platformFilter === p ? null : p)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium capitalize transition-colors ${
                  platformFilter === p
                    ? 'bg-brand/20 text-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-border'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        )}
      </div>

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
          {filtered.map((deal) => (
            <DealCard key={deal.id} deal={deal} />
          ))}
        </div>
      )}
    </div>
  )
}
