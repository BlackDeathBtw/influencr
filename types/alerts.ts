export type AlertType = 'gone_quiet' | 'campaign_idle' | 'high_value_prospect' | 'past_collaborator'
export type AlertSeverity = 'high' | 'medium' | 'low'

export interface ReengagementAlert {
  id: string
  type: AlertType
  severity: AlertSeverity
  influencer_id: string
  influencer_name: string
  influencer_handle?: string
  platform?: string
  followers?: number
  message: string
  days_inactive?: number
  campaign_name?: string
  action_href: string
}
