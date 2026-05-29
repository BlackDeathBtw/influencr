import { createClient } from '@/lib/supabase/server'
import type { ReengagementAlert, AlertType, AlertSeverity } from '@/types/alerts'

const SEVERITY_RANK: Record<AlertSeverity, number> = { high: 3, medium: 2, low: 1 }

function daysAgo(n: number): Date {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d
}

function daysBetween(date: string): number {
  return Math.floor((Date.now() - new Date(date).getTime()) / 86_400_000)
}

export async function getReengagementAlerts(userId: string): Promise<ReengagementAlert[]> {
  try {
    const supabase = await createClient()

    // Fetch influencers
    const { data: influencers, error: infError } = await supabase
      .from('influencers')
      .select('id, name, handle, platform, followers, status, outreach_status, updated_at')
      .eq('user_id', userId)

    if (infError || !influencers) return []

    // Fetch user's campaign IDs then campaign_influencers with campaign name
    const { data: userCampaigns } = await supabase
      .from('campaigns')
      .select('id, name')
      .eq('user_id', userId)

    const campaignMap: Record<string, string> = {}
    for (const c of userCampaigns ?? []) campaignMap[c.id] = c.name

    const campaignIds = Object.keys(campaignMap)

    const { data: campaignInfluencers } = campaignIds.length > 0
      ? await supabase
          .from('campaign_influencers')
          .select('influencer_id, campaign_id, updated_at')
          .in('campaign_id', campaignIds)
      : { data: [] }

    // Fetch recent dismissals (last 7 days) for this user
    const sevenDaysAgo = daysAgo(7).toISOString()
    const { data: dismissals } = await supabase
      .from('alert_dismissals')
      .select('influencer_id, alert_type')
      .eq('user_id', userId)
      .gte('dismissed_at', sevenDaysAgo)

    const dismissedSet = new Set<string>(
      (dismissals ?? []).map((d: { influencer_id: string; alert_type: string }) =>
        `${d.alert_type}:${d.influencer_id}`
      )
    )

    // Build a map: influencer_id -> best (highest severity) campaign_influencer record
    const ciByInfluencer: Record<string, { updated_at: string; campaign_id: string }> = {}
    for (const ci of campaignInfluencers ?? []) {
      const existing = ciByInfluencer[ci.influencer_id]
      if (!existing || new Date(ci.updated_at) > new Date(existing.updated_at)) {
        ciByInfluencer[ci.influencer_id] = ci
      }
    }

    const cutoffs = {
      gone_quiet: daysAgo(14).toISOString(),
      campaign_idle: daysAgo(21).toISOString(),
      past_collaborator: daysAgo(60).toISOString(),
    }

    const rawAlerts: ReengagementAlert[] = []

    for (const inf of influencers) {
      const candidates: ReengagementAlert[] = []

      // 1. Gone quiet
      if (
        inf.outreach_status === 'reached_out' &&
        inf.updated_at < cutoffs.gone_quiet &&
        !dismissedSet.has(`gone_quiet:${inf.id}`)
      ) {
        const days = daysBetween(inf.updated_at)
        candidates.push({
          id: `gone_quiet-${inf.id}`,
          type: 'gone_quiet',
          severity: 'high',
          influencer_id: inf.id,
          influencer_name: inf.name,
          influencer_handle: inf.handle ?? undefined,
          platform: inf.platform ?? undefined,
          followers: inf.followers ?? undefined,
          message: `Reached out ${days} days ago with no response — follow up now`,
          days_inactive: days,
          action_href: `/influencers/${inf.id}`,
        })
      }

      // 2. Campaign idle
      const ci = ciByInfluencer[inf.id]
      if (
        ci &&
        ci.updated_at < cutoffs.campaign_idle &&
        !dismissedSet.has(`campaign_idle:${inf.id}`)
      ) {
        const days = daysBetween(ci.updated_at)
        candidates.push({
          id: `campaign_idle-${inf.id}`,
          type: 'campaign_idle',
          severity: 'medium',
          influencer_id: inf.id,
          influencer_name: inf.name,
          influencer_handle: inf.handle ?? undefined,
          platform: inf.platform ?? undefined,
          followers: inf.followers ?? undefined,
          message: `No campaign activity for ${days} days`,
          days_inactive: days,
          campaign_name: campaignMap[ci.campaign_id],
          action_href: `/influencers/${inf.id}`,
        })
      }

      // 3. High-value prospect
      if (
        inf.status === 'prospect' &&
        (inf.followers ?? 0) >= 50_000 &&
        (inf.outreach_status === null || inf.outreach_status === 'not_contacted') &&
        !dismissedSet.has(`high_value_prospect:${inf.id}`)
      ) {
        candidates.push({
          id: `high_value_prospect-${inf.id}`,
          type: 'high_value_prospect',
          severity: 'medium',
          influencer_id: inf.id,
          influencer_name: inf.name,
          influencer_handle: inf.handle ?? undefined,
          platform: inf.platform ?? undefined,
          followers: inf.followers ?? undefined,
          message: `${((inf.followers ?? 0) / 1000).toFixed(0)}k followers — never contacted`,
          action_href: `/influencers/${inf.id}`,
        })
      }

      // 4. Past collaborator
      if (
        inf.status === 'inactive' &&
        inf.updated_at < cutoffs.past_collaborator &&
        !dismissedSet.has(`past_collaborator:${inf.id}`)
      ) {
        const days = daysBetween(inf.updated_at)
        candidates.push({
          id: `past_collaborator-${inf.id}`,
          type: 'past_collaborator',
          severity: 'low',
          influencer_id: inf.id,
          influencer_name: inf.name,
          influencer_handle: inf.handle ?? undefined,
          platform: inf.platform ?? undefined,
          followers: inf.followers ?? undefined,
          message: `Inactive for ${days} days — worth re-engaging`,
          days_inactive: days,
          action_href: `/influencers/${inf.id}`,
        })
      }

      if (candidates.length === 0) continue

      // Keep highest severity per influencer
      candidates.sort((a, b) => SEVERITY_RANK[b.severity] - SEVERITY_RANK[a.severity])
      rawAlerts.push(candidates[0])
    }

    // Sort by severity descending, limit to 20
    rawAlerts.sort((a, b) => SEVERITY_RANK[b.severity] - SEVERITY_RANK[a.severity])
    return rawAlerts.slice(0, 20)
  } catch {
    return []
  }
}
