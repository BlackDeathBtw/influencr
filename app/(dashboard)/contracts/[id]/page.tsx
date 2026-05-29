import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getContractWithMilestones } from '@/lib/contracts-data'
import ContractEditor from '@/components/contract-editor'
import MilestoneTracker from '@/components/milestone-tracker'

interface Props {
  params: Promise<{ id: string }>
}

export default async function EditContractPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [contract, { data: influencers }, { data: campaigns }] = await Promise.all([
    getContractWithMilestones(user!.id, id),
    supabase.from('influencers').select('id, name').eq('user_id', user!.id).eq('status', 'active'),
    supabase.from('campaigns').select('id, name').eq('user_id', user!.id).in('status', ['planning', 'active']),
  ])

  if (!contract) notFound()

  return (
    <div className="max-w-3xl mx-auto">
      <ContractEditor
        contract={contract}
        influencers={influencers ?? []}
        campaigns={campaigns ?? []}
      />

      {contract.milestones.length > 0 && (
        <div className="px-8 pb-8">
          <MilestoneTracker
            contractId={contract.id}
            milestones={contract.milestones}
          />
        </div>
      )}
    </div>
  )
}
