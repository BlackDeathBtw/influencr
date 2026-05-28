import { createClient } from '@/lib/supabase/server'
import { ClipboardList } from 'lucide-react'
import BriefBuilderClient from './client'

export default async function BriefBuilderPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [{ data: campaigns }, { data: briefs }] = await Promise.all([
    supabase
      .from('campaigns')
      .select('id, name')
      .eq('user_id', user!.id)
      .order('name'),
    supabase
      .from('campaign_briefs')
      .select('*, campaign:campaigns(name)')
      .eq('user_id', user!.id)
      .order('created_at', { ascending: false }),
  ])

  return (
    <div className="p-8">
      <div className="flex items-center gap-3 mb-8">
        <ClipboardList size={22} className="text-muted-foreground" />
        <div>
          <h1 className="text-2xl font-bold text-foreground">Brief Builder</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Create shareable campaign briefs for your creators
          </p>
        </div>
      </div>

      <BriefBuilderClient
        campaigns={campaigns ?? []}
        briefs={(briefs ?? []) as any}
      />
    </div>
  )
}
