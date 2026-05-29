export type MilestoneMetric = 'impressions' | 'clicks' | 'posts' | 'conversions' | 'views' | 'custom'
export type MilestoneStatus = 'pending' | 'achieved' | 'failed' | 'disputed'
export type PaymentModel = 'flat' | 'milestone' | 'hybrid'

export interface ContractMilestone {
  id: string
  contract_id: string
  title: string
  metric: MilestoneMetric
  target_value: number
  bonus_amount: number
  achieved_value: number
  status: MilestoneStatus
  due_date: string | null
  achieved_at: string | null
  notes: string | null
  created_at: string
}

export interface ContractWithMilestones {
  id: string
  user_id: string
  influencer_id: string | null
  campaign_id: string | null
  title: string
  status: 'draft' | 'sent' | 'signed' | 'declined'
  payment_model: PaymentModel
  base_fee: number
  currency: string
  created_at: string
  signed_at: string | null
  content: string
  milestones: ContractMilestone[]
  influencer: { name: string } | null
}
