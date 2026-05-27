import { createClient } from '@/lib/supabase/server'
import ContractsClient from './client'

export default async function ContractsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [{ data: contracts }, { data: influencers }, { data: campaigns }] = await Promise.all([
    supabase
      .from('contracts')
      .select('*, influencer:influencers(name), campaign:campaigns(name)')
      .eq('user_id', user!.id)
      .order('created_at', { ascending: false }),
    supabase.from('influencers').select('id, name').eq('user_id', user!.id).eq('status', 'active'),
    supabase.from('campaigns').select('id, name').eq('user_id', user!.id).in('status', ['planning', 'active']),
  ])

  return (
    <ContractsClient
      contracts={contracts ?? []}
      influencers={influencers ?? []}
      campaigns={campaigns ?? []}
    />
  )
}
