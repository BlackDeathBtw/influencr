export type CredibilityLevel = 'credible' | 'check' | 'low' | 'unknown'

export interface CredibilityResult {
  level: CredibilityLevel
  score: number | null
  label: string
  color: string
}

function expectedEngagement(followers: number): number {
  if (followers < 10_000) return 0.055
  if (followers < 100_000) return 0.030
  if (followers < 500_000) return 0.015
  return 0.008
}

export function getCredibility(followers: number | null, engagementRate: number | null): CredibilityResult {
  if (!followers || followers < 500) {
    return { level: 'unknown', score: null, label: 'No data', color: 'text-muted-foreground/50' }
  }
  if (!engagementRate) {
    return { level: 'unknown', score: null, label: 'No eng. rate', color: 'text-muted-foreground/50' }
  }

  const expected = expectedEngagement(followers)
  const ratio = (engagementRate / 100) / expected
  const score = Math.min(Math.round(ratio * 100), 100)

  if (score >= 65) return { level: 'credible', score, label: 'Credible', color: 'text-green-400' }
  if (score >= 35) return { level: 'check', score, label: 'Check', color: 'text-amber-400' }
  return { level: 'low', score, label: 'Low signal', color: 'text-red-400' }
}
