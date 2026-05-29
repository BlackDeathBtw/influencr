'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { X, Search, Users } from 'lucide-react'
import type { Influencer } from '@/types'
import { COMPARISON_METRICS } from '@/types/compare'
import { formatNumber } from '@/lib/utils'

interface Props {
  allInfluencers: Influencer[]
  selectedInfluencers: Influencer[]
}

const platformColors: Record<string, string> = {
  instagram: 'bg-pink-500/15 text-pink-400',
  tiktok: 'bg-foreground/10 text-foreground/80',
  youtube: 'bg-red-500/15 text-red-400',
  twitter: 'bg-sky-500/15 text-sky-400',
  linkedin: 'bg-blue-500/15 text-blue-400',
  other: 'bg-muted text-muted-foreground',
}

const statusColors: Record<string, string> = {
  prospect: 'bg-muted text-muted-foreground',
  active: 'bg-green-500/15 text-green-400',
  inactive: 'bg-muted text-muted-foreground/60',
}

const outreachColors: Record<string, string> = {
  not_contacted: 'bg-muted text-muted-foreground',
  reached_out: 'bg-sky-500/15 text-sky-400',
  responded: 'bg-green-500/15 text-green-400',
  declined: 'bg-red-500/15 text-red-400',
}

function formatLabel(key: string, value: string): string {
  return value.replace(/_/g, ' ')
}

function BadgeCell({ metricKey, value }: { metricKey: string; value: string | null }) {
  if (!value) return <span className="text-muted-foreground/40">—</span>

  let colorClass = 'bg-muted text-muted-foreground'
  if (metricKey === 'platform') {
    colorClass = platformColors[value] ?? 'bg-muted text-muted-foreground'
  } else if (metricKey === 'status') {
    colorClass = statusColors[value] ?? 'bg-muted text-muted-foreground'
  } else if (metricKey === 'outreach_status') {
    colorClass = outreachColors[value] ?? 'bg-muted text-muted-foreground'
  }

  return (
    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${colorClass}`}>
      {formatLabel(metricKey, value)}
    </span>
  )
}

export default function CreatorComparison({ allInfluencers, selectedInfluencers }: Props) {
  const router = useRouter()
  const [selected, setSelected] = useState<Influencer[]>(selectedInfluencers)
  const [search, setSearch] = useState('')

  const updateUrl = useCallback(
    (next: Influencer[]) => {
      if (next.length === 0) {
        router.replace('/compare')
      } else {
        router.replace(`/compare?ids=${next.map((i) => i.id).join(',')}`)
      }
    },
    [router]
  )

  const addInfluencer = useCallback(
    (inf: Influencer) => {
      if (selected.length >= 5) return
      if (selected.some((s) => s.id === inf.id)) return
      const next = [...selected, inf]
      setSelected(next)
      updateUrl(next)
    },
    [selected, updateUrl]
  )

  const removeInfluencer = useCallback(
    (id: string) => {
      const next = selected.filter((s) => s.id !== id)
      setSelected(next)
      updateUrl(next)
    },
    [selected, updateUrl]
  )

  const clearAll = useCallback(() => {
    setSelected([])
    router.replace('/compare')
  }, [router])

  const selectedIds = new Set(selected.map((s) => s.id))
  const searchLower = search.toLowerCase()
  const filteredInfluencers = allInfluencers.filter((inf) => {
    if (selectedIds.has(inf.id)) return false
    if (!searchLower) return true
    return (
      inf.name.toLowerCase().includes(searchLower) ||
      (inf.handle ?? '').toLowerCase().includes(searchLower) ||
      (inf.niche ?? '').toLowerCase().includes(searchLower)
    )
  })

  // Compute best values for highlight columns
  const highlightMap = new Map<string, string | null>()
  for (const metric of COMPARISON_METRICS) {
    if (metric.highlight === 'none' || selected.length < 2) {
      highlightMap.set(metric.key, null)
      continue
    }
    const values = selected.map((inf) => {
      const val = (inf as any)[metric.key]
      return typeof val === 'number' ? val : null
    })
    const validValues = values.filter((v): v is number => v !== null)
    if (validValues.length === 0) {
      highlightMap.set(metric.key, null)
      continue
    }
    const best =
      metric.highlight === 'highest' ? Math.max(...validValues) : Math.min(...validValues)
    // Store as string for comparison
    highlightMap.set(metric.key, String(best))
  }

  function getCellValue(inf: Influencer, metricKey: string): unknown {
    return (inf as any)[metricKey]
  }

  function isBestCell(inf: Influencer, metricKey: string): boolean {
    const best = highlightMap.get(metricKey)
    if (best === null || best === undefined) return false
    const val = getCellValue(inf, metricKey)
    return typeof val === 'number' && String(val) === best
  }

  function renderCellContent(inf: Influencer, metricKey: string, format: string): React.ReactNode {
    const raw = getCellValue(inf, metricKey)

    if (raw === null || raw === undefined || raw === '') {
      if (metricKey === 'contact_email') return <span className="text-muted-foreground/40">No</span>
      return <span className="text-muted-foreground/40">—</span>
    }

    if (metricKey === 'contact_email') {
      return <span className="text-green-400 text-xs font-medium">Yes</span>
    }

    if (format === 'badge') {
      return <BadgeCell metricKey={metricKey} value={String(raw)} />
    }

    if (format === 'number') {
      return typeof raw === 'number' ? formatNumber(raw) : String(raw)
    }

    if (format === 'percent') {
      return typeof raw === 'number' ? `${raw}%` : String(raw)
    }

    return String(raw)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Compare creators</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Select up to 5 creators to compare side by side
        </p>
      </div>

      {/* Creator picker */}
      <div className="bg-card border border-border rounded-xl p-5 space-y-4">
        <div className="relative">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
          />
          <input
            type="text"
            placeholder="Search by name, handle, or niche…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-lg bg-background border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-border"
          />
        </div>

        {/* Selectable chips */}
        {filteredInfluencers.length > 0 ? (
          <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto">
            {filteredInfluencers.map((inf) => (
              <button
                key={inf.id}
                onClick={() => addInfluencer(inf)}
                disabled={selected.length >= 5}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {inf.name}
                {inf.handle && (
                  <span className="text-muted-foreground/50">@{inf.handle}</span>
                )}
              </button>
            ))}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground/60 py-2">
            {search ? 'No creators match your search' : 'All creators are already selected'}
          </p>
        )}
      </div>

      {/* Selected creators */}
      {selected.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Selected ({selected.length}/5)
            </p>
            <button
              onClick={clearAll}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Clear all
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {selected.map((inf) => (
              <div
                key={inf.id}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-foreground/10 text-foreground"
              >
                <span>{inf.name}</span>
                <button
                  onClick={() => removeInfluencer(inf.id)}
                  className="text-muted-foreground hover:text-foreground transition-colors ml-0.5"
                  aria-label={`Remove ${inf.name}`}
                >
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Comparison table */}
      {selected.length >= 2 ? (
        <div className="w-full overflow-x-auto">
          <table className="w-full text-sm bg-card border border-border rounded-xl overflow-hidden">
            <thead>
              <tr className="border-b border-border">
                {/* Empty corner cell */}
                <th className="sticky left-0 z-10 bg-card px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide min-w-[140px]">
                  Metric
                </th>
                {selected.map((inf) => (
                  <th
                    key={inf.id}
                    className="px-4 py-3 text-center font-medium text-foreground border-b border-border min-w-[160px]"
                  >
                    <div className="flex flex-col items-center gap-1.5">
                      <span className="font-semibold text-foreground">{inf.name}</span>
                      <div className="flex items-center gap-1.5">
                        {inf.platform && (
                          <span
                            className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                              platformColors[inf.platform] ?? 'bg-muted text-muted-foreground'
                            }`}
                          >
                            {inf.platform}
                          </span>
                        )}
                        <button
                          onClick={() => removeInfluencer(inf.id)}
                          className="text-muted-foreground hover:text-foreground transition-colors"
                          aria-label={`Remove ${inf.name}`}
                        >
                          <X size={13} />
                        </button>
                      </div>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {COMPARISON_METRICS.map((metric, rowIdx) => (
                <tr
                  key={metric.key}
                  className={rowIdx % 2 === 0 ? 'bg-card' : 'bg-muted/10'}
                >
                  <td className="sticky left-0 z-10 px-4 py-3 text-xs text-muted-foreground font-medium bg-muted/20">
                    {metric.label}
                  </td>
                  {selected.map((inf) => {
                    const best = isBestCell(inf, metric.key)
                    return (
                      <td
                        key={inf.id}
                        className={`px-4 py-3 text-center text-sm ${
                          best ? 'text-green-400 font-semibold' : 'text-foreground'
                        }`}
                      >
                        {renderCellContent(inf, metric.key, metric.format)}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Users size={40} className="text-muted-foreground/30 mb-4" />
          <p className="text-muted-foreground text-sm">
            Select at least 2 creators to compare
          </p>
        </div>
      )}
    </div>
  )
}
