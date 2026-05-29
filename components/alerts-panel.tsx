'use client'

import { useState } from 'react'
import Link from 'next/link'
import type { ReengagementAlert } from '@/types/alerts'

interface Props {
  alerts: ReengagementAlert[]
}

const PLATFORM_COLORS: Record<string, string> = {
  instagram: 'bg-pink-500/15 text-pink-400',
  tiktok: 'bg-cyan-500/15 text-cyan-400',
  youtube: 'bg-red-500/15 text-red-400',
  twitter: 'bg-sky-500/15 text-sky-400',
  linkedin: 'bg-blue-500/15 text-blue-400',
  other: 'bg-zinc-500/15 text-zinc-400',
}

const SEVERITY_DOT: Record<string, string> = {
  high: 'bg-red-400',
  medium: 'bg-amber-400',
  low: 'bg-muted-foreground/40',
}

async function dismissAlert(influencerId: string, alertType: string): Promise<void> {
  await fetch(`/api/alerts/${influencerId}/dismiss`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ alert_type: alertType }),
  })
}

export default function AlertsPanel({ alerts: initialAlerts }: Props) {
  const [alerts, setAlerts] = useState<ReengagementAlert[]>(initialAlerts)
  const [dismissing, setDismissing] = useState<Set<string>>(new Set())

  if (alerts.length === 0) return null

  function removeAlert(id: string) {
    setAlerts(prev => prev.filter(a => a.id !== id))
  }

  async function handleDismiss(alert: ReengagementAlert) {
    setDismissing(prev => new Set(prev).add(alert.id))
    try {
      await dismissAlert(alert.influencer_id, alert.type)
    } finally {
      removeAlert(alert.id)
      setDismissing(prev => {
        const next = new Set(prev)
        next.delete(alert.id)
        return next
      })
    }
  }

  async function handleDismissAll() {
    const current = [...alerts]
    setAlerts([])
    await Promise.allSettled(
      current.map(a => dismissAlert(a.influencer_id, a.type))
    )
  }

  return (
    <div className="bg-amber-500/8 border border-amber-500/20 rounded-xl p-4 mb-6">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-foreground">Re-engagement alerts</span>
          <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-amber-500/15 text-amber-400">
            {alerts.length}
          </span>
        </div>
        <button
          onClick={handleDismissAll}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          Dismiss all
        </button>
      </div>

      <div className="space-y-0">
        {alerts.map(alert => {
          const platformClass = alert.platform
            ? (PLATFORM_COLORS[alert.platform] ?? PLATFORM_COLORS.other)
            : PLATFORM_COLORS.other

          return (
            <div
              key={alert.id}
              className="flex items-center gap-3 py-2.5 border-b border-amber-500/10 last:border-0"
            >
              {/* Severity dot */}
              <div className={`shrink-0 w-2 h-2 rounded-full ${SEVERITY_DOT[alert.severity]}`} />

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-medium text-foreground truncate">
                    {alert.influencer_name}
                  </span>
                  {alert.influencer_handle && (
                    <span className="text-xs text-muted-foreground truncate">
                      @{alert.influencer_handle}
                    </span>
                  )}
                </div>
                <p className="text-sm text-foreground/80 truncate">{alert.message}</p>
              </div>

              {/* Right side */}
              <div className="shrink-0 flex items-center gap-2">
                {alert.platform && (
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${platformClass}`}>
                    {alert.platform}
                  </span>
                )}
                <Link
                  href={alert.action_href}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors whitespace-nowrap"
                >
                  View &rarr;
                </Link>
                <button
                  onClick={() => handleDismiss(alert)}
                  disabled={dismissing.has(alert.id)}
                  aria-label="Dismiss alert"
                  className="text-muted-foreground/60 hover:text-muted-foreground transition-colors disabled:opacity-40"
                >
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M11 3L3 11M3 3l8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
