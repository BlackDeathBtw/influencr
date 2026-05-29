import { createClient } from '@/lib/supabase/server'
import ContractEditor from '@/components/contract-editor'

export default async function NewContractPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [{ data: influencers }, { data: campaigns }] = await Promise.all([
    supabase.from('influencers').select('id, name').eq('user_id', user!.id).eq('status', 'active'),
    supabase.from('campaigns').select('id, name').eq('user_id', user!.id).in('status', ['planning', 'active']),
  ])

  return (
    <ContractEditor
      influencers={influencers ?? []}
      campaigns={campaigns ?? []}
    />
  )
}
