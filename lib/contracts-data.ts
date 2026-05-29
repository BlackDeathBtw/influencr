import { createClient } from '@/lib/supabase/server'
import type { ContractWithMilestones } from '@/types/contracts'

export async function getContractsWithMilestones(userId: string): Promise<ContractWithMilestones[]> {
  const supabase = await createClient()

  const { data: contracts } = await supabase
    .from('contracts')
    .select('id, user_id, influencer_id, campaign_id, title, status, payment_model, base_fee, currency, created_at, signed_at, content')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (!contracts || contracts.length === 0) return []

  const contractIds = contracts.map(c => c.id)

  const [{ data: milestones }, { data: influencerRows }] = await Promise.all([
    supabase
      .from('contract_milestones')
      .select('*')
      .in('contract_id', contractIds),
    supabase
      .from('influencers')
      .select('id, name')
      .in('id', contracts.map(c => c.influencer_id).filter(Boolean) as string[]),
  ])

  const milestoneMap = new Map<string, typeof milestones>()
  for (const m of milestones ?? []) {
    const list = milestoneMap.get(m.contract_id) ?? []
    list.push(m)
    milestoneMap.set(m.contract_id, list)
  }

  const influencerMap = new Map<string, { name: string }>()
  for (const inf of influencerRows ?? []) {
    influencerMap.set(inf.id, { name: inf.name })
  }

  return contracts.map(c => ({
    ...c,
    payment_model: (c.payment_model ?? 'flat') as 'flat' | 'milestone' | 'hybrid',
    base_fee: c.base_fee ?? 0,
    currency: c.currency ?? 'USD',
    signed_at: c.signed_at ?? null,
    content: c.content ?? '',
    milestones: milestoneMap.get(c.id) ?? [],
    influencer: c.influencer_id ? (influencerMap.get(c.influencer_id) ?? null) : null,
  }))
}

export async function getContractWithMilestones(userId: string, contractId: string): Promise<ContractWithMilestones | null> {
  const supabase = await createClient()

  const { data: contract } = await supabase
    .from('contracts')
    .select('id, user_id, influencer_id, campaign_id, title, status, payment_model, base_fee, currency, created_at, signed_at, content')
    .eq('user_id', userId)
    .eq('id', contractId)
    .single()

  if (!contract) return null

  const [{ data: milestones }, { data: influencerRow }] = await Promise.all([
    supabase
      .from('contract_milestones')
      .select('*')
      .eq('contract_id', contractId),
    contract.influencer_id
      ? supabase.from('influencers').select('id, name').eq('id', contract.influencer_id).single()
      : Promise.resolve({ data: null }),
  ])

  return {
    ...contract,
    payment_model: (contract.payment_model ?? 'flat') as 'flat' | 'milestone' | 'hybrid',
    base_fee: contract.base_fee ?? 0,
    currency: contract.currency ?? 'USD',
    signed_at: contract.signed_at ?? null,
    content: contract.content ?? '',
    milestones: milestones ?? [],
    influencer: influencerRow ? { name: influencerRow.name } : null,
  }
}
