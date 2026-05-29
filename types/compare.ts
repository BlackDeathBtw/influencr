import type { Influencer } from '@/types'

export interface ComparisonMetric {
  key: keyof Influencer | string
  label: string
  format: 'number' | 'percent' | 'currency' | 'text' | 'badge'
  highlight: 'highest' | 'lowest' | 'none'
}

export const COMPARISON_METRICS: ComparisonMetric[] = [
  { key: 'platform', label: 'Platform', format: 'badge', highlight: 'none' },
  { key: 'followers', label: 'Followers', format: 'number', highlight: 'highest' },
  { key: 'engagement_rate', label: 'Engagement Rate', format: 'percent', highlight: 'highest' },
  { key: 'niche', label: 'Niche', format: 'text', highlight: 'none' },
  { key: 'status', label: 'Status', format: 'badge', highlight: 'none' },
  { key: 'outreach_status', label: 'Outreach', format: 'badge', highlight: 'none' },
  { key: 'contact_email', label: 'Has Email', format: 'text', highlight: 'none' },
]
