import { createClient } from '@/lib/supabase/server'
import PipelineClient from './client'

export interface PipelineDeal {
  id: string
  brand_name: string
  amount_estimate: number | null
  notes: string | null
  stage: string
  created_at: string
  updated_at: string
}

export default async function PipelinePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: deals } = await supabase
    .from('creator_pipeline')
    .select('*')
    .eq('creator_id', user!.id)
    .order('created_at', { ascending: false })

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="font-display text-2xl font-bold text-foreground">Deal Pipeline</h1>
        <p className="text-sm text-muted-foreground mt-1">Track brand deals from prospecting to completion</p>
      </div>
      <PipelineClient deals={(deals ?? []) as PipelineDeal[]} />
    </div>
  )
}
